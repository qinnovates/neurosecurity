import { describe, expect, it } from 'vitest';
import { INITIAL_EXPLORER_STATE } from '@/components/atlas-scene/atlas-state';
import { LAYER_LABELS } from '@/components/atlas-scene/LayerPanel';
import type { AnatomyIndex } from '@/lib/anatomy/anatomy-index-types';
import { LIMIT_TEMPLATES } from '@/lib/anatomy/limits-copy';
import { rasToScene } from '@/lib/anatomy/ras-to-scene';
import {
  ELECTRODE_LAYER_NAME, buildDeviceCaption, buildDeviceDrawing, describeElectrode, isDevicesLayerShown, layersAtStart, listLandmarkNotes,
} from '../device-drawing';
import { SCALE_BAR_MM, SOURCE_KIND_WORDS, buildLeadFigures, longestContactSpanMm } from '../lead-figure';
import { choosePickTarget, isPickable, materialParamsFor, unionBoxes, type PickHit } from '../scene-drawing';
import { loadRealModel } from './explorer-fixtures';

const { index } = loadRealModel();
const UNREVIEWED = 'AI-drafted, unreviewed';
const devicesOn = { ...INITIAL_EXPLORER_STATE.layers, devices: true };
/** Words that would claim what an electrode picks up, or place a device in a person. None may appear in a name, a label or a key. */
const OVERCLAIM_PATTERN = /reach|coverage|nearest|distance|under_region|region_id|target|trajectory|depth_mm/i;
const withIndex = (change: (copy: AnatomyIndex) => void): AnatomyIndex => { const copy = structuredClone(index); change(copy); return copy; };
const allKeysOf = (value: unknown): string[] => (typeof value !== 'object' || value === null ? [] : Object.entries(value).flatMap(([key, child]) => [...(Array.isArray(value) ? [] : [key]), ...allKeysOf(child)]));

describe('the devices layer', () => {
  it('is off when the explorer starts, because the layout says it is not shown by default, and follows the data if that changes', () => {
    expect(index.devices.electrode_layouts.map((layout) => layout.shown_by_default)).toEqual([false]);
    expect(layersAtStart(index, INITIAL_EXPLORER_STATE.layers)).toEqual(INITIAL_EXPLORER_STATE.layers);
    expect(layersAtStart(index, INITIAL_EXPLORER_STATE.layers).devices).toBe(false);
    expect(buildDeviceDrawing(index, layersAtStart(index, INITIAL_EXPLORER_STATE.layers))).toBeNull();
    const shownByDefault = withIndex((copy) => { copy.devices.electrode_layouts[0].shown_by_default = true; });
    expect(layersAtStart(shownByDefault, INITIAL_EXPLORER_STATE.layers).devices).toBe(true);
    // A layout that may not be drawn can never turn the layer on.
    const notDrawable = withIndex((copy) => { Object.assign(copy.devices.electrode_layouts[0], { shown_by_default: true, drawable: false }); });
    expect(layersAtStart(notDrawable, INITIAL_EXPLORER_STATE.layers).devices).toBe(false);
  });

  it('draws nothing while the layer is unavailable or the layout is not on the head surface it was placed on', () => {
    expect(isDevicesLayerShown(index, devicesOn)).toBe(true);
    const unavailable = withIndex((copy) => { for (const layer of copy.layers) if (layer.id === 'devices') Object.assign(layer, { available: false, reason: 'Fixture reason.' }); });
    expect(buildDeviceDrawing(unavailable, devicesOn)).toBeNull();
    expect(buildDeviceDrawing(withIndex((copy) => { copy.devices.electrode_layouts[0].drawable = false; }), devicesOn)).toBeNull();
  });

  it('draws the 21 electrodes where the index puts them, by name, with the review state and no region', () => {
    const drawing = buildDeviceDrawing(index, devicesOn);
    expect(drawing?.electrodes).toHaveLength(21);
    expect(drawing?.reviewState.mark).toBe(UNREVIEWED);
    const [layout] = index.devices.electrode_layouts;
    expect(drawing?.electrodes.map((electrode) => [electrode.id, electrode.positionScene])).toEqual(layout.electrodes.map((electrode) => [electrode.id, rasToScene(electrode.position_mm)]));
    expect(allKeysOf(drawing).filter((key) => OVERCLAIM_PATTERN.test(key))).toEqual([]);
  });

  it('is named "EEG electrode layout" wherever it is named, never by what an electrode might pick up', () => {
    expect(ELECTRODE_LAYER_NAME).toBe('EEG electrode layout');
    expect(LAYER_LABELS.devices).toBe(ELECTRODE_LAYER_NAME);
    const caption = buildDeviceCaption(buildDeviceDrawing(index, devicesOn) ?? { layoutId: '', layoutName: '', reviewState: index.devices.electrode_layouts[0].review_state, electrodes: [] });
    expect(caption.label).toBe('EEG electrode layout: 21 positions.');
    expect(caption.reviewState.mark).toBe(UNREVIEWED);
    expect(caption.limits.map((limit) => limit.id)).toEqual(['device_electrodes', 'device_head_surface']);
    expect(`${caption.label} ${Object.values(LAYER_LABELS).join(' ')}`).not.toMatch(/reach|coverage/i);
  });

  it('shows a picked electrode as its name, the limits and the landmark notes, and holds no region or measurement', () => {
    const detail = describeElectrode(index, 'Cz');
    expect(detail).toMatchObject({ id: 'Cz', layoutName: index.devices.electrode_layouts[0].name });
    expect(detail?.reviewState.mark).toBe(UNREVIEWED);
    expect(detail?.limits.map((limit) => limit.id)).toEqual(['device_electrodes', 'device_electrode_pick', 'device_landmarks']);
    expect(detail?.landmarks.map((landmark) => landmark.id)).toEqual(['nasion', 'inion', 'left_preauricular', 'right_preauricular']);
    expect(detail?.landmarks.map((landmark) => landmark.note)).toEqual(index.devices.fiducials.map((fiducial) => fiducial.confidence_note));
    expect(detail?.landmarks.every((landmark) => landmark.note !== null && landmark.reviewState.mark === UNREVIEWED)).toBe(true);
    expect(allKeysOf(detail).filter((key) => OVERCLAIM_PATTERN.test(key))).toEqual([]);
    expect(describeElectrode(index, 'not-an-electrode')).toBeNull();
    // The limit sentence says three of the four landmarks are weak guesses; the notes must still say so.
    expect(listLandmarkNotes(index).filter((landmark) => landmark.note?.startsWith('Weak.'))).toHaveLength(3);
  });

  it('never writes the unsourced sentence about what an electrode picks up, in any limit', () => {
    expect(Object.values(LIMIT_TEMPLATES).filter((sentence) => /picks up activity|wide area/i.test(sentence))).toEqual([]);
  });
});

describe('the head surface and electrode picks', () => {
  it('draws the head surface as a faint shell that is never picked', () => {
    const shell = materialParamsFor({ layer: 'devices', fill: 'neutral', colour: '#000000' }, false);
    expect(shell.opacity).toBeLessThan(materialParamsFor({ layer: 'outline', fill: 'neutral', colour: '#000000' }, false).opacity);
    expect(shell.writesDepth).toBe(false);
    expect(isPickable({ layer: 'devices' })).toBe(false);
  });

  it('picks an electrode only when it is the nearest thing under the pointer, and otherwise lets the shapes decide', () => {
    const hit = (overrides: Partial<PickHit>): PickHit => ({ structureKey: 'a:1', distance: 10, fill: 'translucent', isSelected: false, isHiddenByCut: false, ...overrides });
    expect(choosePickTarget([hit({ electrodeId: 'Cz', distance: 5 }), hit({ fill: 'solid', distance: 9 })])).toEqual({ kind: 'electrode', electrodeId: 'Cz' });
    // A dot on the far side of the head is not picked through the brain.
    expect(choosePickTarget([hit({ distance: 5 }), hit({ electrodeId: 'Oz', distance: 90 })])).toEqual({ kind: 'structure', structureKey: 'a:1' });
    expect(choosePickTarget([hit({ electrodeId: 'Cz', distance: 5, isHiddenByCut: true }), hit({ structureKey: 'a:2', distance: 9 })])).toEqual({ kind: 'structure', structureKey: 'a:2' });
    expect(choosePickTarget([])).toBeNull();
  });

  it('puts one box around several, for one selection mark around a region of many shapes', () => {
    expect(unionBoxes([{ min: [0, 0, 0], max: [1, 2, 3] }, { min: [-4, 1, 1], max: [0, 9, 2] }])).toEqual({ min: [-4, 0, 0], max: [1, 9, 3] });
    expect(unionBoxes([])).toBeNull();
  });
});

describe('the lead figures', () => {
  const figures = buildLeadFigures(index);

  it('carries every lead\'s sources into the index, so each number can be shown with where it was read', () => {
    expect(index.devices.leads.length).toBeGreaterThan(0);
    for (const lead of index.devices.leads) {
      expect(lead.sources.length, lead.id).toBeGreaterThan(0);
      expect(lead.sources.every((source) => source.url.startsWith('https://') && source.citation.length > 0), lead.id).toBe(true);
    }
  });

  it('gives each dimension its value, its sources and the kind of each source, and marks every lead with its review state', () => {
    expect(figures.map((figure) => figure.id)).toEqual(index.devices.leads.map((lead) => lead.id));
    for (const figure of figures) {
      expect(figure.reviewState.mark, figure.id).toBe(UNREVIEWED);
      expect(figure.rows.map((row) => row.field)).toEqual(['contacts', 'contact_length_mm', 'contact_spacing_mm', 'spacing_measure', 'diameter_mm']);
      expect(figure.rows.filter((row) => row.sources.length === 0), figure.id).toEqual([]);
      expect(figure.shape.contacts).toHaveLength(Number(figure.rows[0].value));
    }
    const kinds = new Set(figures.flatMap((figure) => figure.rows.flatMap((row) => row.sources.map((source) => SOURCE_KIND_WORDS[source.kind]))));
    expect([...kinds].sort()).toEqual(['FDA document', 'review paper']);
    // The panel's limit sentence quotes the words the table uses for a journal article.
    expect(LIMIT_TEMPLATES.device_lead_panel).toContain(`'${SOURCE_KIND_WORDS.review_paper}'`);
  });

  it('holds a size and no place: no position, target, angle or region anywhere in a figure', () => {
    expect(allKeysOf(figures).filter((key) => /position|target|trajectory|angle|region|structure|coordinate|entry|tip/i.test(key))).toEqual([]);
    expect(longestContactSpanMm(figures)).toBe(Math.max(...figures.map((figure) => figure.shape.contact_span_mm)));
    expect(SCALE_BAR_MM).toBeLessThan(longestContactSpanMm(figures));
  });
});
