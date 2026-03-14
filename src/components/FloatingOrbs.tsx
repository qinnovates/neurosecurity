/**
 * FloatingOrbs — Fixed background for BCI Vision dark mode.
 * Pure black with faint purple/blue orbs drifting slowly.
 * Orbs shift between blue and magenta via hue-rotate in keyframes.
 * Fixed position: page content scrolls over it, background stays still.
 */
export default function FloatingOrbs() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{ background: '#000000' }}
      aria-hidden="true"
    >
      {/* Purple→blue flare — upper right */}
      <div
        style={{
          position: 'absolute',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0.06) 35%, transparent 65%)',
          top: '5%',
          right: '-5%',
          animation: 'orbDrift1 40s ease-in-out infinite',
        }}
      />

      {/* Blue→magenta flare — center left */}
      <div
        style={{
          position: 'absolute',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, rgba(59,130,246,0.04) 35%, transparent 65%)',
          top: '40%',
          left: '-5%',
          animation: 'orbDrift2 50s ease-in-out infinite',
        }}
      />

      {/* Deep purple→blue — lower center */}
      <div
        style={{
          position: 'absolute',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(88,28,135,0.04) 35%, transparent 60%)',
          bottom: '-5%',
          left: '25%',
          animation: 'orbDrift4 45s ease-in-out infinite',
        }}
      />

      {/* Blue→purple whisper — upper left */}
      <div
        style={{
          position: 'absolute',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, rgba(59,130,246,0.03) 40%, transparent 65%)',
          top: '-3%',
          left: '15%',
          animation: 'orbDrift5 55s ease-in-out infinite',
        }}
      />

      {/* Cyan accent — lower right */}
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, rgba(6,182,212,0.02) 40%, transparent 65%)',
          bottom: '15%',
          right: '10%',
          animation: 'orbDrift2 60s ease-in-out infinite reverse',
        }}
      />

      {/* Keyframes in global.css — drift + hue-rotate for blue↔magenta shift */}
    </div>
  );
}
