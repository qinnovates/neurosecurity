import React, { useState, useMemo } from 'react';

// --- Types ---
type Domain = 'neural' | 'interface' | 'synthetic' | null;
type ViewMode = 'modality' | 'clinical' | 'diagnostic' | 'governance';
type NeurorightCode = 'MP' | 'CL' | 'MI' | 'PC' | 'EA';
type SortMode = 'default' | 'niss' | 'rights';

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
    neurorights?: {
        affected: string[];
        cci: number;
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

// --- CRB Population Profiles (from NSv2.1b Entry 14) ---
const CRB_POPULATIONS = [
    { id: 'default', label: 'Adult (Default)', crb: 0.0, short: 'Adult' },
    { id: 'child_adhd', label: 'Child (10yr) + ADHD', crb: 0.5875, short: 'Child+ADHD' },
    { id: 'adult_als', label: 'Adult with ALS', crb: 0.5375, short: 'ALS' },
] as const;

const CRB_GAMMA = 0.30;

function crbAdjust(niss: number, crb: number): number {
    return Math.min(niss * (1 + CRB_GAMMA * crb), 10.0);
}

function nissSeverityLabel(score: number): string {
    if (score >= 9.0) return 'critical';
    if (score >= 7.0) return 'high';
    if (score >= 4.0) return 'medium';
    if (score > 0) return 'low';
    return 'none';
}

const NEURORIGHT_LABELS: Record<string, string> = {
    MP: 'Mental Privacy',
    CL: 'Cognitive Liberty',
    MI: 'Mental Integrity',
    PC: 'Psychological Continuity',
};

const NEURORIGHT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    MP: { bg: 'bg-violet-500/10', text: 'text-violet-600', border: 'border-violet-500/20' },
    CL: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20' },
    MI: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20' },
    PC: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20' },
};

export default function TaraVisualization({ threats, bands }: TaraVisualizationProps) {
    const [selectedDomain, setSelectedDomain] = useState<Domain>(null);
    const [selectedBand, setSelectedBand] = useState<string | null>(null);
    const [activeTechnique, setActiveTechnique] = useState<ThreatVector | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('modality');
    const [neurorightFilter, setNeurorightFilter] = useState<NeurorightCode | null>(null);
    const [crbPopulation, setCrbPopulation] = useState(CRB_POPULATIONS[0]);
    const [sortMode, setSortMode] = useState<SortMode>('default');

    // Derived: Group bands by zone
    const domainBands = useMemo(() => {
        if (!selectedDomain) return [];
        return bands.filter(b => b.zone.toLowerCase() === selectedDomain);
    }, [selectedDomain, bands]);

    // Derived: Contextual filtered threats (band + neuroright filter)
    const filteredThreats = useMemo(() => {
        if (!selectedBand) return [];
        let result = threats.filter(t => t.bands.includes(selectedBand));

        // Apply neurorights filter
        if (neurorightFilter) {
            result = result.filter(t => {
                const nr = (t as any).neurorights;
                return nr?.affected?.includes(neurorightFilter);
            });
        }

        // Apply sort
        if (sortMode === 'niss') {
            result = [...result].sort((a, b) => (b.niss?.score ?? 0) - (a.niss?.score ?? 0));
        } else if (sortMode === 'rights') {
            result = [...result].sort((a, b) => {
                const aRights = ((a as any).neurorights?.affected?.length ?? 0);
                const bRights = ((b as any).neurorights?.affected?.length ?? 0);
                return bRights - aRights;
            });
        }

        return result;
    }, [threats, selectedBand, neurorightFilter, sortMode]);

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
            case 'governance': return { text: 'text-purple-600', bg: 'bg-purple-600', shadow: 'shadow-purple-600/20', dot: 'bg-purple-400' };
            default: return { text: 'text-slate-900', bg: 'bg-slate-900', shadow: 'shadow-slate-900/20', dot: 'bg-slate-400' };
        }
    };

    // Sub-component: Neurorights badges
    const NeurorightsBadges = ({ codes }: { codes: string[] }) => (
        <div className="flex flex-wrap gap-1">
            {codes.map(code => {
                const colors = NEURORIGHT_COLORS[code] ?? { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' };
                return (
                    <span key={code} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors.bg} ${colors.text} border ${colors.border}`} title={NEURORIGHT_LABELS[code]}>
                        {code}
                    </span>
                );
            })}
        </div>
    );

    // Sub-component: CCI bar
    const CciBar = ({ cci }: { cci: number }) => {
        const pct = Math.min(cci / 4 * 100, 100);
        const color = cci >= 2.0 ? '#ef4444' : cci >= 1.0 ? '#eab308' : '#22c55e';
        return (
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-slate-400 shrink-0">CCI</span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden max-w-[80px]">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
                <span className="text-[10px] font-mono font-bold" style={{ color }}>{cci.toFixed(2)}</span>
            </div>
        );
    };

    // Sub-component: Insight Badge Strip
    const InsightStrip = ({ t }: { t: ThreatVector }) => {
        const nr = (t as any).neurorights;
        return (
            <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-50">
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight ${t.niss?.score && t.niss.score > 5 ? 'bg-red-500/10 text-red-600' : 'bg-slate-50 text-slate-400'}`} title="Modality/NISS">Security</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight ${t.tara?.clinical ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-50 text-slate-400'}`} title="Clinical/Therapeutic">Clinical</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight ${t.tara?.dsm5 ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-50 text-slate-400'}`} title="Diagnostic/Psychiatric">Diagnostic</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight ${nr?.affected?.length > 0 ? 'bg-purple-500/10 text-purple-600' : 'bg-slate-50 text-slate-400'}`} title="Neurorights">Rights</span>
            </div>
        );
    };

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
                        The QIF TARA Atlas maps neurotechnology techniques to the neurorights they threaten across the bio-digital boundary.
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
                        onClick={() => { setSelectedDomain(null); setSelectedBand(null); setActiveTechnique(null); setNeurorightFilter(null); setSortMode('default'); }}
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

                <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mr-2">View techniques by</span>
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
            </div>

            {/* Neurorights Filter Bar + CRB Population Selector (visible in governance mode) */}
            {viewMode === 'governance' && selectedBand && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-2 pb-4 border-b border-slate-50">
                    {/* Neurorights filter pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold text-slate-400 mr-1">Filter by right:</span>
                        <button
                            onClick={() => setNeurorightFilter(null)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${!neurorightFilter ? 'bg-purple-600 text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
                        >
                            All
                        </button>
                        {(['MP', 'CL', 'MI', 'PC', 'EA'] as NeurorightCode[]).map(code => {
                            const colors = NEURORIGHT_COLORS[code];
                            const isActive = neurorightFilter === code;
                            return (
                                <button
                                    key={code}
                                    onClick={() => setNeurorightFilter(isActive ? null : code)}
                                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${isActive
                                        ? `${colors.bg} ${colors.text} border ${colors.border}`
                                        : 'bg-slate-50 text-slate-400 hover:text-slate-600'
                                    }`}
                                    title={NEURORIGHT_LABELS[code]}
                                >
                                    {code}
                                </button>
                            );
                        })}
                    </div>

                    {/* CRB Population selector */}
                    <div className="flex items-center gap-2 sm:ml-auto">
                        <span className="text-[11px] font-semibold text-slate-400 mr-1">Population:</span>
                        {CRB_POPULATIONS.map(pop => (
                            <button
                                key={pop.id}
                                onClick={() => setCrbPopulation(pop)}
                                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${crbPopulation.id === pop.id
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-50 text-slate-400 hover:text-slate-600'
                                }`}
                                title={pop.label}
                            >
                                {pop.short}
                            </button>
                        ))}
                    </div>

                    {/* Sort selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-400 mr-1">Sort:</span>
                        {[
                            { id: 'default' as SortMode, label: 'Default' },
                            { id: 'niss' as SortMode, label: 'NISS' },
                            { id: 'rights' as SortMode, label: 'Rights' },
                        ].map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSortMode(s.id)}
                                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${sortMode === s.id
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-50 text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

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
                            {neurorightFilter && selectedBand && (
                                <span className="ml-2 text-purple-500">
                                    ({NEURORIGHT_LABELS[neurorightFilter]})
                                </span>
                            )}
                        </h3>
                        {selectedBand && (
                            <span className="text-xs font-mono text-slate-300">{filteredThreats.length} results</span>
                        )}
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
                                const nr = (t as any).neurorights as { affected: string[]; cci: number } | null;
                                const nissBase = t.niss?.score ?? 0;
                                const nissAdj = crbPopulation.crb > 0 ? crbAdjust(nissBase, crbPopulation.crb) : nissBase;
                                const nissDelta = nissAdj - nissBase;
                                const adjSeverity = nissSeverityLabel(nissAdj);
                                const baseSeverity = nissSeverityLabel(nissBase);
                                const tierChanged = adjSeverity !== baseSeverity && crbPopulation.crb > 0;

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
                                                        {/* Neurorights badges */}
                                                        {nr && nr.affected.length > 0 ? (
                                                            <div>
                                                                <span className="text-[11px] font-semibold text-purple-500 mb-2 block">
                                                                    {nr.affected.length} Neuroright{nr.affected.length !== 1 ? 's' : ''} at Risk
                                                                </span>
                                                                <NeurorightsBadges codes={nr.affected} />

                                                                {/* CCI bar */}
                                                                <div className="mt-3">
                                                                    <CciBar cci={nr.cci} />
                                                                </div>

                                                                {/* NISS + CRB delta */}
                                                                <div className="mt-3 flex items-center gap-3">
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="text-[10px] font-semibold text-slate-400">NISS</span>
                                                                        <span className="text-lg font-semibold text-slate-900">{nissBase.toFixed(1)}</span>
                                                                    </div>
                                                                    {crbPopulation.crb > 0 && nissBase > 0 && (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-[10px] text-slate-300">→</span>
                                                                            <span className={`text-lg font-semibold ${tierChanged ? 'text-red-500' : 'text-slate-700'}`}>
                                                                                {nissAdj.toFixed(1)}
                                                                            </span>
                                                                            <span className={`text-[10px] font-bold ${tierChanged ? 'text-red-500' : 'text-orange-400'}`}>
                                                                                +{nissDelta.toFixed(2)}
                                                                            </span>
                                                                            {tierChanged && (
                                                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-600 border border-red-500/20">
                                                                                    TIER CHANGE
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <span className="text-[11px] font-semibold text-slate-400 mb-1 block">No Neurorights Mapped</span>
                                                                <h4 className="text-xl font-semibold text-slate-400 tracking-tight leading-tight mb-2">
                                                                    {t.name}
                                                                </h4>
                                                            </div>
                                                        )}
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
                                                            href={`/threat-models/tara/${t.id}`}
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
