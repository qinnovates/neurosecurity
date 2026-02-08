/** Discriminated union types for the unified News & Intel feed */

export interface PublicationItem {
  type: 'publication';
  title: string;
  date: string;
  slug: string;
  excerpt: string;
  tags: string[];
  readTime: string;
}

export interface BriefItem {
  type: 'brief';
  title: string;
  date: string;
  category: string;
  categoryColor: string;
  categoryName: string;
  summary: string;
  relevance: string;
  url?: string;
}

export interface ExternalItem {
  type: 'external';
  title: string;
  date: string;
  url: string;
  source: string;
  summary: string;
  category: string;
}

export type FeedItem = PublicationItem | BriefItem | ExternalItem;
