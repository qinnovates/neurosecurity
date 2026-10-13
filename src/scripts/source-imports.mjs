/**
 * Reads what one source file imports, with the TypeScript parser, so that
 * spacing, comments, quote style and line breaks cannot hide an import.
 *
 * It reports four things: the specifiers the file imports (including a file
 * named by `new URL('./x', import.meta.url)`, which is how a worker or an asset
 * is reached), the literal globs it expands, every import it cannot follow (a
 * computed `import()`, a computed glob, `createRequire`), and the modules it
 * imports that read files or run commands at build time.
 *
 * An `.astro` file is read as its frontmatter, its `<script>` blocks and the
 * files its script tags name. An
 * `import()` written inside an `.astro` template expression is not seen; the
 * built-page check is what covers that.
 */

import ts from 'typescript';

const FRONTMATTER_PATTERN = /^﻿?---\r?\n([\s\S]*?)\r?\n---/;
const SCRIPT_BLOCK_PATTERN = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
/** `<script src="./x.ts">` in an `.astro` file: the file named is bundled into the page like any import. */
const SCRIPT_SOURCE_PATTERN = /\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)')/i;
const ASTRO_EXTENSION = '.astro';
const JSX_EXTENSION_PATTERN = /\.[cm]?[jt]sx$/;
const GLOB_FUNCTION_NAMES = ['glob', 'globEager'];
const REQUIRE_FUNCTION_NAME = 'require';
/** Modules that read files or run commands, by a path or a command the parser cannot see. */
const FILE_ACCESS_MODULES = ['fs', 'node:fs', 'fs/promises', 'node:fs/promises', 'child_process', 'node:child_process'];
const URL_CLASS_NAME = 'URL';
const MODULE_LOADER_MODULES = ['module', 'node:module'];

/**
 * @typedef {object} SourceImports
 * @property {string[]} specifiers every module specifier imported at run or build time; type-only statements are left out
 * @property {string[]} globs every literal glob pattern expanded
 * @property {string[]} unfollowable what the file imports in a way that cannot be followed, in words
 * @property {string[]} fileAccessModules the file-system and child-process modules the file imports
 */

/** The parts of a file that hold code, and the files its script tags name: the whole file, or an `.astro` file's frontmatter and script blocks. */
function listCodeBlocks(filePath, sourceText) {
  if (!filePath.endsWith(ASTRO_EXTENSION)) return { blocks: [sourceText], scriptSources: [] };
  const frontmatter = FRONTMATTER_PATTERN.exec(sourceText)?.[1] ?? '';
  const scripts = [...sourceText.matchAll(SCRIPT_BLOCK_PATTERN)];
  const scriptSources = scripts.map((match) => SCRIPT_SOURCE_PATTERN.exec(match[1])).filter((source) => source !== null).map((source) => source[1] ?? source[2]);
  return { blocks: [frontmatter, ...scripts.map((match) => match[2])], scriptSources };
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

/** `import.meta.url`, the second argument that makes a `new URL(...)` name a file beside the source. */
function isImportMetaUrl(node) {
  return node !== undefined && ts.isPropertyAccessExpression(node) && node.name.text === 'url' && ts.isMetaProperty(node.expression);
}

/** `new URL('./worker.ts', import.meta.url)`: the bundler emits the file named, so it is an edge like an import. */
function readNewUrl(node, found) {
  const [target, base] = node.arguments ?? [];
  if (ts.isIdentifier(node.expression) && node.expression.text === URL_CLASS_NAME && isImportMetaUrl(base) && isLiteralText(target)) found.specifiers.push(target.text);
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
  if (ts.isNewExpression(node)) readNewUrl(node, found);
  ts.forEachChild(node, (child) => visit(child, found));
}

/**
 * @param {string} filePath repository path, used for its extension
 * @param {string} sourceText
 * @returns {SourceImports}
 */
export function readSourceImports(filePath, sourceText) {
  const { blocks, scriptSources } = listCodeBlocks(filePath, sourceText);
  const found = { specifiers: [...scriptSources], globs: [], unfollowable: [] };
  const scriptKind = JSX_EXTENSION_PATTERN.test(filePath) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  for (const block of blocks) {
    visit(ts.createSourceFile(filePath, block, ts.ScriptTarget.Latest, false, scriptKind), found);
  }
  if (found.specifiers.some((specifier) => MODULE_LOADER_MODULES.includes(specifier))) found.unfollowable.push('a module loader (node:module), whose createRequire loads files by a computed path');
  return { ...found, fileAccessModules: found.specifiers.filter((specifier) => FILE_ACCESS_MODULES.includes(specifier)) };
}
