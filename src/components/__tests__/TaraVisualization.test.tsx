// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TaraVisualization from '../TaraVisualization';

afterEach(cleanup);

// Mock Hourglass3D to avoid canvas/webgl issues in test
vi.mock('../Hourglass3D', () => ({
    default: ({ highlightBandId, onBandClick }: any) => (
        <div data-testid="hourglass-mock" onClick={() => onBandClick('N7')}>
            {highlightBandId}
        </div>
    )
}));

const mockThreats = [
    {
        id: 'TARA-001',
        name: 'Test Threat',
        category: 'SI',
        severity: 'critical',
        status: 'CONFIRMED',
        bands: ['N7'],
        description: 'Test Description',
        tara: {
            dual_use: 'confirmed',
            clinical: {
                therapeutic_analog: 'Deep Brain Stimulation',
                conditions: ['Parkinson\'s']
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

describe('TaraVisualization', () => {
    it('renders in Attacker mode by default', () => {
        render(<TaraVisualization threats={mockThreats} categories={mockCategories} bands={mockBands} />);
        expect(screen.getByText('Threat Matrix')).toBeDefined();
        expect(screen.getByText('TARA-001')).toBeDefined(); // Shows ID in attacker mode
    });

    it('switches to Therapeutic mode', () => {
        render(<TaraVisualization threats={mockThreats} categories={mockCategories} bands={mockBands} />);
        const doctorBtn = screen.getByRole('button', { name: 'Therapeutic' });
        fireEvent.click(doctorBtn);
        expect(screen.getByText('Therapeutic Indications')).toBeDefined();
        expect(screen.getByText('Deep Brain Stimulation')).toBeDefined(); // Shows analog
    });

    it('switches to Diagnostic mode', () => {
        render(<TaraVisualization threats={mockThreats} categories={mockCategories} bands={mockBands} />);
        const diagBtn = screen.getByRole('button', { name: 'Diagnostic' });
        fireEvent.click(diagBtn);
        expect(screen.getByText('Diagnostic Risks (DSM-5)')).toBeDefined();
        expect(screen.getByText('F20.9')).toBeDefined(); // Shows DSM code
    });


    it('filters by band when 3D model is clicked', () => {
        render(<TaraVisualization threats={mockThreats} categories={mockCategories} bands={mockBands} />);
        const hourglass = screen.getByTestId('hourglass-mock');
        fireEvent.click(hourglass); // Clicks 'N7' based on mock
        expect(screen.getByText('/ N7')).toBeDefined();
    });
});
