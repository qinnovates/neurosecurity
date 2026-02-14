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
    author: z.string().default('Qinnovate'),
  }),
});

const governance = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './governance' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    order: z.number().default(99),
    audit: z.object({
      decisionsLogged: z.number(),
      independentReviews: z.number(),
      humanDecisionRate: z.string(),
      verificationPasses: z.number(),
      automatedTests: z.number(),
    }).optional(),
  }),
});

export const collections = { blog, governance };
