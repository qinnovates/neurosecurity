import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseSampleCsv } from '@/lib/signal/sample-csv';
import { GET as getSample, getStaticPaths } from '@/pages/atlas/model/samples/[sample].csv';
import { GET as getSampleList } from '@/pages/atlas/model/samples/index.json';
import { SampleSourceError, listServedSamples, readServedSample } from '@/pages/atlas/model/samples/_sample-files';
import { SAMPLE_DIRECTORY, SAMPLE_LIST_FILE, SampleLoadError, fetchSample, fetchSampleFiles } from '../sample-source';

/** Every directory whose code runs in the Lab and belongs to Monitor, Query or the Report. */
const LAB_SOURCE_DIRECTORIES = ['src/components/monitor', 'src/components/query', 'src/lib/signal', 'src/components/threat-model/report'];
const LAB_SOURCE_FILES = ['ReportView.tsx', 'RiskRegister.tsx', 'ChainList.tsx', 'ComplianceChecklist.tsx'].map((file) => path.join('src/components/threat-model', file));
const SOURCE_FILE_PATTERN = /\.(ts|tsx|css)$/;
const FORBIDDEN_NAME = /siem/i;
const SERVED_NAME = /^sample-\d{2}\.csv$/;

function listSourceFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : listSourceFiles(entryPath);
    return SOURCE_FILE_PATTERN.test(entry.name) ? [entryPath] : [];
  });
}

type EndpointContext = Parameters<typeof getSample>[0];
const asContext = (params: Record<string, string>): EndpointContext => ({ params } as unknown as EndpointContext);

afterEach(() => vi.unstubAllGlobals());

describe('where the Lab asks for its samples', () => {
  it('names no request path, file or identifier with the forbidden word in any Monitor, Query or Report source', () => {
    const files = [...LAB_SOURCE_DIRECTORIES.flatMap(listSourceFiles), ...LAB_SOURCE_FILES];
    expect(files.length).toBeGreaterThan(20);
    const offenders = files.filter((file) => FORBIDDEN_NAME.test(file) || FORBIDDEN_NAME.test(fs.readFileSync(file, 'utf-8')));
    expect(offenders).toEqual([]);
  });

  it('uses a same-origin path under the Lab\'s own route', () => {
    expect(SAMPLE_DIRECTORY).toBe('/atlas/model/samples/');
    expect(SAMPLE_DIRECTORY.startsWith('//')).toBe(false);
    expect(FORBIDDEN_NAME.test(SAMPLE_DIRECTORY + SAMPLE_LIST_FILE)).toBe(false);
  });

  it('requests only that path, without credentials, and drops names that are not its own', async () => {
    const requested: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      requested.push(url);
      expect(init.credentials).toBe('omit');
      return new Response(JSON.stringify({ samples: [{ file: 'sample-01.csv' }, { file: '../secret.csv' }, { file: 'https://example.org/x.csv' }, { name: 'none' }] }));
    }));
    expect(await fetchSampleFiles(new AbortController().signal)).toEqual(['sample-01.csv']);
    expect(requested).toEqual(['/atlas/model/samples/index.json']);
  });

  it('refuses a sample name that is not one of its own before any request is made', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await expect(fetchSample('../manifest.json', new AbortController().signal)).rejects.toBeInstanceOf(SampleLoadError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('says what failed and what to do when the list does not load', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })));
    await expect(fetchSampleFiles(new AbortController().signal)).rejects.toThrow('The list of samples could not be loaded (status 404). Reload the page to try again.');
  });
});

describe('the files the site serves to the Lab', () => {
  const served = listServedSamples();

  it('gives every sample a neutral name, in order', () => {
    expect(served.length).toBeGreaterThan(0);
    expect(served.map((sample) => sample.servedName)).toEqual(served.map((_, index) => `sample-${String(index + 1).padStart(2, '0')}.csv`));
    for (const sample of served) expect(sample.servedName).toMatch(SERVED_NAME);
  });

  it('builds one static file per sample and each is a readable sample', async () => {
    const paths = (await getStaticPaths({} as Parameters<typeof getStaticPaths>[0])) as { params: { sample: string } }[];
    expect(paths.map((entry) => `${entry.params.sample}.csv`)).toEqual(served.map((sample) => sample.servedName));
    const response = await getSample(asContext(paths[0].params));
    expect(response.headers.get('Content-Type')).toContain('text/csv');
    expect(parseSampleCsv(await response.text()).channelNames.length).toBeGreaterThan(0);
  });

  it('lists the served names and nothing else about a sample', async () => {
    const listed = await (await getSampleList(asContext({}))).json() as { samples: Record<string, unknown>[] };
    expect(listed.samples).toEqual(served.map((sample) => ({ file: sample.servedName })));
  });

  it('refuses a name it does not serve', () => {
    expect(() => readServedSample('manifest.json')).toThrow(SampleSourceError);
    expect(() => readServedSample('../../CNAME')).toThrow(SampleSourceError);
  });
});
