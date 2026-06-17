import type { UserLevel } from '../types';

interface Props {
  userLevel: UserLevel;
  score: number;
  onListen: () => void;
  isPlaying: boolean;
}

const levelColors: Record<UserLevel, string> = {
  beginner: 'border-neon-magenta text-neon-magenta',
  intermediate: 'border-yellow-500 text-yellow-500',
  advanced: 'border-neon-cyan text-neon-cyan',
  master: 'border-neon-green text-neon-green',
};

export default function LevelBadge({ userLevel, score, onListen, isPlaying }: Props) {
  const c = levelColors[userLevel];
  return (
    <div className={`neon-card p-4 flex items-center justify-between ${c.split(' ')[0]}`}>
      <div>
        <div className="text-xs text-text-secondary font-orbitron tracking-wider">USER STATUS</div>
        <div className={`text-lg font-orbitron font-bold mt-0.5 ${c.split(' ')[1]}`}>
          {userLevel.toUpperCase()}
        </div>
        <div className="text-xs text-text-secondary font-rajdhani">
          Score: {score}/100
        </div>
      </div>
      <button
        onClick={onListen}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-cyan/[0.06] border border-neon-cyan/30 hover:bg-neon-cyan/10 transition-all text-neon-cyan text-sm font-orbitron"
      >
        <svg className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} viewBox="0 0 24 24" fill="currentColor">
          {isPlaying ? (
            <rect x="6" y="4" width="4" height="16" rx="1" />
          ) : (
            <path d="M8 5v14l11-7z" />
          )}
        </svg>
        {isPlaying ? 'PLAYING' : 'LISTEN'}
      </button>
    </div>
  );
}
