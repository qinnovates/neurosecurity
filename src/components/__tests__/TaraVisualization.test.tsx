// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TaraVisualization from '../TaraVisualization';

afterEach(cleanup);

const mockThreats = [
    {
        id: 'TARA-001',
        name: 'Test Threat',
        category: 'SI',
        tactic: 'SI',
        severity: 'critical',
        status: 'CONFIRMED',
        bands: ['N7'],
        description: 'Test Description',
        tara: {
            dual_use: 'confirmed',
            clinical: {
                therapeutic_analog: 'Deep Brain Stimulation',
                conditions: ['Parkinson\'s'],
                fda_status: 'approved',
                evidence_level: 'established'
            }
        },
        dsm5: {
            cluster: 'motor_neurocognitive',
            primary: [{ code: 'F20.9', name: 'Schizophrenia' }]
        }
    }
];

const mockCategories = [
    { id: 'SI', name: 'Signal Injection', description: 'Test' }
];

const mockBands = [
    { id: 'N7', name: 'Neocortex', zone: 'Neural', color: '#ff0000' }
];

function renderVisualization() {
    render(<TaraVisualization threats={mockThreats} categories={mockCategories} bands={mockBands} />);
}

function openNeuralDomain() {
    fireEvent.click(screen.getByRole('button', { name: /Neural/ }));
}

describe('TaraVisualization', () => {
    it('starts on the domain picker with no techniques listed', () => {
        renderVisualization();
        expect(screen.getByRole('button', { name: /Neural/ })).toBeDefined();
        expect(screen.getByRole('button', { name: /Interface/ })).toBeDefined();
        expect(screen.getByRole('button', { name: /Synthetic/ })).toBeDefined();
        expect(screen.queryByText('TARA-001')).toBeNull();
    });

    it('lists the bands of the chosen domain', () => {
        renderVisualization();
        openNeuralDomain();
        expect(screen.getByText('Select Locus')).toBeDefined();
        expect(screen.getByRole('button', { name: /Neocortex/ })).toBeDefined();
    });

    it('shows the techniques mapped to a band once it is selected', () => {
        renderVisualization();
        openNeuralDomain();
        expect(screen.queryByText('TARA-001')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: /Neocortex/ }));
        expect(screen.getAllByText('TARA-001').length).toBeGreaterThan(0);
    });

    it('returns to the domain picker and clears the selection', () => {
        renderVisualization();
        openNeuralDomain();
        fireEvent.click(screen.getByRole('button', { name: /Neocortex/ }));
        fireEvent.click(screen.getByRole('button', { name: 'Back to Domains' }));
        expect(screen.queryByText('Select Locus')).toBeNull();
        expect(screen.queryByText('TARA-001')).toBeNull();
        expect(screen.getByRole('button', { name: /Synthetic/ })).toBeDefined();
    });
});
