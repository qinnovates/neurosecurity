// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { regionKqlHref } from '@/lib/atlas-explorer/region-kql';
import BciKql, * as editor from '@/components/bci/BciKql';
import { fillEditorWhenReady } from '../prefilled-kql';

const TABLES = { companies: [{ name: 'Example Neuro', security_posture: 'none_published' }] };
const QUERY = 'companies | where security_posture == "none_published"';
const SEARCH = new URL(regionKqlHref(QUERY), 'https://qinnovate.com').search;

afterEach(cleanup);

describe('fillEditorWhenReady', () => {
  it('opens the editor on the query a dossier link carries, and runs it', () => {
    fillEditorWhenReady(SEARCH, editor);
    render(<BciKql tables={TABLES} />);
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(QUERY);
    expect(screen.getByText('Example Neuro')).toBeTruthy();
  });

  it('leaves the editor on its own default when the address asks for nothing', () => {
    fillEditorWhenReady('', editor);
    render(<BciKql tables={TABLES} />);
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('companies');
  });
});
