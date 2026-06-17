export default function NeuralScanOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xl">
      <div className="relative w-48 h-48 mb-8">
        <div className="absolute inset-0 rounded-full border-2 border-neon-cyan/30 animate-ping" />
        <div className="absolute inset-4 rounded-full border-2 border-neon-magenta/40 animate-pulse" />
        <div className="absolute inset-8 rounded-full border border-neon-cyan/50" style={{ animation: 'spin3d 3s linear infinite' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-16 h-16 text-neon-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2a4 4 0 014 4c0 2-2 4-4 4s-4-2-4-4 1.79-4 4-4z" />
            <path d="M4 22c0-4.42 3.58-8 8-8s8 3.58 8 8" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 15v7" />
            <path d="M9 12l-3 3" />
            <path d="M15 12l3 3" />
          </svg>
        </div>
        <div className="scan-line" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-orbitron font-bold glow-text mb-2">NEURAL SCANNING</h2>
        <p className="text-sm text-text-secondary font-rajdhani tracking-wider">
          Processing biomechanical data...
        </p>
        <div className="mt-6 flex gap-1.5">
          {[0,1,2,3,4].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-neon-cyan"
              style={{ animation: `pulseGlow ${0.4 + i * 0.15}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
