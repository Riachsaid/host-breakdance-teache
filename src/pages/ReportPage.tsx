import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import ReportSummary from '../components/ReportSummary';
import LevelBadge from '../components/LevelBadge';
import FaultsMatrix from '../components/FaultsMatrix';
import PoseOverlay from '../components/PoseOverlay';
import AudioSpeedControl from '../components/AudioSpeedControl';
import SubscriptionModal from '../components/SubscriptionModal';
import { useTts } from '../hooks/useTts';
import { loadHistory } from '../utils/historyStore';
import { isPremium } from '../utils/premiumStore';
import type { SessionReport, PoseFrame } from '../types';

function generateReplayFrames(report: SessionReport): PoseFrame[] {
  const count = 60;
  const frames: PoseFrame[] = [];
  const w = 640;
  const h = 480;
  const cx = w / 2;
  const cy = h / 2;
  const spread = 0.3 * Math.min(w, h);
  const intensity = report.powerScore / 100;

  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 4;
    const landmarks: PoseLandmark[] = [];
    for (let j = 0; j < 33; j++) {
      const angle = (j / 33) * Math.PI * 2 + t * 0.3 * intensity;
      const radius = spread * (0.7 + 0.3 * Math.sin(t + j * 0.5));
      const driftX = Math.sin(t * 0.7 + j * 0.2) * 40 * intensity;
      const driftY = Math.cos(t * 0.5 + j * 0.3) * 30 * intensity;
      landmarks.push({
        x: cx + radius * Math.cos(angle) + driftX,
        y: cy + radius * Math.sin(angle) * 0.7 + driftY,
        z: Math.sin(angle * 2 + t) * 60,
        visibility: 0.85 + Math.random() * 0.15,
      });
    }
    frames.push({ landmarks, timestamp: (i / count) * report.duration });
  }
  return frames;
}

interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { speak, stop, isOnline, voiceReady, playbackSpeed, setPlaybackSpeed, SPEED_OPTIONS } = useTts();
  const [report, setReport] = useState<SessionReport | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const speakingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const premium = isPremium();

  const replayFrames = useMemo(() => {
    if (!report) return [];
    return generateReplayFrames(report);
  }, [report]);

  useEffect(() => {
    const history = loadHistory();
    const found = history.find(r => r.id === id) ?? null;
    setReport(found);
  }, [id]);

  useEffect(() => {
    return () => {
      if (speakingTimer.current) clearInterval(speakingTimer.current);
    };
  }, []);

  const handleListen = () => {
    if (!report) return;
    if (isSpeaking) {
      stop();
      setIsSpeaking(false);
      if (speakingTimer.current) clearInterval(speakingTimer.current);
      return;
    }
    setIsSpeaking(true);
    speak(report.feedbackTts);
    speakingTimer.current = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(speakingTimer.current!);
        speakingTimer.current = null;
        setIsSpeaking(false);
      }
    }, 300);
  };

  if (!report) {
    return (
      <div className="min-h-screen bg-deep pt-14">
        <TopBar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-neon-magenta text-5xl mb-4 font-orbitron glow-text-magenta">
            404
          </div>
          <div className="text-text-secondary font-rajdhani text-sm mb-6">
            Report not found
          </div>
          <button onClick={() => navigate('/')} className="cyber-button text-sm">
            BACK TO DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep pt-14">
      <TopBar />

      <SubscriptionModal
        open={showSubscription}
        onClose={() => setShowSubscription(false)}
      />

      <main className="max-w-3xl mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-orbitron font-bold glow-text tracking-wide">
              SESSION REPORT
            </h1>
            <p className="text-[11px] text-text-secondary font-rajdhani mt-1 tracking-wide">
              {new Date(report.date).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {'  ·  '}
              {report.sessionType === 'live' ? 'LIVE' : 'UPLOAD'}
              {'  ·  '}
              {Math.round(report.duration)}s
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="cyber-button-outline text-[10px] px-3 py-1.5"
          >
            NEW
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span
              className={`w-2 h-2 rounded-full ${
                voiceReady
                  ? 'bg-neon-green shadow-[0_0_6px_rgba(0,255,136,0.5)]'
                  : 'bg-yellow-500'
              }`}
            />
            <span className="text-[9px] font-orbitron text-text-secondary tracking-wider">
              {voiceReady
                ? isOnline
                  ? 'TTS ENGINE: ACTIVE'
                  : 'TTS ENGINE: FALLBACK'
                : 'TTS ENGINE: LOADING'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!premium && (
              <button
                onClick={() => setShowSubscription(true)}
                className="text-[8px] font-orbitron text-neon-magenta/70 hover:text-neon-magenta transition-colors border border-neon-magenta/20 hover:border-neon-magenta/40 px-2 py-0.5 rounded"
              >
                UNLOCK PREMIUM
              </button>
            )}
            <span className="text-[9px] font-orbitron text-text-secondary/50 tracking-wider">
              ID: {report.id.slice(0, 8)}
            </span>
          </div>
        </div>

        {/* Skeleton Replay Overlay */}
        {replayFrames.length > 0 && (
          <div className="mb-5">
            <PoseOverlay frames={replayFrames} autoPlay />
          </div>
        )}

        {/* Level Badge + Scores — visible to all as preview */}
        <div className="space-y-4 mb-6">
          <LevelBadge
            userLevel={report.level}
            score={report.overallScore}
            onListen={handleListen}
            isPlaying={isSpeaking}
          />
          <ReportSummary
            overallScore={report.overallScore}
            postureScore={report.postureScore}
            flowScore={report.flowScore}
            powerScore={report.powerScore}
            level={report.level}
          />
        </div>

        {/* Audio Speed Controls */}
        <div className="flex items-center justify-end mb-4">
          <AudioSpeedControl
            speeds={SPEED_OPTIONS}
            current={playbackSpeed}
            onChange={setPlaybackSpeed}
            disabled={isSpeaking}
          />
        </div>

        {/* Paywall Gate — full analysis behind premium */}
        {!premium ? (
          <div className="relative">
            <div className="neon-card p-6 !bg-surface/20 backdrop-blur-[2px] select-none">
              <FaultsMatrix
                faults={report.faults.slice(0, 2)}
                postureAnalysis={
                  'Premium feature. Upgrade to Ghost Premium to view your complete biomechanical analysis, anatomical constraints, and full faults & solutions matrix.'
                }
                level={report.level}
                overallScore={report.overallScore}
              />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-xl z-10">
              <div className="neon-card p-6 text-center max-w-sm mx-4 border-neon-magenta/30 shadow-lg">
                <div className="w-12 h-12 rounded-full bg-neon-magenta/10 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-neon-magenta" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <div className="text-sm font-orbitron text-neon-magenta glow-text-magenta tracking-wide mb-1">
                  PREMIUM ANALYSIS LOCKED
                </div>
                <div className="text-[10px] text-text-secondary font-rajdhani leading-relaxed mb-4">
                  Upgrade to Ghost Premium to unlock your full posture analysis,
                  anatomical constraints, and complete faults & solutions matrix with
                  timestamped coaching corrections.
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowSubscription(true)}
                    className="cyber-button w-full text-[10px] py-2.5"
                  >
                    UNLOCK NOW — FROM $9.90
                  </button>
                  <div className="text-[8px] text-text-secondary/40 font-rajdhani">
                    Includes TTS coaching, progression vault, and all future features
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <FaultsMatrix
            faults={report.faults}
            postureAnalysis={report.postureAnalysis}
            level={report.level}
            overallScore={report.overallScore}
          />
        )}
      </main>
    </div>
  );
}
