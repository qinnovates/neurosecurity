import type { APIRoute } from 'astro';
import { listServedSamples } from './_sample-files';

/** The list the Monitor reads first: the served file names, in order, and nothing else about them. */
export const GET: APIRoute = () => new Response(
  JSON.stringify({ samples: listServedSamples().map((sample) => ({ file: sample.servedName })) }),
  { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
);
