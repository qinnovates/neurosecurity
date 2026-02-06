import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './blogs' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    date: z.coerce.string().optional(),
    date_posted: z.coerce.string().optional(),
    source: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
