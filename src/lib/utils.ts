/** Estimate reading time from markdown text */
export function readingTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 230));
  return `${minutes} min read`;
}

/** Normalize date from frontmatter (some posts use date, some use date_posted) */
export function getPostDate(data: { date?: string; date_posted?: string }): string {
  return data.date_posted || data.date || '2026-01-01';
}

/** Format date for display */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Clean tag string (remove # prefix if present) */
export function cleanTag(tag: string): string {
  return tag.replace(/^#/, '').toLowerCase();
}

/** Generate a URL-friendly slug from a filename */
export function slugFromId(id: string): string {
  // Remove date prefix and file extension
  return id
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/\.md$/, '');
}
