import { describe, it, expect } from 'vitest';
import { buildModelFromIntake, defaultAnswersFor } from '@/lib/threat-model/intake-to-model';
import { loadEngineBundle, loadReferenceData } from '@/lib/threat-model/__tests__/load-test-data';
import { MODE_IDS, WORKBENCH_MODES } from '../mode-registry';
import { describeRoute, parseAddress, parseRoute, titleFor, toHash, type Route } from '../route';
import { SHELL_TARGETS, VIEW_STATE_KEYS, lastViewKey, scrollKey } from '../shell-targets';
import { MODE_VIEW_GROUPS, defaultViewId, findView } from '../view-registry';

const bundle = loadEngineBundle();
const referenceData = loadReferenceData(bundle);
const ADDRESS_PATTERN = /^#[a-z]+(\/[a-z-]+)?$/;

function listEveryRoute(): Route[] {
  return MODE_IDS.flatMap((modeId) => MODE_VIEW_GROUPS[modeId].flatMap((group) => group.views.map((view) => ({ modeId, viewId: view.id }))));
}

/** Every string anywhere inside a value, however deeply nested. */
function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (typeof value === 'object' && value !== null) return Object.values(value).flatMap(collectStrings);
  return [];
}

describe('parseAddress', () => {
  it('recognises an empty address, a mode, and a mode with one of its views', () => {
    expect(parseAddress('')).toEqual({ route: { modeId: 'explore', viewId: defaultViewId('explore') }, isRecognised: true });
    expect(parseAddress('#')).toEqual({ route: { modeId: 'explore', viewId: defaultViewId('explore') }, isRecognised: true });
    expect(parseAddress('#model').isRecognised).toBe(true);
    for (const route of listEveryRoute()) expect(parseAddress(`#${route.modeId}/${route.viewId}`)).toEqual({ route, isRecognised: true });
  });

  it('falls back and says so for an unknown mode, an unknown view, or anything after the view', () => {
    expect(parseAddress('#nonsense')).toEqual({ route: { modeId: 'explore', viewId: defaultViewId('explore') }, isRecognised: false });
    expect(parseAddress('#model/not-a-view')).toEqual({ route: { modeId: 'model', viewId: defaultViewId('model') }, isRecognised: false });
    expect(parseAddress(`#model/${defaultViewId('model')}/extra`).isRecognised).toBe(false);
    expect(parseAddress('#main-content').isRecognised).toBe(false);
  });

  it('survives hostile input without throwing or passing it through', () => {
    const hostile = ['#<script>alert(1)</script>', `#model/${'a'.repeat(10_000)}`, '#model?name=Secret%20Device', '#__proto__/constructor', '#model/../../etc'];
    for (const hash of hostile) {
      const { route, isRecognised } = parseAddress(hash);
      expect(isRecognised).toBe(false);
      expect(findView(route.modeId, route.viewId)).not.toBeNull();
      expect(toHash(route)).toMatch(ADDRESS_PATTERN);
    }
  });
});

describe('toHash', () => {
  it('writes only a mode and a view from the registries, whatever it is handed', () => {
    const smuggled = { modeId: 'model', viewId: 'name=Secret Device', deviceName: 'Secret Device' } as Route;
    expect(toHash(smuggled)).toBe('#model');
    expect(toHash({ modeId: 'not-a-mode', viewId: 'risks' } as unknown as Route)).toBe('#explore');
    expect(Object.keys(parseRoute('#model/report')).sort()).toEqual(['modeId', 'viewId']);
  });

  it('can never carry a field of the device model', () => {
    const registryHashes = new Set(listEveryRoute().map(toHash));
    for (const hash of registryHashes) expect(hash).toMatch(ADDRESS_PATTERN);
    for (const archetype of referenceData.archetypes) {
      const model = buildModelFromIntake(defaultAnswersFor(archetype), archetype, bundle.engineData.registrarVersion);
      const modelStrings = collectStrings(model).filter((text) => text.length > 0);
      expect(modelStrings).toContain(model.name);
      // Whichever way a model value is pushed at the address, what comes out is one of the registry's own addresses.
      for (const text of modelStrings) {
        expect(registryHashes.has(toHash({ modeId: 'model', viewId: text }))).toBe(true);
        expect(registryHashes.has(toHash({ modeId: text, viewId: text } as unknown as Route))).toBe(true);
        expect(registryHashes.has(toHash(parseRoute(`#model/${text}`)))).toBe(true);
        expect(registryHashes.has(toHash(parseRoute(`#${text}`)))).toBe(true);
      }
    }
  });
});

describe('titles and descriptions', () => {
  it('gives every screen its own browser title, ending with the product', () => {
    const titles = listEveryRoute().map(titleFor);
    expect(new Set(titles).size).toBe(titles.length);
    for (const title of titles) expect(title.endsWith('TARA Lab | Qinnovate')).toBe(true);
    expect(titleFor({ modeId: 'model', viewId: 'report' })).not.toBe(titleFor({ modeId: 'model', viewId: defaultViewId('model') }));
  });

  it('describes a route with the registries\' own labels', () => {
    for (const route of listEveryRoute()) {
      const modeLabel = WORKBENCH_MODES.find((mode) => mode.id === route.modeId)?.label ?? '';
      expect(describeRoute(route)).toContain(modeLabel);
    }
  });
});

describe('shell targets', () => {
  it('names only screens that exist in the view registry', () => {
    for (const target of SHELL_TARGETS) expect(findView(target.modeId, target.viewId)).not.toBeNull();
  });

  it('uses view-state keys the store accepts', () => {
    const keys = [...Object.values(VIEW_STATE_KEYS), ...MODE_IDS.map(lastViewKey), ...listEveryRoute().map(scrollKey)];
    for (const key of keys) expect(key).toMatch(/^[a-z0-9]+(?:[/_-][a-z0-9]+)*$/);
  });
});
