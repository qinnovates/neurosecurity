import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const BENCH_DIRECTORY = 'src/components/signal-bench';
const MONOSPACE_PATTERN = /\bfont-mono\b|--font-mono|\bmonospace\b|\bui-monospace\b|\b(Menlo|Monaco|Consolas|Courier|SFMono|JetBrains Mono|Fira Code|Source Code Pro)\b/i;
const benchFiles = fs.readdirSync(BENCH_DIRECTORY).map((name) => path.join(BENCH_DIRECTORY, name));
const read = (filePath: string): string => fs.readFileSync(filePath, 'utf-8');

describe('signal bench source rules', () => {
  it('sets no text in a monospace face, on the page or on the canvas', () => {
    expect(benchFiles.length).toBeGreaterThan(3);
    expect(benchFiles.filter((filePath) => MONOSPACE_PATTERN.test(read(filePath)))).toEqual([]);
    expect(MONOSPACE_PATTERN.test('<span className="font-mono">')).toBe(true);
  });

  it('keeps the registrar out of the island: only the build-time module reads qif-constants', () => {
    const importers = benchFiles.filter((filePath) => read(filePath).includes('qif-constants'));
    expect(importers).toEqual([path.join(BENCH_DIRECTORY, 'signal-bench-events.ts')]);
    expect(read(path.join(BENCH_DIRECTORY, 'SignalBench.tsx'))).toMatch(/import type \{ SignalBenchEvent \} from '\.\/signal-bench-events'/);
  });

  it('keeps the medicine line sourced from therapeuticCount', () => {
    expect(read('src/pages/atlas/tara.astro')).toContain('{therapeuticCount} of those same mechanisms are already used in medicine.');
  });
});
