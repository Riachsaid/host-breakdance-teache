import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import {
  loadHistory,
  clearHistory,
  deleteReport,
  entryCount,
} from '../utils/historyStore';
import type { HistoryEntry, UserLevel } from '../types';

const LEVEL_META: Record<
  UserLevel,
  { label: string; border: string; text: string; bg: string }
> = {
  beginner: {
    label: 'BEG',
    border: 'border-neon-magenta/30',
    text: 'text-neon-magenta',
    bg: 'bg-neon-magenta/10',
  },
  intermediate: {
    label: 'INT',
    border: 'border-yellow-500/30',
    text: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  advanced: {
    label: 'ADV',
    border: 'border-neon-cyan/30',
    text: 'text-neon-cyan',
    bg: 'bg-neon-cyan/10',
  },
  master: {
    label: 'MST',
    border: 'border-neon-green/30',
    text: 'text-neon-green',
    bg: 'bg-neon-green/10',
  },
};

const LEVEL_ORDER: UserLevel[] = [
  'master',
  'advanced',
  'intermediate',
  'beginner',
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) {
    return `Today ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export default function History() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<HistoryEntry[]>(() => loadHistory());
  const [filter, setFilter] = useState<UserLevel | 'all'>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const stats = useMemo(() => {
    const total = entries.length;
    if (total === 0) return null;
    const avg = Math.round(
      entries.reduce((s, e) => s + e.overallScore, 0) / total,
    );
    const best = Math.max(...entries.map(e => e.overallScore));
    const bestEntry = entries.find(e => e.overallScore === best);
    return { total, avg, best, bestDate: bestEntry?.date ?? null };
  }, [entries]);

  const filtered = useMemo(() => {
    const sorted = [...entries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    if (filter === 'all') return sorted;
    return sorted.filter(e => e.level === filter);
  }, [entries, filter]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteReport(id)) {
      setEntries(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleClear = () => {
    if (confirmClear) {
      clearHistory();
      setEntries([]);
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-deep pt-14">
      <TopBar />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-orbitron font-bold glow-text tracking-wide">
              PROGRESSION VAULT
            </h1>
            {stats && (
              <p className="text-[10px] text-text-secondary font-rajdhani mt-0.5 tracking-wide">
                {stats.total} session{stats.total !== 1 ? 's' : ''}
                {' · '}Avg {stats.avg}
                {' · '}Best {stats.best}
              </p>
            )}
          </div>
          {entries.length > 0 && (
            <button
              onClick={handleClear}
              className={`text-[9px] font-orbitron tracking-wider px-2.5 py-1 rounded border transition-all duration-200 ${
                confirmClear
                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : 'text-text-secondary/50 border-white/10 hover:text-red-400 hover:border-red-400/30'
              }`}
            >
              {confirmClear ? 'CONFIRM?' : 'CLEAR ALL'}
            </button>
          )}
        </div>

        {/* Level Filter Chips */}
        {entries.length > 1 && (
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => setFilter('all')}
              className={`text-[9px] font-orbitron tracking-wider px-2.5 py-1 rounded-full border transition-all shrink-0 ${
                filter === 'all'
          ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30 shadow-[0_0_8px_rgba(37,99,235,0.1)]'
          : 'text-text-secondary/60 border-slate-200 hover:text-text-primary hover:border-slate-300'
              }`}
            >
              ALL {entries.length}
            </button>
            {LEVEL_ORDER.filter(l =>
              entries.some(e => e.level === l),
            ).map(level => {
              const meta = LEVEL_META[level];
              const count = entries.filter(e => e.level === level).length;
              return (
                <button
                  key={level}
                  onClick={() => setFilter(level)}
                  className={`text-[9px] font-orbitron tracking-wider px-2.5 py-1 rounded-full border transition-all shrink-0 ${
                    filter === level
                      ? `${meta.bg} ${meta.text} ${meta.border} shadow-[0_0_8px_rgba(37,99,235,0.1)]`
                      : 'text-text-secondary/60 border-slate-200 hover:text-text-primary hover:border-slate-300'
                  }`}
                >
                  {meta.label} {count}
                </button>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="neon-card p-12 text-center mt-4">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border border-neon-cyan/20 animate-pulse" />
              <div className="absolute inset-2 rounded-full border border-neon-magenta/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-6 h-6 text-neon-cyan/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>
            <div className="text-text-secondary font-orbitron text-xs tracking-wider">
              {entries.length === 0 ? 'NO SESSIONS YET' : 'NO MATCHES'}
            </div>
            <div className="text-[10px] text-text-secondary/50 font-rajdhani mt-1.5 max-w-xs mx-auto leading-relaxed">
              {entries.length === 0
                ? 'Complete a live or uploaded session to see your results here'
                : 'No entries match the selected level filter'}
            </div>
            <button
              onClick={() => navigate('/')}
              className="cyber-button text-[10px] px-4 py-2 mt-5"
            >
              {entries.length === 0 ? 'START SESSION' : 'BACK TO DASHBOARD'}
            </button>
          </div>
        )}

        {/* Scrollable Card List */}
        {filtered.length > 0 && (
          <div className="space-y-2.5 max-h-[65vh] overflow-y-auto pr-0.5">
            {filtered.map(entry => {
              const meta = LEVEL_META[entry.level];
              return (
                <button
                  key={entry.id}
                  onClick={() => navigate(`/report/${entry.id}`)}
                  className="neon-card p-3.5 w-full text-left hover:border-neon-cyan/25 transition-all duration-200 group relative overflow-hidden shadow-sm"
                >
                  <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-neon-cyan/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`text-[9px] font-orbitron px-2 py-0.5 rounded border shrink-0 ${meta.border} ${meta.text}`}
                      >
                        {meta.label}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-orbitron text-text-primary group-hover:text-neon-cyan transition-colors truncate">
                          Score: {entry.overallScore}/100
                        </div>
                        <div className="text-[9px] text-text-secondary/60 font-rajdhani mt-0.5">
                          {formatDate(entry.date)}
                          {' · '}
                          {Math.round(entry.duration)}s
                          {' · '}
                          {entry.sessionType === 'live' ? 'LIVE' : 'FILE'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-[8px] text-text-secondary/40 font-orbitron tracking-wider">
                          PWR
                        </div>
                        <div className="text-[10px] text-neon-magenta font-orbitron tabular-nums">
                          {entry.powerScore}
                        </div>
                      </div>
                      <svg
                        className="w-3 h-3 text-text-secondary/30 group-hover:text-neon-cyan/60 transition-colors"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-1.5">
                      <span className="text-[8px] font-orbitron text-neon-cyan/50 tabular-nums">
                        P{entry.postureScore}
                      </span>
                      <span className="text-[8px] text-text-secondary/20">|</span>
                      <span className="text-[8px] font-orbitron text-neon-purple/50 tabular-nums">
                        F{entry.flowScore}
                      </span>
                    </div>
                    <div className="flex-1" />
                    {entry.faults.length > 0 && (
                      <span className="text-[8px] text-neon-magenta/60 font-rajdhani">
                        {entry.faults.length} fix{entry.faults.length !== 1 ? 'es' : ''}
                      </span>
                    )}
                    <button
                      onClick={e => handleDelete(entry.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-500/10 rounded"
                      aria-label="Delete entry"
                    >
                      <svg
                        className="w-3 h-3 text-red-400/60"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-5 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-[9px] font-orbitron text-text-secondary/40 hover:text-neon-cyan/60 transition-colors tracking-wider"
          >
            &larr; BACK TO DASHBOARD
          </button>
        </div>
      </main>
    </div>
  );
}
