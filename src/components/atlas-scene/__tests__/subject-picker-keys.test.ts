import { describe, expect, it } from 'vitest';
import { pickerKeyAction } from '../SubjectPicker';

const context = { query: '', activeIndex: 2, matchCount: 5 };

describe('pickerKeyAction', () => {
  it('moves within the matches and stops at both ends', () => {
    expect(pickerKeyAction('ArrowDown', context)).toEqual({ type: 'move', index: 3 });
    expect(pickerKeyAction('ArrowUp', context)).toEqual({ type: 'move', index: 1 });
    expect(pickerKeyAction('ArrowDown', { ...context, activeIndex: 4 })).toEqual({ type: 'move', index: 4 });
    expect(pickerKeyAction('ArrowUp', { ...context, activeIndex: 0 })).toEqual({ type: 'move', index: 0 });
    expect(pickerKeyAction('Home', context)).toEqual({ type: 'move', index: 0 });
    expect(pickerKeyAction('End', context)).toEqual({ type: 'move', index: 4 });
  });

  it('leaves Home and End to the text field while it holds text', () => {
    expect(pickerKeyAction('Home', { ...context, query: 'qif' })).toBeNull();
    expect(pickerKeyAction('End', { ...context, query: 'qif' })).toBeNull();
    expect(pickerKeyAction('ArrowDown', { ...context, query: 'qif' })).toEqual({ type: 'move', index: 3 });
  });

  it('chooses with Enter only when something matches, and clears with Escape only when there is a filter', () => {
    expect(pickerKeyAction('Enter', context)).toEqual({ type: 'choose' });
    expect(pickerKeyAction('Enter', { ...context, matchCount: 0 })).toBeNull();
    expect(pickerKeyAction('Escape', { ...context, query: 'x' })).toEqual({ type: 'clear' });
    expect(pickerKeyAction('Escape', context)).toBeNull();
  });

  it('leaves every other key, and every arrow when nothing matches, to the field', () => {
    expect(pickerKeyAction('a', context)).toBeNull();
    expect(pickerKeyAction('Tab', context)).toBeNull();
    expect(pickerKeyAction('ArrowDown', { ...context, matchCount: 0 })).toBeNull();
  });
});
