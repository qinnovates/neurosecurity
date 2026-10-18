// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { LIMIT_TEMPLATES, matchesLimitTemplate } from '@/lib/anatomy/limits-copy';
import { buildFixtureModel, loadRealModel } from '@/lib/atlas-explorer/__tests__/explorer-fixtures';
import InspectorDsm, { describeReferenceCount } from '../InspectorDsm';

afterEach(cleanup);

const QUALIFIER = /diagnostic category references .* for threat modelling, not diagnostic claims/;
const CLAIM_WORDS = /\b(causes?|leads? to|results? in|diagnos(?:is|es|ed)|treats?)\b/i;

function renderFor(regionId: string, model = buildFixtureModel()): HTMLElement {
  return render(<InspectorDsm model={model} regionId={regionId} />).container.querySelector('[aria-labelledby="atlas-inspector-dsm"]') as HTMLElement;
}

describe('the inspector\'s DSM-5-TR references', () => {
  it('always shows, in the same section, that they are category references for threat modelling and not diagnostic claims', () => {
    for (const regionId of ['pfc', 'cord']) {
      const qualifier = renderFor(regionId).querySelector('[data-limit-id="dsm_references"]')?.textContent ?? '';
      expect(qualifier).toBe(LIMIT_TEMPLATES.dsm_references);
      expect(qualifier).toMatch(QUALIFIER);
      cleanup();
    }
  });

  it('marks references that arrive through an AI-drafted link, and lists each with what carries it once opened', () => {
    const section = renderFor('pfc');
    expect(section.querySelector('[data-ai-drafted="true"]')?.textContent).toBe('AI-drafted, unreviewed');
    expect(section.querySelector('[data-dsm-code]')).toBeNull();
    for (const button of section.querySelectorAll<HTMLButtonElement>('.atlas-disclosure-button')) fireEvent.click(button);
    expect([...section.querySelectorAll('[data-dsm-code]')].map((item) => item.textContent)).toEqual([
      'F00.0 Fixture categoryFiled with: QIF-T9004.', 'F00.x Fixture category (pathway wording)Filed with: Fixture Pathway.',
    ]);
    expect(matchesLimitTemplate('dsm_via_pathways', section.querySelector('[data-limit-id="dsm_via_pathways"]')?.textContent ?? '')).toBe(true);
  });

  it('marks the pathway group as AI-drafted and unreviewed wherever a pathway reaches the region, with or without a linked technique', () => {
    for (const regionId of ['pfc', 'm1']) {
      const heading = renderFor(regionId).querySelector('[data-dsm-group="pathways"]');
      expect(heading?.querySelector('[data-ai-drafted="true"]')?.textContent).toBe('AI-drafted, unreviewed');
      cleanup();
    }
    const real = renderFor('cervical_cord', loadRealModel());
    expect(real.querySelector('[data-dsm-group="pathways"] [data-ai-drafted="true"]')?.textContent).toBe('AI-drafted, unreviewed');
    expect(real.querySelector('[data-limit-id="dsm_via_pathways"]')?.textContent).toContain('No person has reviewed the pathway file\'s references, and an AI matched the pathway\'s region names to this region.');
  });

  it('says in each heading what its number counts: entries and the distinct codes among them', () => {
    const reference = (code: string, name: string) => ({ code, name, carriers: ['carrier'] });
    expect(describeReferenceCount([])).toBe('0 references to 0 codes');
    expect(describeReferenceCount([reference('F00.0', 'First wording')])).toBe('1 reference to 1 code');
    expect(describeReferenceCount([reference('F00.0', 'First wording'), reference('F00.0', 'Second wording'), reference('F01.0', 'Other')])).toBe('3 references to 2 codes');
    expect(renderFor('pfc').querySelector('[data-dsm-group="pathways"]')?.textContent).toContain('Through pathways (1 reference to 1 code)');
  });

  it('says so in words when nothing arrives, and shows no mark', () => {
    const section = renderFor('cord');
    expect(section.querySelectorAll('[data-limit-id="dsm_none"]')).toHaveLength(2);
    expect(section.querySelector('[data-ai-drafted]')).toBeNull();
  });

  it('on the real data, words no heading or sentence of its own as a cause, an outcome or a diagnosis', () => {
    const section = renderFor('pfc', loadRealModel());
    const ownWords = [...section.querySelectorAll('h3, h4, .atlas-limit, .atlas-disclosure-button')].map((element) => element.textContent ?? '');
    expect(ownWords.length).toBeGreaterThan(4);
    expect(ownWords.filter((words) => CLAIM_WORDS.test(words.replace(QUALIFIER, '')))).toEqual([]);
  });
});
