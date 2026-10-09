/**
 * Small readers for built HTML, shared by the post-build checks. They follow what a
 * browser does closely enough to answer two questions: what are a tag's attributes, and
 * which parts of the text are markup the browser acts on.
 */

/** The attribute part of a start tag, with `>` allowed inside quoted values. */
export const TAG_ATTRIBUTES_SOURCE = String.raw`((?:[^>"']|"[^"]*"|'[^']*')*)`;

const ATTRIBUTE_PATTERN = /([^\s=>"'/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
/** Elements whose content is text to the parser: markup written inside them is never acted on. */
const RAW_TEXT_ELEMENTS = ['script', 'style', 'title', 'textarea'];
/** Elements whose content is inert while scripting is on, which is the only way these pages work. */
const INERT_ELEMENTS = ['noscript', 'template'];
const COMMENT_PATTERN = /<!--[\s\S]*?-->/g;

/** Attribute names (lower-cased) to values for one tag; the first of a repeated name wins, as in a browser. */
export function parseAttributes(attributeText) {
  const attributes = new Map();
  for (const [, name, doubleQuoted, singleQuoted, bare] of attributeText.matchAll(ATTRIBUTE_PATTERN)) {
    const key = name.toLowerCase();
    if (!attributes.has(key)) attributes.set(key, doubleQuoted ?? singleQuoted ?? bare ?? '');
  }
  return attributes;
}

function blank(text) {
  return text.replace(/[^\n]/g, ' ');
}

function blankElementContent(html, elementNames) {
  const pattern = new RegExp(String.raw`(<(${elementNames.join('|')})\b${TAG_ATTRIBUTES_SOURCE}>)([\s\S]*?)(<\/\2\b[^>]*>)`, 'gi');
  return html.replace(pattern, (whole, openTag, name, attributes, content, closeTag) => `${openTag}${blank(content)}${closeTag}`);
}

/**
 * Returns the HTML with everything a browser would not treat as markup replaced by spaces:
 * the content of script, style, title and textarea, comments, and the content of noscript
 * and template. Tags and positions are kept, so an index into the result is an index into the page.
 */
export function blankInertContent(html) {
  const withoutRawText = blankElementContent(html, RAW_TEXT_ELEMENTS);
  const withoutComments = withoutRawText.replace(COMMENT_PATTERN, blank);
  return blankElementContent(withoutComments, INERT_ELEMENTS);
}
