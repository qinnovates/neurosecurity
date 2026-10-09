// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { loadTaraChains } from '@/components/atlas/load-tara-chains';
import { buildModelFromIntake, defaultAnswersFor } from '@/lib/threat-model/intake-to-model';
import { loadEngineBundle, loadReferenceData } from '@/lib/threat-model/__tests__/load-test-data';
import CommandPalette, { PALETTE_RESULT_LIMIT } from '../CommandPalette';
import { FocusProvider } from '../FocusContext';
import { MODE_IDS } from '../mode-registry';
import { listPaletteCommands, searchPaletteCommands, type PaletteCommand } from '../palette-commands';
import { MODE_VIEW_GROUPS } from '../view-registry';

afterEach(cleanup);

const bundle = loadEngineBundle();
const { engineData } = bundle;
const referenceData = loadReferenceData(bundle);
const curatedChains = loadTaraChains();
const [defaultClass] = referenceData.archetypes;
const model = buildModelFromIntake(defaultAnswersFor(defaultClass), defaultClass, engineData.registrarVersion);
const commands = listPaletteCommands(engineData.techniques, model);
const [sampleTechnique] = engineData.techniques;
const viewCount = MODE_IDS.reduce((count, modeId) => count + MODE_VIEW_GROUPS[modeId].reduce((sum, group) => sum + group.views.length, 0), 0);

function renderPalette() {
  const onRun = vi.fn<(command: PaletteCommand) => void>();
  const onClose = vi.fn();
  render(
    <FocusProvider engineData={engineData} referenceData={referenceData} curatedChains={curatedChains}>
      <button type="button">Opener</button>
      <CommandPalette onRun={onRun} onClose={onClose} />
    </FocusProvider>,
  );
  return { onRun, onClose, input: screen.getByRole('combobox') as HTMLInputElement };
}

describe('palette commands', () => {
  it('lists every view, every part and connection of the device, and every technique, from the data', () => {
    expect(commands.filter((command) => command.kind === 'view')).toHaveLength(viewCount);
    expect(commands.filter((command) => command.kind === 'part')).toHaveLength(model.components.length + model.links.length);
    expect(commands.filter((command) => command.kind === 'technique')).toHaveLength(engineData.techniques.length);
    expect(new Set(commands.map((command) => command.key)).size).toBe(commands.length);
  });

  it('finds a technique by its ID and by its name', () => {
    const byId = searchPaletteCommands(commands, sampleTechnique.id, PALETTE_RESULT_LIMIT).matches.filter((command) => command.kind === 'technique');
    expect(byId[0]).toMatchObject({ kind: 'technique', techniqueId: sampleTechnique.id, label: sampleTechnique.name });
    const byName = searchPaletteCommands(commands, sampleTechnique.name.toUpperCase(), PALETTE_RESULT_LIMIT).matches;
    expect(byName.some((command) => command.kind === 'technique' && command.techniqueId === sampleTechnique.id)).toBe(true);
  });

  it('finds a part of the device by its label', () => {
    const [part] = model.components;
    const { matches } = searchPaletteCommands(commands, part.label, PALETTE_RESULT_LIMIT);
    expect(matches.some((command) => command.kind === 'part' && command.elementId === part.id)).toBe(true);
  });

  it('caps what is shown and still reports how many matched', () => {
    const result = searchPaletteCommands(commands, '', PALETTE_RESULT_LIMIT);
    expect(result.matches).toHaveLength(Math.min(PALETTE_RESULT_LIMIT, commands.length));
    expect(result.matchCount).toBe(commands.length);
    expect(searchPaletteCommands(commands, 'zzzz-no-such-thing', PALETTE_RESULT_LIMIT)).toEqual({ matches: [], matchCount: 0 });
  });

  it('requires every word of the query', () => {
    const [modeView] = commands;
    const { matches } = searchPaletteCommands(commands, `${modeView.detail} ${modeView.label}`, PALETTE_RESULT_LIMIT);
    expect(matches).toContainEqual(modeView);
    expect(searchPaletteCommands(commands, `${modeView.label} zzzz`, PALETTE_RESULT_LIMIT).matchCount).toBe(0);
  });
});

describe('CommandPalette', () => {
  it('takes focus when it opens and says how many of the matches are shown', () => {
    const { input } = renderPalette();
    expect(document.activeElement).toBe(input);
    expect(screen.getByRole('dialog', { name: 'Go to' }).getAttribute('aria-modal')).toBe('true');
    expect(screen.getAllByRole('option')).toHaveLength(PALETTE_RESULT_LIMIT);
    expect(screen.getByRole('status').textContent).toBe(`Showing ${PALETTE_RESULT_LIMIT} of ${commands.length}. Type to narrow.`);
  });

  it('is worked from the keyboard: arrows move, Enter runs the highlighted destination', () => {
    const { onRun, input } = renderPalette();
    const options = screen.getAllByRole('option');
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')[1].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(screen.getAllByRole('option').at(-1)?.getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(input, { key: 'Home' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRun).toHaveBeenCalledWith(commands[1]);
  });

  it('opens a technique typed by ID', () => {
    const { onRun, input } = renderPalette();
    fireEvent.change(input, { target: { value: sampleTechnique.id } });
    const techniques = screen.getByRole('group', { name: 'Techniques' });
    expect(within(techniques).getAllByRole('option')[0].textContent).toContain(sampleTechnique.name);
    fireEvent.click(within(techniques).getAllByRole('option')[0]);
    expect(onRun).toHaveBeenCalledWith(expect.objectContaining({ kind: 'technique', techniqueId: sampleTechnique.id }));
  });

  it('groups the parts under the device\'s own name', () => {
    renderPalette();
    const parts = screen.getByRole('group', { name: `Parts of ${model.name}` });
    expect(within(parts).getAllByRole('option')).toHaveLength(model.components.length + model.links.length);
  });

  it('says so when nothing matches, and Enter then does nothing', () => {
    const { onRun, input } = renderPalette();
    fireEvent.change(input, { target: { value: 'zzzz-no-such-thing' } });
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByRole('status').textContent).toBe('No screen, technique or part matches.');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRun).not.toHaveBeenCalled();
  });

  it('closes on Escape and keeps Tab inside the dialog', () => {
    const { onClose, input } = renderPalette();
    const close = screen.getByRole('button', { name: 'Close' });
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(close, { key: 'Tab' });
    expect(document.activeElement).toBe(input);
    fireEvent.keyDown(input, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('hands focus back to where it came from when closed without a jump', () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const view = render(
      <FocusProvider engineData={engineData} referenceData={referenceData} curatedChains={curatedChains}>
        <CommandPalette onRun={() => undefined} onClose={() => undefined} />
      </FocusProvider>,
    );
    expect(document.activeElement).toBe(screen.getByRole('combobox'));
    view.unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
