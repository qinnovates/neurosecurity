import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { briefs, categories } from '../lib/news-data';
import { getPostDate, slugFromId } from '../lib/utils';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog');

  // Build RSS items from intelligence briefs
  const briefItems = briefs.map((brief) => {
    const cat = categories.find((c) => c.id === brief.category);
    return {
      title: brief.title,
      description: `${brief.summary}\n\nQIF Relevance: ${brief.relevance}`,
      pubDate: new Date(`${brief.date}-01`),
      link: '/news/',
      categories: cat ? [cat.name] : [],
    };
  });

  // Build RSS items from blog publications
  const postItems = posts.map((post) => {
    const dateStr = getPostDate(post.data);
    const slug = slugFromId(post.id);
    return {
      title: post.data.title,
      description: post.data.subtitle || post.data.title,
      pubDate: new Date(dateStr),
      link: `/publications/${slug}/`,
      categories: post.data.tags.map((t: string) => t.replace(/^#/, '')),
    };
  });

  // Combine and sort by date descending
  const items = [...briefItems, ...postItems].sort(
    (a, b) => b.pubDate.getTime() - a.pubDate.getTime()
  );

  return rss({
    title: 'Qinnovate Intel',
    description: 'BCI security intelligence — neurotechnology, quantum computing, neuroethics, and adversarial research from the Quantum Indeterministic Framework.',
    site: context.site!,
    items,
    customData: '<language>en-us</language>',
  });
}
