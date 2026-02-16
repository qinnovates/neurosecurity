import React, { useState, useMemo } from 'react';

// --- Types ---
type Domain = 'neural' | 'interface' | 'synthetic' | null;
type ViewMode = 'modality' | 'clinical' | 'diagnostic' | 'governance';

interface ThreatVector {
    id: string;
    name: string;
    category: string;
    tactic: string;
    severity: string;
    status: string;
    bands: string[];
    description: string;
    niss?: {
        score: number;
        severity: string;
        vector: string;
    };
    tara?: {
        dual_use: string;
        clinical?: {
            therapeutic_analog: string;
            conditions: string[];
            fda_status: string;
            evidence_level: string;
        };
        governance?: {
            consent_tier: string;
            safety_ceiling: string;
            data_classification: string;
        };
        dsm5?: {
            cluster: string;
            risk_class: string;
            primary: { code: string; name: string; confidence: string }[];
        };
    };
}

interface TaraVisualizationProps {
    threats: ThreatVector[];
    categories: { id: string; name: string; description: string }[];
    bands: { id: string; name: string; zone: string; color: string }[];
}

export default function TaraVisualization({ threats, bands }: TaraVisualizationProps) {
    const [selectedDomain, setSelectedDomain] = useState<Domain>(null);
    const [selectedBand, setSelectedBand] = useState<string | null>(null);
    const [activeTechnique, setActiveTechnique] = useState<ThreatVector | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('modality');

    // Derived: Group bands by zone
    const domainBands = useMemo(() => {
        if (!selectedDomain) return [];
        return bands.filter(b => b.zone.toLowerCase() === selectedDomain);
    }, [selectedDomain, bands]);

    // Derived: Contextual filtered threats
    const filteredThreats = useMemo(() => {
        if (!selectedBand) return [];
        return threats.filter(t => t.bands.includes(selectedBand));
    }, [threats, selectedBand]);

    // Helpers
    const getSeverityStyle = (severity: string) => {
        switch (severity) {
            case 'critical': return { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', glow: 'shadow-red-500/30' };
            case 'high': return { text: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', glow: 'shadow-orange-500/30' };
            case 'medium': return { text: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', glow: 'shadow-yellow-500/30' };
            default: return { text: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', glow: 'shadow-blue-500/30' };
        }
    };

    const getModeColor = (mode: ViewMode) => {
        switch (mode) {
            case 'modality': return { text: 'text-slate-900', bg: 'bg-slate-900', shadow: 'shadow-slate-900/20', dot: 'bg-slate-400' };
            case 'clinical': return { text: 'text-emerald-600', bg: 'bg-emerald-600', shadow: 'shadow-emerald-600/20', dot: 'bg-emerald-400' };
            case 'diagnostic': return { text: 'text-amber-600', bg: 'bg-amber-600', shadow: 'shadow-amber-600/20', dot: 'bg-amber-400' };
            case 'governance': return { text: 'text-blue-600', bg: 'bg-blue-600', shadow: 'shadow-blue-600/20', dot: 'bg-blue-400' };
            default: return { text: 'text-slate-900', bg: 'bg-slate-900', shadow: 'shadow-slate-900/20', dot: 'bg-slate-400' };
        }
    };

    // Sub-component: Insight Badge Strip
    const InsightStrip = ({ t }: { t: ThreatVector }) => (
        <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-50">
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight ${t.niss?.score && t.niss.score > 5 ? 'bg-red-500/10 text-red-600' : 'bg-slate-50 text-slate-400'}`} title="Modality/NISS">Security</span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight ${t.tara?.clinical ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-50 text-slate-400'}`} title="Clinical/Therapeutic">Clinical</span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight ${t.tara?.dsm5 ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-50 text-slate-400'}`} title="Diagnostic/Psychiatric">Diagnostic</span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight ${t.tara?.governance ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-50 text-slate-400'}`} title="Governance/Ethical">Governance</span>
        </div>
    );

    // --- RENDER LOGIC ---

    // 1. HUB VIEW
    if (!selectedDomain) {
        return (
            <div className="flex flex-col items-center py-24">
                <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <h2 className="text-6xl font-semibold font-[family-name:var(--font-heading)] tracking-tighter mb-6 text-slate-900 leading-none">
                        Access Points
                    </h2>
                    <p className="text-sm font-medium text-slate-400 max-w-lg mx-auto leading-relaxed">
                        The QIF TARA Registry is a dual-use directory of BCI techniques mapped across the bio-digital boundary.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-7xl px-4">
                    {[
                        { id: 'neural', name: 'Neural', desc: 'Biological Mind (N7-N1)', color: '#10b981', hoverBg: 'hover:bg-emerald-500/5', pillBg: 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white', borderAccent: 'group-hover:border-l-emerald-500' },
                        { id: 'interface', name: 'Interface', desc: 'Boundary Transduction (I0)', color: '#f59e0b', hoverBg: 'hover:bg-amber-500/5', pillBg: 'bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white', borderAccent: 'group-hover:border-l-amber-500' },
                        { id: 'synthetic', name: 'Synthetic', desc: 'Computation & Tel (S1-S3)', color: '#3b82f6', hoverBg: 'hover:bg-blue-500/5', pillBg: 'bg-blue-500/10 text-blue-600 group-hover:bg-blue-500 group-hover:text-white', borderAccent: 'group-hover:border-l-blue-500' }
                    ].map(d => (
                        <button
                            key={d.id}
                            onClick={() => setSelectedDomain(d.id as Domain)}
                            className={`group flex flex-col items-center p-12 rounded-[3rem] bg-white border border-slate-100 border-l-4 border-l-transparent ${d.borderAccent} ${d.hoverBg} cursor-pointer transition-all duration-500 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 relative overflow-hidden`}
                        >
                            <div className="mb-8 w-1 h-12 rounded-full transition-transform duration-500 group-hover:scale-y-150" style={{ backgroundColor: d.color }} />
                            <h3 className="text-2xl font-semibold tracking-tighter mb-3 text-slate-800">{d.name}</h3>
                            <p className="text-sm font-medium text-slate-400 leading-relaxed mb-6">{d.desc}</p>
                            <span className={`text-xs font-semibold px-4 py-2 rounded-full transition-all duration-500 ${d.pillBg}`}>
                                Access Zone <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span>
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // 2. TERMINAL VIEW
    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Header Control */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pb-10 border-b border-slate-100">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => { setSelectedDomain(null); setSelectedBand(null); setActiveTechnique(null); }}
                        className="px-5 py-3 rounded-xl bg-white border border-slate-100 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all font-semibold text-sm"
                    >
                        Back to Domains
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-medium text-slate-400">Operational Area:</span>
                            <span className="text-[11px] font-semibold text-emerald-500">Active</span>
                        </div>
                        <h2 className="text-4xl font-semibold tracking-tighter text-slate-900">{selectedDomain.charAt(0).toUpperCase() + selectedDomain.slice(1)} Zone</h2>
                    </div>
                </div>

                <div className="flex p-1.5 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                    {(['modality', 'clinical', 'diagnostic', 'governance'] as ViewMode[]).map(mode => {
                        const colors = getModeColor(mode);
                        const isActive = viewMode === mode;
                        return (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-8 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${isActive
                                    ? `${colors.bg} text-white shadow-lg ${colors.shadow}`
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                    }`}
                            >
                                {isActive && <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`} />}
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">

                {/* PILOT A: Locus Navigation */}
                <div className="flex flex-col gap-6 sticky top-24">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-semibold text-slate-400">Select Locus</h3>
                        <span className="text-xs font-mono text-slate-300">{domainBands.length} Units</span>
                    </div>
                    <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-3 custom-scrollbar">
                        {domainBands.map(band => (
                            <button
                                key={band.id}
                                onClick={() => { setSelectedBand(band.id); setActiveTechnique(null); }}
                                className={`group p-6 rounded-[2rem] border text-left transition-all duration-500 ${selectedBand === band.id
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02] z-10'
                                    : 'bg-white border-slate-100 hover:border-slate-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between pointer-events-none mb-1">
                                    <span className={`text-[11px] font-mono font-bold ${selectedBand === band.id ? 'text-blue-400' : 'text-slate-300'}`}>
                                        {band.id}
                                    </span>
                                </div>
                                <div className="text-lg font-semibold tracking-tight leading-none">
                                    {band.name}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* PILOT B: Technique Browser */}
                <div className="flex flex-col gap-8 min-h-[800px]">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-semibold text-slate-400">
                            {selectedBand ? `${selectedBand} Techniques` : "Awaiting Locus Activation"}
                        </h3>
                    </div>

                    {!selectedBand ? (
                        <div className="flex-1 rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center p-20 opacity-30">
                            <p className="text-sm font-medium text-center max-w-xs text-slate-400">
                                Select a Locus to begin analysis.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
                            {filteredThreats.map(t => {
                                const style = getSeverityStyle(t.severity);
                                const isActive = activeTechnique?.id === t.id;

                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => setActiveTechnique(t)}
                                        className={`group relative text-left p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col justify-between ${isActive
                                            ? 'bg-white border-slate-900 shadow-2xl scale-[1.01] z-20'
                                            : 'bg-white border-slate-100 hover:border-slate-200'
                                            }`}
                                    >
                                        <div>
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-6">
                                                <code className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg tracking-tight">{t.id}</code>
                                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
                                                    {t.severity}
                                                </span>
                                            </div>

                                            {/* Primary Insight */}
                                            <div className="mb-4">
                                                {viewMode === 'modality' && (
                                                    <div>
                                                        <h4 className="text-xl font-semibold text-slate-900 tracking-tight leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                                                            {t.name}
                                                        </h4>
                                                        <p className="text-xs font-medium text-slate-400">{t.tactic}</p>
                                                    </div>
                                                )}
                                                {viewMode === 'clinical' && (
                                                    <div>
                                                        <span className="text-[11px] font-semibold text-emerald-500 mb-1 block">Therapeutic Variant</span>
                                                        <h4 className="text-xl font-semibold text-slate-900 tracking-tight leading-tight mb-2">
                                                            {t.tara?.clinical?.therapeutic_analog || t.name}
                                                        </h4>
                                                        <div className="flex gap-2 mt-2">
                                                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">
                                                                {t.tara?.clinical?.fda_status || 'Pre-Clinical'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                {viewMode === 'diagnostic' && (
                                                    <div>
                                                        <span className="text-[11px] font-semibold text-amber-500 mb-1 block">Diagnostic Cluster</span>
                                                        <h4 className="text-xl font-semibold text-slate-900 tracking-tight leading-tight mb-2">
                                                            {t.tara?.dsm5?.cluster?.replace('_', ' ') || 'Non-Diagnostic'}
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {t.tara?.dsm5?.primary.map(d => (
                                                                <span key={d.code} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-100">
                                                                    {d.code} / {d.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {viewMode === 'governance' && (
                                                    <div>
                                                        <span className="text-[11px] font-semibold text-blue-500 mb-1 block">Consent Tier</span>
                                                        <h4 className="text-xl font-semibold text-slate-900 tracking-tight leading-tight mb-2">
                                                            {t.tara?.governance?.consent_tier || 'Standard'}
                                                        </h4>
                                                        <p className="text-xs font-medium text-slate-400 mt-2 leading-relaxed">
                                                            {t.tara?.governance?.safety_ceiling || "Standard parameters."}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <InsightStrip t={t} />

                                        {/* Inline Expansion */}
                                        {isActive && (
                                            <div className="mt-8 pt-8 border-t border-slate-100 animate-in slide-in-from-top-4">
                                                <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col gap-6">
                                                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                                        {t.description}
                                                    </p>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">NISS</span>
                                                            <span className="text-2xl font-semibold text-slate-900">{t.niss?.score?.toFixed(1) || '0.0'}</span>
                                                        </div>
                                                        <a
                                                            href={`/TARA/${t.id}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="flex-1 text-center py-4 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold hover:border-slate-900 transition-all"
                                                        >
                                                            Technical Protocol Access
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
