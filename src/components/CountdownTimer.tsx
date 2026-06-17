interface Props {
  seconds: number;
  max: number;
}

export default function CountdownTimer({ seconds, max }: Props) {
  const pct = (seconds / max) * 100;
  const color = seconds <= 5 ? 'stroke-red-500' : seconds <= 10 ? 'stroke-yellow-500' : 'stroke-neon-cyan';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="80" height="80" viewBox="0 0 80 80" className="transform -rotate-90">
        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4" />
        <circle
          cx="40" cy="40" r="34"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          className={`${color} transition-all duration-200`}
          strokeDasharray={`${2 * Math.PI * 34}`}
          strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
        />
      </svg>
      <span className={`text-2xl font-orbitron font-bold ${seconds <= 5 ? 'text-red-400 pulse-glow' : 'text-neon-cyan'}`}>
        {seconds}s
      </span>
      <span className="text-[10px] font-orbitron text-text-secondary uppercase tracking-widest">Recording</span>
    </div>
  );
}
