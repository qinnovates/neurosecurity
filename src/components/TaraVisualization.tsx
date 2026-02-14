
import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import Hourglass3D from './Hourglass3D';
const NetworkGraph = lazy(() => import('./NetworkGraph'));

// --- Types ---
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
    bandsStr?: string;
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

export default function TaraVisualization({ threats, categories, bands }: TaraVisualizationProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('modality');
    const [selectedBand, setSelectedBand] = useState<string | null>(null);
    const [showNetwork, setShowNetwork] = useState(false);
    const [hoveredThreatId, setHoveredThreatId] = useState<string | null>(null);

    // Drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerThreats, setDrawerThreats] = useState<ThreatVector[]>([]);
    const [drawerContext, setDrawerContext] = useState({ band: '', category: '' });

    // --- Derived State ---
    const hoveredThreat = useMemo(() =>
        threats.find(t => t.id === hoveredThreatId),
        [hoveredThreatId, threats]);

    const active3DBand = useMemo(() => {
        if (hoveredThreat && hoveredThreat.bands.length > 0) return hoveredThreat.bands[0];
        return selectedBand;
    }, [hoveredThreat, selectedBand]);

    const filteredThreats = useMemo(() => {
        if (!selectedBand) return threats;
        return threats.filter(t => t.bands.includes(selectedBand));
    }, [threats, selectedBand]);

    // --- Handlers ---
    const handleBandClick = (bandId: string) => {
        setSelectedBand(prev => prev === bandId ? null : bandId);
    };

    const handleCellClick = (band: string, category: string, cellThreats: ThreatVector[]) => {
        if (cellThreats.length === 0) return;
        setDrawerThreats(cellThreats);
        setDrawerContext({ band, category });
        setDrawerOpen(true);
    };

    // --- Color Helpers ---
    const getCellColor = (t: ThreatVector) => {
        if (viewMode === 'modality') {
            switch (t.severity) {
                case 'critical': return 'bg-red-500/10 text-red-600 border-red-500/20';
                case 'high': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
                case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
                default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
            }
        }
        if (viewMode === 'clinical') {
            const du = t.tara?.dual_use || 'silicon_only';
            switch (du) {
                case 'confirmed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
                case 'probable': return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
                case 'possible': return 'bg-violet-500/10 text-violet-600 border-violet-500/20';
                default: return 'bg-slate-500/10 text-slate-400 border-slate-200';
            }
        }
        if (viewMode === 'diagnostic') {
            const cluster = t.tara?.dsm5?.cluster;
            switch (cluster) {
                case 'cognitive_psychotic': return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
                case 'mood_trauma': return 'bg-yellow-400/10 text-yellow-700 border-yellow-400/20';
                case 'motor_neurocognitive': return 'bg-red-500/10 text-red-700 border-red-500/20';
                case 'persistent_personality': return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
                default: return 'bg-slate-500/10 text-slate-400 border-slate-200';
            }
        }
        if (viewMode === 'governance') {
            const tier = t.tara?.governance?.consent_tier;
            switch (tier) {
                case 'IRB': return 'bg-red-500/10 text-red-600 border-red-500/20';
                case 'enhanced': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
                case 'standard': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
                default: return 'bg-slate-500/10 text-slate-400 border-slate-200';
            }
        }
        return 'bg-slate-50 text-slate-400';
    };

    const getDotColor = (t: ThreatVector) => {
        const fullClass = getCellColor(t);
        const textClass = fullClass.split(' ').find(c => c.startsWith('text-')) || 'text-slate-400';
        return textClass.replace('text-', 'bg-');
    };

    // --- Components ---
    const Badge = ({ children, className = '', title }: { children: React.ReactNode, className?: string, title?: string }) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${className}`} title={title}>
            {children}
        </span>
    );

    // --- Intuitive Mapping Lexicon (MITRE-like) ---
    const getAttackPhase = (tactic: string) => {
        const t = tactic.toLowerCase();
        if (t.includes('access') || t.includes('injection') || t.includes('entry')) return { label: 'Initial Access', color: 'text-blue-500', bg: 'bg-blue-50' };
        if (t.includes('collection') || t.includes('eavesdropping') || t.includes('exfiltration')) return { label: 'Collection/Privacy', color: 'text-purple-500', bg: 'bg-purple-50' };
        if (t.includes('persistence') || t.includes('implant') || t.includes('installation')) return { label: 'Persistence', color: 'text-orange-500', bg: 'bg-orange-50' };
        if (t.includes('impact') || t.includes('disruption') || t.includes('integrity') || t.includes('denial')) return { label: 'Clinical Impact', color: 'text-red-500', bg: 'bg-red-50' };
        return { label: 'Engagement', color: 'text-slate-500', bg: 'bg-slate-50' };
    };

    const ZONE_DESCRIPTIONS: Record<string, string> = {
        'neural': 'Targeting biological brain tissue directly (N7-N1).',
        'interface': 'Targeting the electrode-tissue boundary (I0).',
        'synthetic': 'Targeting digital processing and telemetry layers (S1-S3).'
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col lg:flex-row gap-8 min-h-[700px]">
                {/* LEFT: 3D Control & Perspective */}
                <div className="lg:w-1/3 flex flex-col gap-6">
                    <div className="glass p-4 rounded-2xl flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Perspective</span>
                            <span className="text-[10px] text-slate-400 font-mono">QIF-ATLAS-v4.0</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {(['modality', 'clinical', 'diagnostic', 'governance'] as ViewMode[]).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${viewMode === mode
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                                        }`}
                                >
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="glass rounded-2xl h-[450px] relative overflow-hidden group">
                        <div className="absolute top-4 left-4 z-10">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                {showNetwork ? 'Neural Impact Chain' : 'Structural Locus'}
                            </h3>
                            {!showNetwork && active3DBand && (
                                <div className="text-2xl font-mono font-black text-slate-800">
                                    {active3DBand}
                                </div>
                            )}
                        </div>

                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                            <button
                                onClick={() => setShowNetwork(!showNetwork)}
                                className="bg-white/80 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border border-slate-200 hover:bg-white transition-all active:scale-95"
                            >
                                {showNetwork ? 'Hourglass' : 'Network'}
                            </button>
                        </div>

                        {showNetwork ? (
                            <Suspense fallback={<div className="flex items-center justify-center h-[450px] text-slate-400 text-sm">Loading network graph…</div>}>
                                <NetworkGraph threats={filteredThreats} height={450} />
                            </Suspense>
                        ) : (
                            <Hourglass3D
                                highlightBandId={active3DBand}
                                onBandClick={handleBandClick}
                                className="w-full h-full"
                            />
                        )}

                        {!showNetwork && (
                            <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                {selectedBand ? 'Click Band to Reset' : 'Select Band to Filter'}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Heatmap Grid */}
                <div className="lg:w-2/3 flex flex-col">
                    <div className="mb-6 flex flex-wrap gap-4 items-end justify-between">
                        <div>
                            <h2 className="text-3xl font-black font-[family-name:var(--font-heading)] uppercase tracking-tighter">
                                {viewMode === 'modality' && <span className="text-red-600">Modality</span>}
                                {viewMode === 'clinical' && <span className="text-emerald-600">Clinical</span>}
                                {viewMode === 'diagnostic' && <span className="text-amber-600">Diagnostic</span>}
                                {viewMode === 'governance' && <span className="text-blue-600">Governance</span>}
                                <span className="text-slate-300 ml-2">Projection</span>
                            </h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {filteredThreats.length} Techniques Active
                            </p>
                        </div>
                    </div>

                    <div className="glass rounded-2xl border border-slate-200 overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <div className="grid grid-cols-[100px_repeat(8,minmax(60px,1fr))] gap-px bg-slate-200">
                                {/* Header */}
                                <div className="bg-slate-50 p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 left-0 z-30">
                                    Band
                                </div>
                                {categories.map(cat => (
                                    <div key={cat.id} className="bg-slate-50 p-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest sticky top-0 z-20" title={cat.name}>
                                        {cat.id}
                                    </div>
                                ))}

                                {/* Body */}
                                {bands.map((band, idx) => {
                                    const showSeparator = idx === 0 || band.zone !== bands[idx - 1].zone;
                                    return (
                                        <React.Fragment key={band.id}>
                                            {showSeparator && (
                                                <div
                                                    className="col-span-full bg-slate-100/50 py-1.5 px-3 border-y border-slate-200 cursor-help group/zone"
                                                    title={ZONE_DESCRIPTIONS[band.zone.toLowerCase()]}
                                                >
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover/zone:text-slate-600 transition-colors">
                                                        {band.zone} Zone
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`bg-white p-3 text-xs font-mono font-black sticky left-0 z-20 flex items-center
                                                ${selectedBand === band.id ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}
                                                ${filteredThreats.some(t => t.bands.includes(band.id)) ? '' : 'opacity-30'}
                                            `}>
                                                {band.id}
                                            </div>

                                            {categories.map(cat => {
                                                const cellThreats = filteredThreats.filter(t =>
                                                    t.bands.includes(band.id) && t.category === cat.id
                                                );

                                                // Determine dominant threat for color
                                                const dominantThreat = cellThreats.length > 0 ? [...cellThreats].sort((a, b) => {
                                                    const rank = { critical: 4, high: 3, medium: 2, low: 1 };
                                                    return (rank[b.severity as keyof typeof rank] || 0) - (rank[a.severity as keyof typeof rank] || 0);
                                                })[0] : null;

                                                return (
                                                    <div
                                                        key={`${band.id}-${cat.id}`}
                                                        onClick={() => handleCellClick(band.id, cat.id, cellThreats)}
                                                        className={`bg-white min-h-[50px] flex items-center justify-center transition-all
                                                            ${cellThreats.length === 0 ? 'bg-slate-50/30' : 'hover:bg-slate-100 cursor-pointer group'}
                                                            ${dominantThreat ? getCellColor(dominantThreat).split(' ')[0] : ''}
                                                        `}
                                                    >
                                                        {cellThreats.length > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <span className={`w-1.5 h-1.5 rounded-full ${dominantThreat ? getDotColor(dominantThreat) : ''}`}></span>
                                                                <span className="text-[11px] font-mono font-black text-slate-700">
                                                                    {cellThreats.length}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DETAIL DRAWER */}
            <div
                className={`fixed inset-0 z-[100] transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setDrawerOpen(false)}
            >
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                <div
                    className={`absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl transition-transform duration-500 transform ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="h-full flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter">
                                    {drawerContext.band} <span className="text-slate-300">×</span> {drawerContext.category}
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {drawerThreats.length} Techniques Detected
                                </p>
                            </div>
                            <button
                                onClick={() => setDrawerOpen(false)}
                                className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {drawerThreats.map(t => (
                                <div key={t.id} className="group flex flex-col gap-4 p-5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/40 transition-all">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <code className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{t.id}</code>
                                                <Badge className={
                                                    t.severity === 'critical' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        t.severity === 'high' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            'bg-slate-50 text-slate-500 border-slate-100'
                                                }>
                                                    {t.severity}
                                                </Badge>
                                            </div>
                                            <h4 className="text-lg font-bold leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                                {t.name}
                                            </h4>
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {t.description}
                                    </p>

                                    {/* Projection-Specific Rich Content */}
                                    {viewMode === 'modality' && (
                                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                                            <div className="p-3 bg-slate-50 rounded-xl">
                                                <span className="block text-slate-400 font-bold uppercase mb-1">NISS Score</span>
                                                <span className="text-lg font-black text-slate-800">{t.niss?.score?.toFixed(1) || '0.0'}</span>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl">
                                                <span className="block text-slate-400 font-bold uppercase mb-1">Status</span>
                                                <span className="font-black text-slate-800 uppercase tracking-tighter">{t.status}</span>
                                            </div>
                                        </div>
                                    )}

                                    {viewMode === 'clinical' && t.tara?.clinical && (
                                        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                            <span className="block text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-2">Therapeutic Application</span>
                                            <p className="font-bold text-slate-800 mb-2 truncate">{t.tara.clinical.therapeutic_analog}</p>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge className="bg-white border-emerald-200 text-emerald-600">{t.tara.clinical.fda_status}</Badge>
                                                <Badge className="bg-white border-emerald-200 text-emerald-600">{t.tara.clinical.evidence_level}</Badge>
                                            </div>
                                        </div>
                                    )}

                                    {viewMode === 'diagnostic' && t.tara?.dsm5 && (
                                        <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                                            <span className="block text-amber-600 text-[10px] font-black uppercase tracking-widest mb-2">Psychiatric Impact</span>
                                            <div className="space-y-2">
                                                {t.tara.dsm5.primary.map(d => (
                                                    <div key={d.code} className="flex items-center justify-between text-xs">
                                                        <span className="font-bold text-slate-700">{d.name}</span>
                                                        <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-amber-200">{d.code}</code>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {viewMode === 'governance' && t.tara?.governance && (
                                        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                            <span className="block text-blue-600 text-[10px] font-black uppercase tracking-widest mb-2">Governance Tier</span>
                                            <p className="font-black text-slate-800 uppercase mb-2">{t.tara.governance.consent_tier}</p>
                                            <p className="text-[10px] text-blue-600 font-medium italic">Safety: {t.tara.governance.safety_ceiling}</p>
                                        </div>
                                    )}

                                    <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{t.tactic}</span>
                                            {(() => {
                                                const phase = getAttackPhase(t.tactic);
                                                return <Badge className={`${phase.bg} ${phase.color} border-transparent`} title="MITRE-aligned attack phase">
                                                    {phase.label}
                                                </Badge>
                                            })()}
                                        </div>
                                        <a href={`/TARA/${t.id}`} className="text-xs font-black text-blue-600 hover:underline">Full Protocol &rarr;</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
