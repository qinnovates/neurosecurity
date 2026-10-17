// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { buildThreatModelReport } from '@/lib/threat-model/build-report';
import { buildModelFromIntake, defaultAnswersFor } from '@/lib/threat-model/intake-to-model';
import { loadEngineBundle, loadReferenceData } from '@/lib/threat-model/__tests__/load-test-data';
import { describeDevice, summariseDevice } from '../device-summary';
import { MODE_IDS } from '../mode-registry';
import { parseRoute, toHash } from '../route';
import StandingLine, { STANDING_STATEMENTS } from '../StandingLine';
import { MODE_VIEW_GROUPS, defaultViewId } from '../view-registry';

afterEach(cleanup);

const bundle = loadEngineBundle();
const { engineData } = bundle;
const referenceData = loadReferenceData(bundle);

describe('route', () => {
  it('opens the default mode and view for an empty or unknown address', () => {
    const fallback = { modeId: 'explore', viewId: defaultViewId('explore') };
    expect(parseRoute('')).toEqual(fallback);
    expect(parseRoute('#nonsense/anything')).toEqual(fallback);
  });

  it('falls back to the mode\'s first view when the view is unknown', () => {
    expect(parseRoute('#model/not-a-view')).toEqual({ modeId: 'model', viewId: defaultViewId('model') });
  });

  it('round-trips every view in the registry, and the address holds only mode and view', () => {
    for (const modeId of MODE_IDS) {
      for (const view of MODE_VIEW_GROUPS[modeId].flatMap((group) => group.views)) {
        const hash = toHash({ modeId, viewId: view.id });
        expect(parseRoute(hash)).toEqual({ modeId, viewId: view.id });
        expect(hash).toMatch(/^#[a-z]+(\/[a-z-]+)?$/);
      }
    }
  });

  it('keeps a mode\'s first view out of the address', () => {
    expect(toHash({ modeId: 'model', viewId: defaultViewId('model') })).toBe('#model');
  });
});

describe('device summary', () => {
  it('describes each device class from its model and report', () => {
    for (const archetype of referenceData.archetypes) {
      const model = buildModelFromIntake(defaultAnswersFor(archetype), archetype, engineData.registrarVersion);
      const report = buildThreatModelReport({ model, engineData, referenceData, generatedAt: '' });
      const summary = summariseDevice(model, report);
      expect(summary.partCount).toBe(model.components.length);
      expect(summary.partsAreInterface.filter(Boolean)).toHaveLength(1);
      expect(summary.placedTechniqueCount).toBe(new Set(report.riskRows.filter((row) => row.source === 'catalog').map((row) => row.techniqueId)).size);
      expect(describeDevice(summary)).toHaveLength(4);
    }
  });

  it('uses the singular for one of something', () => {
    const phrases = describeDevice({ name: 'Two-part device', directionWord: 'records', partCount: 1, placedTechniqueCount: 1, chainHypothesisCount: 1, partsAreInterface: [true] });
    expect(phrases).toEqual(['records', '1 part', '1 technique placed', '1 chain hypothesis']);
  });
});

describe('StandingLine', () => {
  it('says the catalog is proposed and unreviewed, that placement was AI-drafted, and that nothing is sent', () => {
    const text = STANDING_STATEMENTS.join(' ');
    expect(text).toContain('proposed and not peer reviewed');
    expect(text).toContain('drafted with an AI assistant and have not yet been reviewed');
    expect(text).toContain('not a compliance determination');
    expect(text).toContain('Nothing you enter is sent anywhere');
  });

  it('shows every statement in full, with the catalog version and size', () => {
    render(<StandingLine catalogVersion={engineData.registrarVersion} techniqueCount={engineData.techniques.length} />);
    const full = document.querySelector('.lab-standing-full')?.textContent ?? '';
    for (const statement of STANDING_STATEMENTS) expect(full).toContain(statement);
    expect(full).toContain(`Catalog version ${engineData.registrarVersion}, ${engineData.techniques.length} techniques.`);
    expect(screen.getAllByText(STANDING_STATEMENTS[1])).toHaveLength(1);
  });
});
