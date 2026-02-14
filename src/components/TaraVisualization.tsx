
import React, { useState, useMemo } from 'react';
import Hourglass3D from './Hourglass3D';
import NetworkGraph from './NetworkGraph';

// --- Types (re-exported or mirrored from threat-data for client use) ---
type ViewMode = 'attacker' | 'doctor' | 'diagnostic';

interface ThreatVector {
    id: string;
    name: string;
    category: string;
    severity: string;
    status: string;
    bands: string[];
    description: string;
    tara?: {
        dual_use: string;
        clinical?: {
            therapeutic_analog: string;
            conditions: string[];
        }
    };
    dsm5?: {
        cluster: string;
        primary: { code: string; name: string }[];
    };
}

interface TaraVisualizationProps {
    threats: ThreatVector[];
    categories: { id: string; name: string; description: string }[];
    bands: { id: string; name: string; zone: string; color: string }[];
}

export default function TaraVisualization({ threats, categories, bands }: TaraVisualizationProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('attacker');
    const [selectedBand, setSelectedBand] = useState<string | null>(null);
    const [showNetwork, setShowNetwork] = useState(false);
    const [hoveredThreatId, setHoveredThreatId] = useState<string | null>(null);

    // --- Derived State ---
    const hoveredThreat = useMemo(() =>
        threats.find(t => t.id === hoveredThreatId),
        [hoveredThreatId, threats]);

    // If a threat is hovered, highlight its primary band. Otherwise highlight selected band.
    const active3DBand = useMemo(() => {
        if (hoveredThreat && hoveredThreat.bands.length > 0) {
            return hoveredThreat.bands[0];
        }
        return selectedBand;
    }, [hoveredThreat, selectedBand]);

    // Filter threats based on selected band
    const filteredThreats = useMemo(() => {
        if (!selectedBand) return threats;
        return threats.filter(t => t.bands.includes(selectedBand));
    }, [threats, selectedBand]);

    // --- Handlers ---
    const handleBandClick = (bandId: string) => {
        setSelectedBand(prev => prev === bandId ? null : bandId);
    };

    // --- Render Helpers ---
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-500/20 text-red-600 border-red-500/40';
            case 'high': return 'bg-amber-500/20 text-amber-600 border-amber-500/40';
            case 'medium': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/40';
            case 'low': return 'bg-slate-500/20 text-slate-600 border-slate-500/40';
            default: return 'bg-slate-100 text-slate-500';
        }
    };

    const getEthicalColor = (dualUse: string) => {
        switch (dualUse) {
            case 'confirmed': return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/40';
            case 'probable': return 'bg-cyan-500/20 text-cyan-600 border-cyan-500/40';
            case 'possible': return 'bg-violet-500/20 text-violet-600 border-violet-500/40';
            case 'silicon_only': return 'bg-slate-100 text-slate-400 border-slate-200';
            default: return 'bg-slate-100 text-slate-500';
        }
    };

    const getDiagnosticColor = (cluster?: string) => {
        switch (cluster) {
            case 'cognitive_psychotic': return 'bg-amber-500/20 text-amber-700 border-amber-500/40'; // Amber/Orange
            case 'mood_trauma': return 'bg-yellow-400/20 text-yellow-700 border-yellow-400/40'; // Gold
            case 'motor_neurocognitive': return 'bg-red-500/20 text-red-700 border-red-500/40'; // Red
            case 'persistent_personality': return 'bg-purple-500/20 text-purple-700 border-purple-500/40'; // Purple
            case 'non_diagnostic': return 'bg-slate-100 text-slate-400 border-slate-200';
            default: return 'bg-slate-100 text-slate-500';
        }
    };

    // Helper to get card content based on mode
    const getCardContent = (threat: ThreatVector) => {
        if (viewMode === 'attacker') return threat.id;
        if (viewMode === 'doctor') return threat.tara?.clinical?.therapeutic_analog || 'N/A';
        // Diagnostic Mode: Show primary diagnosis code or 'None'
        return threat.dsm5?.primary?.[0]?.code || 'N/A';
    };

    const getCardTitle = (threat: ThreatVector) => {
        if (viewMode === 'attacker') return threat.name;
        if (viewMode === 'doctor') return threat.tara?.clinical?.therapeutic_analog || 'No analog';
        return threat.dsm5?.primary?.[0]?.name || 'Non-Diagnostic';
    };

    const bgTheme = useMemo(() => {
        if (viewMode === 'doctor') return 'bg-emerald-50/30';
        if (viewMode === 'diagnostic') return 'bg-amber-50/30';
        return '';
    }, [viewMode]);

    return (
        <div className={`flex flex-col lg:flex-row gap-8 min-h-[600px] transition-colors duration-500 ${bgTheme}`}>

            {/* LEFT: 3D Control & toggle */}
            <div className="lg:w-1/3 flex flex-col gap-6">

                {/* Mode Toggle */}
                <div className="glass p-4 rounded-2xl flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Perspective</span>
                    <div className="flex bg-slate-100 p-1 rounded-lg w-full">
                        <button
                            onClick={() => setViewMode('attacker')}
                            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'attacker'
                                ? 'bg-white shadow text-red-600'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Attacker
                        </button>
                        <button
                            onClick={() => setViewMode('doctor')}
                            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'doctor'
                                ? 'bg-white shadow text-emerald-600'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Therapeutic
                        </button>
                        <button
                            onClick={() => setViewMode('diagnostic')}
                            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'diagnostic'
                                ? 'bg-white shadow text-amber-600'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Diagnostic
                        </button>
                    </div>
                </div>


                {/* 3D Model & Network Graph Toggle */}
                <div className="glass rounded-2xl h-[400px] lg:h-[500px] relative overflow-hidden">
                    <div className="absolute top-4 left-4 z-10 transition-all duration-300">
                        <h3 className="text-sm font-bold text-slate-500 uppercase">
                            {showNetwork ? 'Neural Impact Chain' :
                                viewMode === 'attacker' ? 'Target Zone' :
                                    viewMode === 'doctor' ? 'Clinical Pathway' :
                                        'Neural Impact Structure'}
                        </h3>
                        {!showNetwork && active3DBand && (
                            <div className="text-2xl font-mono font-bold text-slate-800 animate-pulse">
                                {active3DBand}
                            </div>
                        )}
                    </div>

                    <div className="absolute top-4 right-4 z-10">
                        <button
                            onClick={() => setShowNetwork(!showNetwork)}
                            className="bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-slate-200 hover:bg-white transition-colors"
                        >
                            {showNetwork ? 'Show Hourglass' : 'Show Network'}
                        </button>
                    </div>

                    {showNetwork ? (
                        <NetworkGraph
                            threats={filteredThreats}
                            width={undefined} // Let it be responsive
                            height={500}
                        />
                    ) : (
                        <Hourglass3D
                            highlightBandId={active3DBand}
                            onBandClick={handleBandClick}
                            className="w-full h-full"
                        />
                    )}

                    {!showNetwork && (
                        <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-slate-400 pointer-events-none">
                            {selectedBand ? 'Click band again to reset' : 'Click a band to filter grid'}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Grid Visualization */}
            <div className="lg:w-2/3 flex flex-col">
                <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            {viewMode === 'attacker' && <span className="text-red-600">Threat Matrix</span>}
                            {viewMode === 'doctor' && <span className="text-emerald-600">Therapeutic Indications</span>}
                            {viewMode === 'diagnostic' && <span className="text-amber-600">Diagnostic Risks (DSM-5)</span>}
                            {selectedBand && <span className="text-slate-400 font-normal">/ {selectedBand}</span>}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {filteredThreats.length} items found
                        </p>
                    </div>

                    {/* Legend using switch for cleaner rendering */}
                    <div className="flex gap-3 text-xs flex-wrap">
                        {viewMode === 'attacker' && (
                            <>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>Critical</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>High</span>
                            </>
                        )}
                        {viewMode === 'doctor' && (
                            <>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Confirmed</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500"></span>Probable</span>
                            </>
                        )}
                        {viewMode === 'diagnostic' && (
                            <>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Cognitive</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>Mood</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>Motor</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden flex-1 relative">
                    <div className="overflow-auto max-h-[600px] p-1">
                        <div className="grid grid-cols-[120px_repeat(8,minmax(100px,1fr))] gap-px bg-slate-200">
                            {/* Header */}
                            <div className="bg-slate-50 p-2 text-xs font-bold text-slate-400 sticky top-0 left-0 z-20">
                                Band \ Cat
                            </div>
                            {categories.map(cat => (
                                <div key={cat.id} className="bg-white p-2 text-center text-xs font-bold text-slate-600 sticky top-0 z-10" title={cat.name}>
                                    {cat.id}
                                </div>
                            ))}

                            {/* Body */}
                            {bands.map(band => (
                                <React.Fragment key={band.id}>
                                    <div className={`bg-white p-2 text-xs font-mono font-bold sticky left-0 z-10 flex items-center
                                ${selectedBand === band.id ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}
                                ${filteredThreats.some(t => t.bands.includes(band.id)) ? '' : 'opacity-50'}
                            `}>
                                        {band.id}
                                    </div>

                                    {categories.map(cat => {
                                        const cellThreats = filteredThreats.filter(t =>
                                            t.bands.includes(band.id) && t.category === cat.id
                                        );

                                        return (
                                            <div
                                                key={`${band.id}-${cat.id}`}
                                                className={`bg-white min-h-[50px] p-1 transition-all hover:z-10
                                            ${cellThreats.length === 0 ? 'bg-slate-50/50' : 'hover:shadow-lg hover:scale-105 cursor-pointer'}
                                        `}
                                            >
                                                {cellThreats.map(threat => (
                                                    <a
                                                        key={threat.id}
                                                        href={`/TARA/${threat.id}`}
                                                        className={`block mb-1 text-[10px] p-1 rounded border truncate font-medium transition-colors
                                                    ${viewMode === 'attacker' ? getSeverityColor(threat.severity) : ''}
                                                    ${viewMode === 'doctor' ? getEthicalColor(threat.tara?.dual_use || 'silicon_only') : ''}
                                                    ${viewMode === 'diagnostic' ? getDiagnosticColor(threat.dsm5?.cluster) : ''}
                                                `}
                                                        onMouseEnter={() => setHoveredThreatId(threat.id)}
                                                        onMouseLeave={() => setHoveredThreatId(null)}
                                                        title={getCardTitle(threat)}
                                                    >
                                                        {getCardContent(threat)}
                                                    </a>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={`mt-4 p-4 rounded-lg text-xs border flex items-center gap-3 transition-colors duration-300
                    ${viewMode === 'attacker' ? 'bg-red-50/50 text-red-600 border-red-100' : ''}
                    ${viewMode === 'doctor' ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100' : ''}
                    ${viewMode === 'diagnostic' ? 'bg-amber-50/50 text-amber-600 border-amber-100' : ''}
                `}>
                    <span className="text-xl">ℹ️</span>
                    <div>
                        <strong>
                            {viewMode === 'attacker' && 'Security Perspective: '}
                            {viewMode === 'doctor' && 'Clinical Perspective: '}
                            {viewMode === 'diagnostic' && 'Diagnostic Perspective: '}
                        </strong>
                        {viewMode === 'attacker' && 'Standard cybersecurity view. Focus is on impact severtity and exploitability.'}
                        {viewMode === 'doctor' && 'Dual-use view. Focus is on therapeutic analogs (Beneficence). Every attack vector has a cure analog.'}
                        {viewMode === 'diagnostic' && 'DSM-5-TR view. Focus is on psychiatric risk. Maps neural disruption to diagnostic clusters (e.g., Psychosis, Trauma).'}
                    </div>
                </div>

            </div>
        </div>
    );
}
