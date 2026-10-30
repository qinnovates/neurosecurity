// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import BciKql, { KQL_INJECT_EVENT, KQL_READY_EVENT, KQL_ROOT_ATTRIBUTE } from '../BciKql';

const TABLES = { companies: [{ name: 'Example Neuro', security_posture: 'none_published' }] };
const INJECTED_QUERY = 'companies | where security_posture == "none_published"';

afterEach(cleanup);

describe('BciKql query injection', () => {
  it('announces readiness once mounted with data and marks its root for the page to scroll to', () => {
    const onReady = vi.fn();
    window.addEventListener(KQL_READY_EVENT, onReady);
    const { container } = render(<BciKql tables={TABLES} />);
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(container.querySelector(`[${KQL_ROOT_ATTRIBUTE}]`)).not.toBeNull();
    window.removeEventListener(KQL_READY_EVENT, onReady);
  });

  it('runs a query dispatched on window and shows it in the editor', () => {
    render(<BciKql tables={TABLES} />);
    act(() => {
      window.dispatchEvent(new CustomEvent(KQL_INJECT_EVENT, { detail: INJECTED_QUERY }));
    });
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(INJECTED_QUERY);
    expect(screen.getByText('Example Neuro')).toBeTruthy();
  });
});
