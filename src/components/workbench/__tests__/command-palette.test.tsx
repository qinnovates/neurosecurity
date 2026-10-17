// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { loadTaraChains } from '@/components/atlas/load-tara-chains';
import { buildModelFromIntake, defaultAnswersFor } from '@/lib/threat-model/intake-to-model';
import { loadEngineBundle, loadReferenceData } from '@/lib/threat-model/__tests__/load-test-data';
import CommandPalette, { PALETTE_RESULT_LIMIT } from '../CommandPalette';
import { FocusProvider } from '../FocusContext';
import { MODE_IDS } from '../mode-registry';
import { findMatchRanges, listPaletteCommands, searchPaletteCommands, type PaletteCommand } from '../palette-commands';
import { describeRoute } from '../route';
import { DEVICE_ACTIONS } from '../shell-targets';
import { MODE_VIEW_GROUPS } from '../view-registry';

afterEach(() => { cleanup(); Reflect.deleteProperty(document, 'getAnimations'); });

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

function command(label: string, detail = 'Technique'): PaletteCommand {
  return { kind: 'technique', key: `technique:${label}`, label, detail, techniqueId: label };
}
function labelsFor(list: readonly PaletteCommand[], query: string): string[] {
  return searchPaletteCommands(list, query, PALETTE_RESULT_LIMIT).matches.map((match) => match.label);
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

  it('lists the shell\'s device actions, each saying where it leads in the registries\' own words', () => {
    const actions = commands.filter((candidate) => candidate.kind === 'action');
    expect(actions.map((action) => [action.label, action.detail])).toEqual(DEVICE_ACTIONS.map((action) => [action.label, describeRoute(action.target)]));
    expect(searchPaletteCommands(commands, 'print', PALETTE_RESULT_LIMIT).matches).toContainEqual(expect.objectContaining({ kind: 'action', actionId: 'print-report' }));
  });

  it('ranks a match at the start of a word above one inside a word, and drops inside-word matches when a better one exists', () => {
    const list = [command('Command hijacking'), command('Slow drift (phase space manipulation)'), command('Man-in-the-middle'), command('Manual override')];
    // "man" begins "Man-in-the-middle", "Manual" and "manipulation"; in "Command" it sits inside the word.
    expect(labelsFor(list, 'man')).toEqual(['Man-in-the-middle', 'Manual override', 'Slow drift (phase space manipulation)']);
    expect(searchPaletteCommands(list, 'man', PALETTE_RESULT_LIMIT).matchCount).toBe(3);
    // Both words must begin a word: only one name has "man" and "in" that way.
    expect(labelsFor(list, 'man in')).toEqual(['Man-in-the-middle']);
    // With nothing better, an inside-word match is still listed, so a fragment of an identifier finds its technique.
    expect(labelsFor(list, 'jack')).toEqual(['Command hijacking']);
    expect(labelsFor([command('Replay', 'QIF-T0004')], '0004')).toEqual(['Replay']);
  });

  it('puts an exact name first, then a leading match, then word starts, keeping the registry order within each', () => {
    const list = [command('Signal replay attack'), command('Replay of stored signals'), command('Replay')];
    expect(labelsFor(list, 'replay')).toEqual(['Replay', 'Replay of stored signals', 'Signal replay attack']);
  });

  it('finds on the real catalog what "man in" names, and nothing matched only inside words', () => {
    const { matches } = searchPaletteCommands(commands, 'man in', PALETTE_RESULT_LIMIT);
    expect(matches.length).toBeGreaterThan(0);
    for (const match of matches) expect(`${match.label} ${match.detail}`.toLowerCase(), match.label).toMatch(/(^|[^a-z0-9])man.*|.*[^a-z0-9]man/);
    expect(matches.map((match) => match.label)).not.toContain('Command hijacking');
  });

  it('reports the stretches of a label the query matched, merged and in order', () => {
    expect(findMatchRanges('Man-in-the-middle', 'man in')).toEqual([{ start: 0, end: 3 }, { start: 4, end: 6 }]);
    expect(findMatchRanges('Man-in-the-middle', 'IN man')).toEqual([{ start: 0, end: 3 }, { start: 4, end: 6 }]);
    expect(findMatchRanges('Command hijacking', 'man')).toEqual([{ start: 3, end: 6 }]);
    expect(findMatchRanges('Replay', 're repl')).toEqual([{ start: 0, end: 4 }]);
    expect(findMatchRanges('Replay', 'QIF-T0004')).toEqual([]);
    expect(findMatchRanges('Replay', '')).toEqual([]);
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

  it('draws what the query matched heavier, without changing the option\'s text', () => {
    const { input } = renderPalette();
    expect(document.querySelectorAll('.lab-palette-mark')).toHaveLength(0);
    fireEvent.change(input, { target: { value: sampleTechnique.name.slice(0, 4) } });
    const first = within(screen.getByRole('group', { name: 'Techniques' })).getAllByRole('option')[0];
    const marks = [...first.querySelectorAll('mark.lab-palette-mark')].map((mark) => mark.textContent?.toLowerCase());
    expect(marks).toContain(sampleTechnique.name.slice(0, 4).toLowerCase());
    expect(first.textContent).toMatch(/QIF-T\d+$/);
  });

  it('groups the device actions under their own heading and runs one', () => {
    const { onRun, input } = renderPalette();
    fireEvent.change(input, { target: { value: 'edit device' } });
    const actions = screen.getByRole('group', { name: 'Actions' });
    fireEvent.click(within(actions).getByRole('option', { name: /Edit device/ }));
    expect(onRun).toHaveBeenCalledWith(expect.objectContaining({ kind: 'action', actionId: 'edit-device' }));
  });

  it('leaves in one move: it takes no input, hands focus back at once, and reports when the move has ended', () => {
    const onExited = vi.fn();
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const tree = (isClosing: boolean) => (
      <FocusProvider engineData={engineData} referenceData={referenceData} curatedChains={curatedChains}>
        <CommandPalette onRun={() => undefined} onClose={() => undefined} isClosing={isClosing} onExited={onExited} />
      </FocusProvider>
    );
    const view = render(tree(false));
    const dialog = screen.getByRole('dialog', { name: 'Go to' });
    expect(dialog.classList.contains('lab-float')).toBe(true);
    fireEvent.animationEnd(dialog);
    expect(onExited).not.toHaveBeenCalled();
    view.rerender(tree(true));
    expect(dialog.getAttribute('data-closing')).toBe('true');
    expect(dialog.parentElement?.hasAttribute('inert')).toBe(true);
    expect(document.activeElement).toBe(opener);
    fireEvent.animationEnd(dialog.querySelector('input') as HTMLElement);
    expect(onExited).not.toHaveBeenCalled();
    fireEvent.animationEnd(dialog);
    expect(onExited).toHaveBeenCalledTimes(1);
    opener.remove();
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
