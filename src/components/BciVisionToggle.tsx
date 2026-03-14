import { useState, useRef, useCallback, useEffect } from 'react';

export default function BciVisionToggle() {
  const [isOn, setIsOn] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bci-vision') === 'on';
    }
    return false;
  });
  const clickTimes = useRef<number[]>([]);
  const [showCtf, setShowCtf] = useState(false);
  const [ctfSource, setCtfSource] = useState<'click' | 'search' | 'music'>('click');
  const [passphrase, setPassphrase] = useState('');
  const [ctfState, setCtfState] = useState<'prompt' | 'denied' | 'granted'>('prompt');
  const pendingNav = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with localStorage on mount (covers SSR hydration mismatch)
  useEffect(() => {
    const saved = localStorage.getItem('bci-vision') === 'on';
    setIsOn(saved);
  }, []);

  // Listen for ONI/music search trigger from Nav search bar
  useEffect(() => {
    const handler = (e: Event) => {
      const term = (e as CustomEvent<string>).detail || '';
      const isMusicSearch = ['kulhi', 'kulhi loach', 'kulhi loaches', 'keviano'].includes(term);
      setCtfSource(isMusicSearch ? 'music' : 'search');
      setShowCtf(true);
      setCtfState('prompt');
      setPassphrase('');
    };
    window.addEventListener('oni-trigger', handler);
    return () => window.removeEventListener('oni-trigger', handler);
  }, []);

  const toggle = useCallback(() => {
    const now = Date.now();
    clickTimes.current.push(now);
    if (clickTimes.current.length > 5) clickTimes.current.shift();

    // Easter egg: 5 clicks within 2.5 seconds
    if (clickTimes.current.length >= 5) {
      const delta = clickTimes.current[clickTimes.current.length - 1] - clickTimes.current[0];
      if (delta < 2500) {
        clickTimes.current = [];
        if (pendingNav.current) {
          clearTimeout(pendingNav.current);
          pendingNav.current = null;
        }
        document.documentElement.classList.add('crt-flicker');
        setTimeout(() => {
          document.documentElement.classList.remove('crt-flicker');
          setCtfSource('click');
          setShowCtf(true);
          setCtfState('prompt');
          setPassphrase('');
        }, 300);
        return;
      }
    }

    // Read current state directly from localStorage to avoid stale closures
    const current = localStorage.getItem('bci-vision') === 'on';
    const next = !current;

    setIsOn(next);
    localStorage.setItem('bci-vision', next ? 'on' : 'off');
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    document.documentElement.setAttribute('data-vision', next ? 'on' : 'off');

    // Delay navigation to allow triple-click detection
    if (pendingNav.current) clearTimeout(pendingNav.current);
    pendingNav.current = setTimeout(() => {
      const path = window.location.pathname;
      if (next && (path === '/' || path === '/index.html')) {
        window.location.href = '/vision/';
      } else if (!next && path.startsWith('/vision')) {
        window.location.href = '/';
      }
      pendingNav.current = null;
    }, 600);
  }, []);

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
            <div style={{ opacity: 0.8 }}>
              {'>'} ONI FRAMEWORK v14.0 — ARCHIVED
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

            {ctfSource === 'click' ? (
              <>
                <p className="mb-4" style={{ opacity: 0.9 }}>
                  Nice. This is how security engineers start thinking. We click things to see if they break. We poke at edges. We test assumptions.
                </p>
                <p className="mb-1" style={{ opacity: 0.8 }}>You just did exactly that. Keep going.</p>
                <p className="mb-1" style={{ opacity: 0.8 }}>QIF started as something called ONI — 14 layers, way too ambitious.</p>
                <p className="mb-4" style={{ opacity: 0.8 }}>It was archived. But it left a trail.</p>
              </>
            ) : ctfSource === 'music' ? (
              <>
                <p className="mb-4" style={{ opacity: 0.9 }}>
                  You came back for the music. That means something.
                </p>
                <p className="mb-4" style={{ opacity: 0.8 }}>
                  Before all of this — before QIF, before TARA, before the hourglass — there was just a kid at a piano trying to make something beautiful. That never stopped. It just found new instruments.
                </p>
                <div
                  className="my-4 p-4 rounded-lg"
                  style={{ background: 'rgba(0,255,0,0.03)', border: '1px solid rgba(0,255,0,0.1)' }}
                >
                  <p style={{ opacity: 0.7, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    &ldquo;Don&apos;t ever give up no matter if it&apos;s on your music, dreams, or your PII.&rdquo;
                  </p>
                  <p style={{ opacity: 0.4, fontSize: '0.75rem' }}>— Derivation Log #8</p>
                </div>
                <p className="mb-1" style={{ opacity: 0.8 }}>The security framework is one instrument.</p>
                <p className="mb-1" style={{ opacity: 0.8 }}>The piano is another.</p>
                <p className="mb-4" style={{ opacity: 0.8 }}>Same person. Same curiosity. Different keys.</p>
              </>
            ) : (
              <>
                <p className="mb-4" style={{ opacity: 0.9 }}>
                  You searched for it. That means you read the research. That means you care.
                </p>
                <div
                  className="my-4 p-4 rounded-lg"
                  style={{ background: 'rgba(0,255,0,0.03)', border: '1px solid rgba(0,255,0,0.1)' }}
                >
                  <p style={{ opacity: 0.7, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    &ldquo;Don&apos;t ever give up no matter if it&apos;s on your music, dreams, or your PII.&rdquo;
                  </p>
                  <p style={{ opacity: 0.4, fontSize: '0.75rem' }}>— Derivation Log #8</p>
                </div>
                <p className="mb-1" style={{ opacity: 0.8 }}>ONI was the dream. 14 layers. One person. No funding. No team.</p>
                <p className="mb-1" style={{ opacity: 0.8 }}>It was too big. But the dream didn&apos;t die — it just got honest.</p>
                <p className="mb-4" style={{ opacity: 0.8 }}>QIF is what happens when you don&apos;t give up but you do get real.</p>
              </>
            )}

            <p className="mb-4" style={{ color: '#00aa00', opacity: 0.7 }}>
              The derivation log remembers what the framework forgot.
            </p>

            {ctfState === 'granted' ? (
              <div>
                <p className="mb-2" style={{ color: '#ffcc00' }}>{'>'} You got it. Welcome in.</p>
                <p className="mb-4" style={{ color: '#ffcc00' }}>
                  {'>'} FLAG{'{'}oni_14_layers_remember{'}'}
                </p>
                <p className="mb-2" style={{ opacity: 0.8 }}>
                  The ONI Framework was the original idea — 14 layers, built from scratch by one person asking &ldquo;what if we treated the brain like a network?&rdquo;
                </p>
                <p className="mb-2" style={{ opacity: 0.8 }}>
                  It was too big. So it became QIF. Simpler. Honest about what it knows and doesn&apos;t know.
                </p>
                <p className="mb-4" style={{ opacity: 0.8 }}>
                  But the curiosity that built ONI is the same curiosity that brought you here. That&apos;s what matters.
                </p>
                <p className="my-4" style={{ opacity: 0.7 }}>
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
                <p style={{ opacity: 0.6, fontSize: '0.75rem' }}>
                  More flags are hidden in the research. Keep reading. Keep questioning. That&apos;s the whole game.
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
                  <p className="mt-3" style={{ color: '#ff8844' }}>
                    {'>'} Not quite — but you&apos;re close. The answer is in the research.
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => setShowCtf(false)}
              className="mt-6 text-xs hover:opacity-100 transition-opacity"
              style={{ color: '#00ff00', opacity: 0.6 }}
            >
              [ESC or click to close]
            </button>
          </div>
        </div>
      )}
    </>
  );
}
