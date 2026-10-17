import type { APIRoute, GetStaticPaths } from 'astro';
import { SERVED_EXTENSION, listServedSamples, readServedSample } from './_sample-files';

/** One static file per sample, written at build time: /atlas/model/samples/sample-01.csv and so on. */
export const getStaticPaths: GetStaticPaths = () => listServedSamples().map((sample) => ({
  params: { sample: sample.servedName.slice(0, -SERVED_EXTENSION.length) },
}));

export const GET: APIRoute = ({ params }) => new Response(readServedSample(`${params.sample ?? ''}${SERVED_EXTENSION}`), {
  headers: { 'Content-Type': 'text/csv; charset=utf-8' },
});
