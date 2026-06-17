import { useState } from 'react';
import type { FaultEntry, UserLevel } from '../types';

const LEVEL_COLORS: Record<UserLevel, string> = {
  beginner: 'text-neon-magenta border-neon-magenta/30',
  intermediate: 'text-yellow-500 border-yellow-500/30',
  advanced: 'text-neon-cyan border-neon-cyan/30',
  master: 'text-neon-green border-neon-green/30',
};

const LEVEL_LABELS: Record<UserLevel, string> = {
  beginner: 'BEGINNER',
  intermediate: 'INTERMEDIATE',
  advanced: 'ADVANCED',
  master: 'MASTER',
};

interface FaultsMatrixProps {
  faults: FaultEntry[];
  postureAnalysis: string;
  level: UserLevel;
  overallScore: number;
}

type TabId = 'analysis' | 'anatomy' | 'faults';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'analysis', label: 'POSTURE ANALYSIS', icon: 'M' },
  { id: 'anatomy', label: 'ANATOMY', icon: 'A' },
  { id: 'faults', label: 'FAULTS & SOLUTIONS', icon: 'F' },
];

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 py-2.5 text-[10px] font-orbitron tracking-widest rounded-md transition-all duration-300 ${
        active
          ? 'bg-neon-cyan/10 text-neon-cyan shadow-[0_0_12px_rgba(37,99,235,0.1)]'
          : 'text-text-secondary hover:text-text-primary hover:bg-slate-50'
      }`}
    >
      {active && (
        <span className="absolute inset-0 rounded-md border border-neon-cyan/20" />
      )}
      {label}
    </button>
  );
}

function TimestampCell({ second }: { second: number }) {
  const mins = Math.floor(second / 60);
  const secs = second % 60;
  return (
    <span className="inline-flex items-center gap-1 font-orbitron text-neon-cyan text-xs tabular-nums">
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {mins}:{String(secs).padStart(2, '0')}
    </span>
  );
}

function FaultRow({ fault, index }: { fault: FaultEntry; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`group border-b border-slate-100 transition-all duration-200 ${
        expanded ? 'bg-neon-magenta/[0.03]' : 'hover:bg-slate-50'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <span className="text-[10px] font-orbitron text-text-secondary/50 w-5 shrink-0">
          {String(index + 1).padStart(2, '0')}
        </span>
        <TimestampCell second={fault.second} />
        <span className="flex-1 text-text-primary font-rajdhani text-sm truncate">
          {fault.issue}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-text-secondary/40 transition-transform duration-200 ${
            expanded ? 'rotate-90' : ''
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      {expanded && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-[fadeIn_0.2s_ease]">
          <div className="neon-card p-3 !bg-surface">
            <div className="text-[9px] font-orbitron tracking-widest text-neon-magenta mb-1.5">
              ANATOMICAL CONSTRAINT
            </div>
            <div className="text-xs text-text-secondary font-rajdhani leading-relaxed">
              {fault.anatomy}
            </div>
          </div>
          <div className="neon-card p-3 !bg-surface">
            <div className="text-[9px] font-orbitron tracking-widest text-neon-green mb-1.5">
              ACTIONABLE SOLUTION
            </div>
            <div className="text-xs text-neon-green/80 font-rajdhani leading-relaxed">
              {fault.solution}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FaultsMatrix({
  faults,
  postureAnalysis,
  level,
  overallScore,
}: FaultsMatrixProps) {
  const [activeTab, setActiveTab] = useState<TabId>('faults');

  const levelColor = LEVEL_COLORS[level];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'analysis':
        return (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-orbitron px-2.5 py-1 rounded border ${levelColor}`}
                >
                  {LEVEL_LABELS[level]}
                </span>
                <span className="text-xs font-orbitron text-text-secondary">
                  SCORE {overallScore}/100
                </span>
              </div>
            </div>
            <div className="relative pl-4 border-l-2 border-neon-cyan/30">
              <div className="absolute top-0 left-[-3px] w-1.5 h-1.5 rounded-full bg-neon-cyan shadow-[0_0_6px_rgba(37,99,235,0.3)]" />
              <div className="text-text-primary font-rajdhani text-sm leading-[1.8] whitespace-pre-line">
                {postureAnalysis}
              </div>
            </div>
          </div>
        );

      case 'anatomy': {
        const uniqueAnatomy = [...new Set(faults.map(f => f.anatomy))];
        if (uniqueAnatomy.length === 0) {
          return (
            <div className="p-5 text-center">
              <div className="text-neon-green text-sm font-orbitron">NO CONSTRAINTS DETECTED</div>
              <div className="text-text-secondary text-xs font-rajdhani mt-1">
                Range of motion within optimal parameters
              </div>
            </div>
          );
        }
        return (
          <div className="p-5 space-y-3">
            <div className="text-[10px] font-orbitron tracking-widest text-neon-magenta mb-3">
              IDENTIFIED BIOMECHANICAL CONSTRAINTS — {uniqueAnatomy.length}
            </div>
            {uniqueAnatomy.map((anatomy, i) => {
              const relatedFaults = faults.filter(f => f.anatomy === anatomy);
              return (
                <div key={i} className="neon-card p-4 !bg-surface">
                  <div className="flex items-start gap-3">
                    <span className="text-[10px] font-orbitron text-neon-magenta mt-0.5 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="text-sm text-text-primary font-rajdhani mb-1.5">
                        {anatomy}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {relatedFaults.map((f, j) => (
                          <span
                            key={j}
                            className="text-[10px] font-orbitron text-neon-cyan/70 bg-neon-cyan/[0.06] px-2 py-0.5 rounded"
                          >
                            0:{String(f.second).padStart(2, '0')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'faults':
        return (
          <div>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
              <span className="text-[10px] font-orbitron tracking-widest text-neon-magenta">
                ISSUE MATRIX — {faults.length} FAULT{faults.length !== 1 ? 'S' : ''}
              </span>
              <span className="text-[9px] font-orbitron text-text-secondary/50">
                CLICK TO EXPAND
              </span>
            </div>
            {faults.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-3xl mb-2 opacity-20">&#10003;</div>
                <div className="text-neon-green text-base font-orbitron">CLEAN SESSION</div>
                <div className="text-text-secondary text-xs font-rajdhani mt-1">
                  No mechanical faults detected in this capture
                </div>
              </div>
            ) : (
              <div>
                {faults.map((f, i) => (
                  <FaultRow key={i} fault={f} index={i} />
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="neon-card overflow-hidden">
      <div className="flex gap-1 p-1.5 bg-slate-50 border-b border-slate-200">
        {TABS.map(tab => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            label={tab.label}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>
      <div className="min-h-[200px]">{renderTabContent()}</div>
    </div>
  );
}
