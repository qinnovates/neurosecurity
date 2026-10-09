import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const MODEL_DIR = path.resolve('src/components/threat-model');
const WORKBENCH_DIR = path.resolve('src/components/workbench');
/** The Model frame's own files. The diagram, the editor and the report are other folders' work. */
const OWN_FILES = [
  'ThreatModelStudio.tsx', 'RisksSection.tsx', 'RiskDetail.tsx', 'ElementPanel.tsx', 'ReplaceDeviceConfirm.tsx', 'ThreatMatrix.tsx',
  'ChainsSection.tsx', 'BeyondDevice.tsx', 'model-layout.css',
].map((name) => path.join(MODEL_DIR, name));
const OWN_WORKBENCH_FILES = ['view-registry.ts', 'shell-targets.ts', 'mode-registry.ts', 'use-open-technique.ts'].map((name) => path.join(WORKBENCH_DIR, name));
const MAX_LINES = 300;

function listSources(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : listSources(path.join(directory, entry.name));
    return /\.(tsx?|css)$/.test(entry.name) ? [path.join(directory, entry.name)] : [];
  });
}

const files = [...OWN_FILES, ...OWN_WORKBENCH_FILES, ...listSources(path.join(MODEL_DIR, 'frame')), ...listSources(path.join(MODEL_DIR, 'overview'))];

describe('the Model frame is built from the kit', () => {
  it.each(files.map((file) => [path.relative(MODEL_DIR, file), file]))('%s uses no tm- class, no site colour token and no retired alias', (_name, file) => {
    const source = fs.readFileSync(file, 'utf-8');
    expect(source).not.toMatch(/\btm-[a-z]/);
    expect(source).not.toMatch(/--color-/);
    expect(source).not.toMatch(/--lab-line-strong|--lab-radius\)|--lab-high|--motion-/);
    expect(source).not.toMatch(/opacity\s*:/);
    expect(source.split('\n').length).toBeLessThanOrEqual(MAX_LINES);
  });

  it('removes movement for a reader who asked for less, and nothing in its stylesheet repeats', () => {
    const css = fs.readFileSync(path.join(MODEL_DIR, 'model-layout.css'), 'utf-8');
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(css).not.toMatch(/infinite|@keyframes|animation\s*:/);
  });
});
