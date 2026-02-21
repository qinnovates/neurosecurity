import React, { useState, useEffect } from 'react';
import { Shield, Activity, ShieldCheck, ShieldAlert, Wifi, Lock, ExternalLink, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FirewallEvent {
    timestamp: string;
    event: string;
}

function App() {
    const [isHardened, setIsHardened] = useState(true);
    const [events, setEvents] = useState<FirewallEvent[]>([
        { timestamp: new Date().toLocaleTimeString(), event: "Shield Dashboard active" },
        { timestamp: new Date().toLocaleTimeString(), event: "Stealth mode: ON" },
        { timestamp: new Date().toLocaleTimeString(), event: "Hostname masked to generic device name" },
        { timestamp: new Date().toLocaleTimeString(), event: "NetBIOS disabled (ports 137/138 closed)" },
        { timestamp: new Date().toLocaleTimeString(), event: "Waiting for firewall events..." },
    ]);
    const [networkInfo, setNetworkInfo] = useState({ ssid: 'Detecting...', status: 'Fingerprinting...' });

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch('./data/firewall_events.json');
                if (response.ok) {
                    const data = await response.json();
                    setEvents(data);
                }
            } catch {
                // Using default demo events
            }
        };

        fetchEvents();
        const interval = setInterval(fetchEvents, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <div className="sidebar glass-panel">
                <div className="logo-header">
                    <Shield className="text-accent-blue" size={32} />
                    <span>Shield Dashboard</span>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-blue)' }}>
                        <Activity size={20} />
                        <span>Station Status</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                        <Lock size={20} />
                        <span>PQ Signatures</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                        <Settings size={20} />
                        <span>Configuration</span>
                    </div>
                </nav>

                <div style={{ marginTop: 'auto', padding: '16px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                        <Lock size={12} className="text-success" color="#22c55e" />
                        <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 600 }}>LOCAL ONLY / ZERO TELEMETRY</span>
                    </div>
                    <div className="activity-meta">Current Network</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Wifi size={16} className="text-accent-teal" />
                        <span style={{ fontSize: '0.9rem' }}>{networkInfo.ssid}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: '4px' }}>
                        ◆ {networkInfo.status}
                    </div>
                </div>
            </div>

            {/* Main Status Area */}
            <div className="main-content">
                <div className="shield-container">
                    <motion.div
                        className="pulse-ring"
                        animate={{ scale: [0.8, 1.2], opacity: [0, 0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{ position: 'relative', zIndex: 10 }}
                    >
                        {isHardened ? (
                            <ShieldCheck size={180} color="#0ea5e9" style={{ filter: 'drop-shadow(0 0 20px rgba(14, 165, 233, 0.4))' }} />
                        ) : (
                            <ShieldAlert size={180} color="#ef4444" />
                        )}
                    </motion.div>
                </div>

                <div className="status-label">
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>{isHardened ? 'HARDENED' : 'RELAXED'}</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                        {isHardened ? 'All incoming connections are blocked. Hostname masked.' : 'System protections are relaxed for local services.'}
                    </p>

                    <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.05)', border: '1px solid rgba(14, 165, 233, 0.1)', textAlign: 'left', maxWidth: '500px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-blue)', fontWeight: 600 }}>
                            <Lock size={16} />
                            <span>Basic Local Security</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                            macshield hardens your Mac at the local network level. It changes your hostname, enables stealth mode, and disables NetBIOS. <strong>This does not replace a VPN</strong>, which encrypts your traffic.
                        </p>
                        <div style={{ marginTop: '12px', fontSize: '0.75rem', padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                            <strong>Recommended:</strong> Pair macshield with a reputable VPN (NordVPN, ProtonVPN, Mullvad) or the free Cloudflare WARP for full protection.
                        </div>
                    </div>

                    <button
                        className="btn"
                        style={{ marginTop: '24px', background: isHardened ? 'var(--danger)' : 'var(--success)', padding: '12px 32px' }}
                        onClick={() => setIsHardened(!isHardened)}
                    >
                        {isHardened ? 'RELAX PROTECTIONS' : 'HARDEN STATION'}
                    </button>
                </div>
            </div>

            {/* Real-time Activity Panel */}
            <div className="activity-panel glass-panel">
                <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={20} className="text-accent-blue" />
                    Real-time Activity
                </h2>
                <div className="activity-meta">Sanitized log stream from socketfilterfw</div>

                <div className="activity-feed">
                    <AnimatePresence initial={false}>
                        {events.slice(0, 10).map((event, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="activity-item"
                            >
                                <div className="activity-meta">{event.timestamp}</div>
                                <div style={{ wordBreak: 'break-word' }}>{event.event}</div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)' }}>
                    <button style={{ width: '100%', background: 'none', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <ExternalLink size={14} />
                        View Advanced Logs
                    </button>
                    <div style={{ marginTop: '12px', fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'center', opacity: 0.6 }}>
                        Use at your own risk. No liability assumed. All data strictly local.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
