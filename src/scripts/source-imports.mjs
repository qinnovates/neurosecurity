/**
 * Reads what one source file imports, with the TypeScript parser, so that
 * spacing, comments, quote style and line breaks cannot hide an import.
 *
 * It reports four things: the specifiers the file imports, the literal globs
 * it expands, every import it cannot follow (a computed `import()`, a computed
 * glob, `createRequire`), and whether the file reads files itself, with the
 * string literals it holds, so a caller can tell a build-time read of a data
 * file from a read of anything else.
 *
 * An `.astro` file is read as its frontmatter and its `<script>` blocks. An
 * `import()` written inside an `.astro` template expression is not seen; the
 * built-page check is what covers that.
 */

import ts from 'typescript';

const FRONTMATTER_PATTERN = /^﻿?---\r?\n([\s\S]*?)\r?\n---/;
const SCRIPT_BLOCK_PATTERN = /<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi;
const ASTRO_EXTENSION = '.astro';
const JSX_EXTENSION_PATTERN = /\.[cm]?[jt]sx$/;
const GLOB_FUNCTION_NAMES = ['glob', 'globEager'];
const REQUIRE_FUNCTION_NAME = 'require';
/** Modules that read files or load modules by a path the parser cannot see. */
const FILE_SYSTEM_MODULES = ['fs', 'node:fs', 'fs/promises', 'node:fs/promises'];
const MODULE_LOADER_MODULES = ['module', 'node:module'];

/**
 * @typedef {object} SourceImports
 * @property {string[]} specifiers every module specifier imported at run or build time; type-only statements are left out
 * @property {string[]} globs every literal glob pattern expanded
 * @property {string[]} unfollowable what the file imports in a way that cannot be followed, in words
 * @property {boolean} readsFiles whether the file imports a file-system module
 * @property {string[]} literals the text of every string and template literal in the file
 */

/** The parts of a file that hold code: the whole file, or an `.astro` file's frontmatter and script blocks. */
function listCodeBlocks(filePath, sourceText) {
  if (!filePath.endsWith(ASTRO_EXTENSION)) return [sourceText];
  const frontmatter = FRONTMATTER_PATTERN.exec(sourceText)?.[1] ?? '';
  return [frontmatter, ...[...sourceText.matchAll(SCRIPT_BLOCK_PATTERN)].map((match) => match[1])];
}

function isLiteralText(node) {
  return node !== undefined && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node));
}

function isGlobCall(node) {
  const callee = node.expression;
  if (!ts.isPropertyAccessExpression(callee) || !GLOB_FUNCTION_NAMES.includes(callee.name.text)) return false;
  const owner = callee.expression;
  return ts.isMetaProperty(owner) || (ts.isIdentifier(owner) && owner.text === 'Astro');
}

function readGlobArgument(argument, found) {
  const patterns = argument !== undefined && ts.isArrayLiteralExpression(argument) ? [...argument.elements] : [argument];
  if (patterns.every(isLiteralText)) found.globs.push(...patterns.map((pattern) => pattern.text));
  else found.unfollowable.push('a glob whose pattern is computed');
}

function readCall(node, found) {
  const [argument] = node.arguments;
  const isRequire = ts.isIdentifier(node.expression) && node.expression.text === REQUIRE_FUNCTION_NAME;
  if (node.expression.kind === ts.SyntaxKind.ImportKeyword || isRequire) {
    if (isLiteralText(argument)) found.specifiers.push(argument.text);
    else found.unfollowable.push(`${isRequire ? 'require()' : 'import()'} whose argument is computed`);
  } else if (isGlobCall(node)) {
    readGlobArgument(argument, found);
  }
}

function readStatement(node, found) {
  if (ts.isImportDeclaration(node) && node.importClause?.isTypeOnly !== true) found.specifiers.push(node.moduleSpecifier.text);
  if (ts.isExportDeclaration(node) && node.moduleSpecifier !== undefined && !node.isTypeOnly) found.specifiers.push(node.moduleSpecifier.text);
  if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) && isLiteralText(node.moduleReference.expression)) {
    found.specifiers.push(node.moduleReference.expression.text);
  }
}

function visit(node, found) {
  readStatement(node, found);
  if (ts.isCallExpression(node)) readCall(node, found);
  if (isLiteralText(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) found.literals.push(node.text);
  ts.forEachChild(node, (child) => visit(child, found));
}

/**
 * @param {string} filePath repository path, used for its extension
 * @param {string} sourceText
 * @returns {SourceImports}
 */
export function readSourceImports(filePath, sourceText) {
  const found = { specifiers: [], globs: [], unfollowable: [], literals: [] };
  const scriptKind = JSX_EXTENSION_PATTERN.test(filePath) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  for (const block of listCodeBlocks(filePath, sourceText)) {
    visit(ts.createSourceFile(filePath, block, ts.ScriptTarget.Latest, false, scriptKind), found);
  }
  if (found.specifiers.some((specifier) => MODULE_LOADER_MODULES.includes(specifier))) found.unfollowable.push('a module loader (node:module), whose createRequire loads files by a computed path');
  return { ...found, readsFiles: found.specifiers.some((specifier) => FILE_SYSTEM_MODULES.includes(specifier)) };
}
