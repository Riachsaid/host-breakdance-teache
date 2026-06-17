import type { UserLevel } from '../types';

interface Props {
  score: number;
  label: string;
  color?: string;
}

function ScoreRing({ score, label, color = 'stroke-neon-cyan' }: Props) {
  const r = 48;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="6" />
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="60" y="56" textAnchor="middle" fill="#1e293b" fontSize="22" fontFamily="Orbitron, sans-serif" fontWeight="bold">
          {score}
        </text>
        <text x="60" y="74" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="Rajdhani, sans-serif">
          {label}
        </text>
      </svg>
    </div>
  );
}

const levelColors: Record<UserLevel, string> = {
  beginner: 'stroke-neon-magenta',
  intermediate: 'stroke-yellow-500',
  advanced: 'stroke-neon-cyan',
  master: 'stroke-neon-green',
};

const levelLabels: Record<UserLevel, string> = {
  beginner: 'BEGINNER',
  intermediate: 'INTERMEDIATE',
  advanced: 'ADVANCED',
  master: 'MASTER',
};

interface ReportSummaryProps {
  overallScore: number;
  postureScore: number;
  flowScore: number;
  powerScore: number;
  level: UserLevel;
}

export default function ReportSummary({ overallScore, postureScore, flowScore, powerScore, level }: ReportSummaryProps) {
  return (
    <div className="neon-card p-6">
      <div className="flex items-center justify-center mb-4">
        <span className={`text-xs font-orbitron tracking-widest px-4 py-1.5 rounded-full border font-bold ${
          level === 'master' ? 'border-neon-green text-neon-green' :
          level === 'advanced' ? 'border-neon-cyan text-neon-cyan' :
          level === 'intermediate' ? 'border-yellow-500 text-yellow-500' :
          'border-neon-magenta text-neon-magenta'
        }`}>
          {levelLabels[level]}
        </span>
      </div>
      <div className="flex justify-center mb-6">
        <ScoreRing score={overallScore} label="OVERALL" color={levelColors[level]} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <ScoreRing score={postureScore} label="POSTURE" color="stroke-neon-cyan" />
        <ScoreRing score={flowScore} label="FLOW" color="stroke-neon-purple" />
        <ScoreRing score={powerScore} label="POWER" color="stroke-neon-magenta" />
      </div>
    </div>
  );
}
