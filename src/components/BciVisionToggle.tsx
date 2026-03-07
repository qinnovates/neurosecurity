import { useState, useRef, useCallback, useEffect } from 'react';

export default function BciVisionToggle() {
  const [isOn, setIsOn] = useState(false);
  const clickTimes = useRef<number[]>([]);
  const [showCtf, setShowCtf] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [ctfState, setCtfState] = useState<'prompt' | 'denied' | 'granted'>('prompt');

  useEffect(() => {
    const saved = localStorage.getItem('bci-vision') === 'on';
    setIsOn(saved);
  }, []);

  const toggle = useCallback(() => {
    const now = Date.now();
    clickTimes.current.push(now);
    // Keep only last 3 clicks
    if (clickTimes.current.length > 3) clickTimes.current.shift();

    // Easter egg: 3 clicks within 1 second
    if (clickTimes.current.length === 3) {
      const delta = clickTimes.current[2] - clickTimes.current[0];
      if (delta < 1000) {
        clickTimes.current = [];
        document.documentElement.classList.add('crt-flicker');
        setTimeout(() => {
          document.documentElement.classList.remove('crt-flicker');
          setShowCtf(true);
          setCtfState('prompt');
          setPassphrase('');
        }, 300);
        return;
      }
    }

    const next = !isOn;
    setIsOn(next);
    localStorage.setItem('bci-vision', next ? 'on' : 'off');
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    document.documentElement.setAttribute('data-vision', next ? 'on' : 'off');
  }, [isOn]);

  const handleCtfSubmit = useCallback(() => {
    if (passphrase.toLowerCase().trim() === 'kulhi loaches') {
      setCtfState('granted');
    } else {
      setCtfState('denied');
      setTimeout(() => setCtfState('prompt'), 1500);
    }
  }, [passphrase]);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full text-xs font-medium tracking-wide transition-all duration-300"
        style={{
          background: isOn
            ? 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))'
            : 'var(--color-glass-bg)',
          border: `1px solid ${isOn ? 'rgba(139,92,246,0.3)' : 'var(--color-glass-border)'}`,
          backdropFilter: 'blur(12px)',
          color: 'var(--color-text-primary)',
          boxShadow: isOn ? '0 0 20px rgba(139,92,246,0.15)' : '0 4px 12px rgba(0,0,0,0.08)',
        }}
        aria-label={isOn ? 'Switch to Academic mode' : 'Switch to BCI Vision mode'}
      >
        <span style={{ letterSpacing: '0.05em' }}>BCI Vision</span>
        <span
          className="relative inline-block w-8 h-[18px] rounded-full transition-colors duration-300"
          style={{
            background: isOn ? 'var(--color-accent-tertiary)' : 'var(--color-bg-elevated)',
          }}
        >
          <span
            className="absolute top-[2px] w-[14px] h-[14px] rounded-full transition-all duration-300"
            style={{
              left: isOn ? '16px' : '2px',
              background: isOn ? '#fff' : 'var(--color-text-faint)',
              boxShadow: isOn ? '0 0 6px rgba(139,92,246,0.4)' : 'none',
            }}
          />
        </span>
      </button>

      {/* CTF Easter Egg Modal */}
      {showCtf && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 crt-scanlines"
          style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCtf(false); }}
        >
          <div
            className="w-full max-w-lg rounded-xl p-8 font-mono text-sm leading-relaxed"
            style={{
              background: '#0a0a0a',
              border: '1px solid rgba(0,255,0,0.2)',
              color: '#00ff00',
              boxShadow: '0 0 40px rgba(0,255,0,0.05)',
            }}
          >
            <div style={{ opacity: 0.7 }}>
              {'>'} ONI FRAMEWORK v14.0 — ARCHIVED<br />
              {'>'} NEURAL SECURITY CLEARANCE REQUIRED
            </div>

            <div className="my-4 h-1 rounded-full overflow-hidden" style={{ background: '#111' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: '100%',
                  background: 'linear-gradient(90deg, #00ff00, #00aa00)',
                  animation: 'none',
                }}
              />
            </div>

            <p className="mb-4">WELCOME, OPERATOR.</p>
            <p className="mb-1" style={{ opacity: 0.8 }}>The 14-layer model was archived.</p>
            <p className="mb-1" style={{ opacity: 0.8 }}>But it left something behind.</p>
            <p className="mb-4" style={{ opacity: 0.8 }}>Find the signal in the noise.</p>

            <p className="mb-4" style={{ color: '#00aa00', opacity: 0.6 }}>
              HINT: The derivation log remembers what the framework forgot.
            </p>

            {ctfState === 'granted' ? (
              <div>
                <p className="mb-2">{'>'} SIGNAL ACQUIRED.</p>
                <p className="mb-2">{'>'} COHERENCE: 0.94</p>
                <p className="mb-4" style={{ color: '#ffcc00' }}>
                  {'>'} FLAG{'{'}oni_14_layers_remember{'}'}
                </p>
                <p className="mb-1" style={{ opacity: 0.7 }}>
                  The ONI Framework was the seed. QIF is what grew from it.
                </p>
                <p className="my-4" style={{ opacity: 0.6 }}>
                  Kevin said he&apos;d plug the piano back in at 100 likes.
                </p>
                <a
                  href="https://soundcloud.com/search?q=keviano%20kulhi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mb-4 underline"
                  style={{ color: '#00ccff' }}
                >
                  Kulhi Loaches — Keviano (SoundCloud)
                </a>
                <p style={{ opacity: 0.5, fontSize: '0.75rem' }}>
                  More flags are hidden in the research. Keep reading. Keep questioning.
                </p>
              </div>
            ) : (
              <div>
                <div
                  className="my-4 p-4 rounded-lg"
                  style={{ background: 'rgba(0,255,0,0.03)', border: '1px solid rgba(0,255,0,0.1)' }}
                >
                  <p style={{ opacity: 0.6, fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                    &ldquo;Don&apos;t ever give up no matter if it&apos;s on your music, dreams, or your PII.&rdquo;
                  </p>
                  <p style={{ opacity: 0.4, fontSize: '0.7rem' }}>— Derivation Log #8</p>
                </div>

                <div className="flex items-center gap-2">
                  <span style={{ opacity: 0.5 }}>{'>'} Enter passphrase:</span>
                  <input
                    type="text"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCtfSubmit(); }}
                    className="flex-1 bg-transparent border-b outline-none px-1 py-0.5"
                    style={{
                      borderColor: 'rgba(0,255,0,0.3)',
                      color: '#00ff00',
                      caretColor: '#00ff00',
                      fontFamily: 'var(--font-mono)',
                    }}
                    autoFocus
                  />
                </div>

                {ctfState === 'denied' && (
                  <p className="mt-3 animate-pulse" style={{ color: '#ff4444' }}>
                    {'>'} ACCESS DENIED. TRY AGAIN.
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => setShowCtf(false)}
              className="mt-6 text-xs opacity-40 hover:opacity-70 transition-opacity"
              style={{ color: '#00ff00' }}
            >
              [CLOSE]
            </button>
          </div>
        </div>
      )}
    </>
  );
}
