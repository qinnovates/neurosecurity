// @vitest-environment jsdom
import fs from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import type { LineSegments } from 'three';
import type { AnatomyIndex } from '@/lib/anatomy/anatomy-index-types';
import type { TractLine } from '@/lib/anatomy/tract-format';
import { loadRealModel } from '@/lib/atlas-explorer/__tests__/explorer-fixtures';
import TractLines, { buildTractLines, canMountTracts } from '../TractLines';

const { index } = loadRealModel();
/** Two invented lines, made here. They are not anatomy and no file holds them. */
const SYNTHETIC: TractLine[] = [{ positionsMm: new Float32Array([0, 0, 0, 1, 2, 0, 2, 3, 0]) }, { positionsMm: new Float32Array([-10, 5, 5, -12, 5, 9]) }];
/** The same index as if a tract source had been cleared and a tract file built. No build is in this state. */
const clearedIndex: AnatomyIndex = {
  ...index,
  layers: index.layers.map((layer) => (layer.id === 'tracts' ? { ...layer, available: true, reason: null } : layer)),
  tracts: { ...index.tracts, group_asset_ids: ['fixture-tracts'] },
};
/** Anything that could make a still line look as if something moved along it. */
const ANIMATION_API_PATTERN = /LineDashedMaterial|dashSize|gapSize|dashOffset|setDrawRange|drawRange|ShaderMaterial|RawShaderMaterial|onBeforeCompile|vertexColors|'color'|requestAnimationFrame|useFrame|uniforms/;

afterEach(cleanup);

describe('TractLines', () => {
  it('cannot mount while the tracts layer is unavailable, which it is in this build: nothing is built and nothing attached', () => {
    const tractsLayer = index.layers.find((layer) => layer.id === 'tracts');
    expect(tractsLayer?.available).toBe(false);
    expect(tractsLayer?.reason).not.toBeNull();
    expect(index.tracts.group_asset_ids).toEqual([]);
    expect(index.assets.filter((asset) => asset.layer === 'tracts')).toEqual([]);
    expect(canMountTracts(index)).toBe(false);
    const attach = vi.fn(() => () => undefined);
    const { container } = render(<TractLines index={index} lines={SYNTHETIC} attach={attach} />);
    expect(attach).not.toHaveBeenCalled();
    expect(container.innerHTML).toBe('');
  });

  it('needs both an available layer and a tract file in the index', () => {
    expect(canMountTracts(clearedIndex)).toBe(true);
    expect(canMountTracts({ ...clearedIndex, tracts: index.tracts })).toBe(false);
    expect(canMountTracts({ ...index, tracts: clearedIndex.tracts })).toBe(false);
  });

  it('attaches still lines when the index allows it, and takes them out and frees them when it goes', () => {
    const attached: LineSegments[] = [];
    const detach = vi.fn();
    const { unmount } = render(<TractLines index={clearedIndex} lines={SYNTHETIC} attach={(lines) => { attached.push(lines); return detach; }} />);
    expect(attached).toHaveLength(1);
    const disposed = vi.fn();
    attached[0].geometry.addEventListener('dispose', disposed);
    unmount();
    expect(detach).toHaveBeenCalledTimes(1);
    expect(disposed).toHaveBeenCalledTimes(1);
  });

  it('builds geometry that holds positions and nothing else, with a plain line material', () => {
    const lines = buildTractLines(SYNTHETIC);
    expect(Object.keys(lines.geometry.attributes)).toEqual(['position']);
    expect(lines.geometry.index).toBeNull();
    expect(lines.geometry.drawRange).toEqual({ start: 0, count: Infinity });
    expect(lines.material.type).toBe('LineBasicMaterial');
    expect(lines.material.vertexColors).toBe(false);
    // Three pieces: two along the first line, one along the second, in scene axes (the atlas's y is scene -z).
    expect([...lines.geometry.attributes.position.array]).toEqual([0, 0, -0, 1, 0, -2, 1, 0, -2, 2, 0, -3, -10, 5, -5, -12, 9, -5]);
  });

  it('uses no dash, draw-range, shader or vertex-colour API anywhere in the tract code', () => {
    for (const file of ['src/components/atlas-scene/TractLines.tsx', 'src/lib/anatomy/tract-format.ts']) {
      const code = fs.readFileSync(file, 'utf-8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      expect(ANIMATION_API_PATTERN.exec(code)?.[0], file).toBeUndefined();
    }
    for (const sample of ['new LineDashedMaterial()', 'geometry.setDrawRange(0, n)', 'vertexColors: true', "setAttribute('color', colours)", 'new ShaderMaterial({ uniforms })']) expect(ANIMATION_API_PATTERN.test(sample), sample).toBe(true);
  });

  it('is mounted by nothing in this build, and no reader for another tract format exists', () => {
    const sources = fs.readdirSync('src/components/atlas-scene').filter((name) => /\.tsx?$/.test(name) && name !== 'TractLines.tsx').map((name) => fs.readFileSync(`src/components/atlas-scene/${name}`, 'utf-8')).join('\n');
    expect(sources).not.toMatch(/TractLines|tract-format/);
    const reader = fs.readFileSync('src/lib/anatomy/tract-format.ts', 'utf-8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    expect(reader).not.toMatch(/\.trk|\.tck|\.trx|\.vtk|nifti|TrackVis|MRtrix/i);
  });
});
