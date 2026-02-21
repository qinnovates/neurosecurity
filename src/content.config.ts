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
    fact_checked: z.boolean().optional().default(false),
    fact_check_date: z.string().optional(),
    fact_check_notes: z.array(z.string()).optional().default([]),
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

const research = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './qif-framework/research' }),
  schema: z.object({
    title: z.string(),
    status: z.string().default('draft'),
    updated: z.coerce.string().optional(),
  }),
});

export const collections = { blog, governance, research };
