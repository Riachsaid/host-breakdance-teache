import type { PlaybackSpeed } from '../hooks/useTts';

interface Props {
  speeds: PlaybackSpeed[];
  current: PlaybackSpeed;
  onChange: (speed: PlaybackSpeed) => void;
  disabled?: boolean;
}

export default function AudioSpeedControl({ speeds, current, onChange, disabled }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[8px] font-orbitron tracking-wider text-text-secondary/60 uppercase">
        Speed
      </span>
      <div className="flex gap-0.5">
        {speeds.map(s => {
          const active = s === current;
          return (
            <button
              key={s}
              onClick={() => onChange(s)}
              disabled={disabled}
              className={`text-[10px] font-orbitron tracking-wider px-2 py-0.5 rounded border transition-all duration-150 ${
                active
                  ? 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30 shadow-[0_0_6px_rgba(0,240,255,0.1)]'
                  : 'text-text-secondary/40 border-white/5 hover:text-text-secondary hover:border-white/15'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {s}x
            </button>
          );
        })}
      </div>
    </div>
  );
}
