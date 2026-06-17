import { useRef, useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import CountdownTimer from '../components/CountdownTimer';
import NeuralScanOverlay from '../components/NeuralScanOverlay';
import { useVideoCapture } from '../hooks/useVideoCapture';
import { usePoseAnalyzer } from '../hooks/usePoseAnalyzer';
import { generateReport } from '../utils/reportGenerator';
import { saveReport, entryCount } from '../utils/historyStore';

const MAX_DURATION = 20;

export default function Dashboard() {
  const navigate = useNavigate();
  const capture = useVideoCapture();
  const pose = usePoseAnalyzer();
  const [showNeuralScan, setShowNeuralScan] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const videoElRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistoryCount(entryCount());
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      capture.handleUpload(file);
      e.target.value = '';
    },
    [capture.handleUpload],
  );

  const processRecording = useCallback(async () => {
    const url = capture.recordedUrl;
    const mode = capture.mode;
    if (!url || !mode) return;
    setShowNeuralScan(true);
    const video = videoElRef.current;
    if (!video) {
      setShowNeuralScan(false);
      return;
    }
    try {
      video.src = url;
      video.load();
      await new Promise<void>((resolve, reject) => {
        const onMeta = () => {
          video.removeEventListener('loadedmetadata', onMeta);
          video.removeEventListener('error', onError);
          resolve();
        };
        const onError = () => {
          video.removeEventListener('loadedmetadata', onMeta);
          video.removeEventListener('error', onError);
          reject(new Error('Video metadata load failed'));
        };
        video.addEventListener('loadedmetadata', onMeta);
        video.addEventListener('error', onError);
      });
      const frames = await pose.analyzeVideo(video);
      const duration =
        video.duration && isFinite(video.duration)
          ? video.duration
          : MAX_DURATION;
      const report = generateReport(frames, duration, mode);
      saveReport(report);
      setHistoryCount(c => c + 1);
      setShowNeuralScan(false);
      navigate(`/report/${report.id}`);
    } catch {
      setShowNeuralScan(false);
    }
  }, [capture.recordedUrl, capture.mode, pose, navigate]);

  const setVideoStream = useCallback((el: HTMLVideoElement | null) => {
    if (el && capture.stream) {
      el.srcObject = capture.stream;
    }
  }, [capture.stream]);

  const isRecording = capture.status === 'recording';
  const isProcessing = capture.status === 'processing' && !!capture.recordedUrl;
  const isIdle = capture.status === 'idle' && !capture.error && !capture.recordedUrl;
  const hasError = !!capture.error;

  return (
    <div className="min-h-screen bg-deep pt-14">
      {showNeuralScan && <NeuralScanOverlay />}

      <TopBar />

      <main className="max-w-xl mx-auto px-4 py-6 pb-20">
        {/* Hero */}
        <div className="text-center mb-8 pt-2">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green shadow-[0_0_6px_rgba(0,255,136,0.5)]" />
            <span className="text-[9px] font-orbitron text-neon-green/70 tracking-[3px]">
              NEURAL POSE ENGINE ACTIVE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-orbitron font-bold glow-text mb-2 tracking-wide">
            BREAKDANCE ANALYZER
          </h1>
          <p className="text-text-secondary font-rajdhani text-xs sm:text-sm tracking-wider max-w-md mx-auto leading-relaxed">
            AI-powered biomechanical analysis for breaking — capture, analyze, improve.
          </p>
          {historyCount > 0 && (
            <button
              onClick={() => navigate('/history')}
              className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-orbitron text-neon-cyan/60 hover:text-neon-cyan transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {historyCount} SESSION{historyCount !== 1 ? 'S' : ''} ON RECORD
            </button>
          )}
        </div>

        {/* Dual Entry Cards */}
        {isIdle && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
            <button
              onClick={capture.startLiveSession}
              className="neon-card p-6 sm:p-8 flex flex-col items-center gap-3 sm:gap-4 hover:border-neon-cyan/40 transition-all duration-300 cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-neon-cyan/10 flex items-center justify-center group-hover:bg-neon-cyan/20 group-hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all duration-300 relative">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-neon-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <div className="text-center relative">
                <div className="text-base sm:text-lg font-orbitron font-bold text-neon-cyan tracking-wide">
                  LIVE SESSION
                </div>
                <div className="text-[10px] sm:text-xs text-text-secondary font-rajdhani mt-1 tracking-wide">
                  {MAX_DURATION}-second camera capture
                </div>
              </div>
            </button>

            <label className="neon-card p-6 sm:p-8 flex flex-col items-center gap-3 sm:gap-4 hover:border-neon-magenta/40 transition-all duration-300 cursor-pointer group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-neon-magenta/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-neon-magenta/10 flex items-center justify-center group-hover:bg-neon-magenta/20 group-hover:shadow-[0_0_30px_rgba(255,0,230,0.15)] transition-all duration-300 relative">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-neon-magenta" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="text-center relative">
                <div className="text-base sm:text-lg font-orbitron font-bold text-neon-magenta tracking-wide">
                  UPLOAD VIDEO
                </div>
                <div className="text-[10px] sm:text-xs text-text-secondary font-rajdhani mt-1 tracking-wide">
                  From gallery &middot; max {MAX_DURATION}s
                </div>
              </div>
              <input
                type="file"
                accept="video/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
            </label>
          </div>
        )}

        {/* Recording View */}
        {isRecording && (
          <div className="neon-card p-3 sm:p-4 mb-6" ref={videoContainerRef}>
            <div className="relative rounded-lg overflow-hidden bg-black mb-4 aspect-[4/3] flex items-center justify-center">
              <video
                ref={setVideoStream}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                <span className="text-[10px] font-orbitron text-red-400 tracking-wider">REC</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <CountdownTimer seconds={capture.countdown} max={MAX_DURATION} />
              <button
                onClick={capture.reset}
                className="cyber-button-outline text-[10px] px-4 py-1.5"
              >
                CANCEL RECORDING
              </button>
            </div>
          </div>
        )}

        {/* Preview After Capture */}
        {isProcessing && (
          <div className="neon-card p-3 sm:p-4 mb-6">
            <div className="relative rounded-lg overflow-hidden bg-black mb-4 aspect-[4/3] flex items-center justify-center">
              <video
                ref={videoElRef}
                src={capture.recordedUrl!}
                className="absolute inset-0 w-full h-full object-contain"
                controls
                playsInline
              />
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="text-[10px] font-orbitron text-text-secondary tracking-wider">
                {Math.round(
                  (videoElRef.current?.duration ?? MAX_DURATION) * 10
                ) / 10}
                s &middot; READY FOR ANALYSIS
              </div>
              <div className="flex gap-3">
                <button
                  onClick={capture.reset}
                  className="cyber-button-outline text-[10px] px-3 py-1.5"
                >
                  RETRY
                </button>
                <button
                  onClick={processRecording}
                  disabled={pose.isAnalyzing}
                  className="cyber-button text-[10px] px-4 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pose.isAnalyzing ? 'ANALYZING...' : 'ANALYZE SESSION'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="neon-card p-4 border-red-500/30 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <div className="text-red-400 text-xs font-rajdhani leading-relaxed">
                  {capture.error}
                </div>
                <button
                  onClick={capture.reset}
                  className="mt-2 text-[9px] font-orbitron text-neon-cyan underline hover:text-neon-cyan/80 transition-colors"
                >
                  TRY AGAIN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden video for processing pipeline */}
        <video ref={videoElRef} className="hidden" playsInline muted />

        {/* Footer */}
        <div className="mt-8 sm:mt-12 text-center space-y-1">
          <p className="text-[9px] text-text-secondary/40 font-orbitron tracking-[2px]">
            GHOST BREAKDANCE TEACHER v1.0
          </p>
          <p className="text-[8px] text-text-secondary/20 font-rajdhani">
            All processing happens locally. No video data is uploaded.
          </p>
        </div>
      </main>
    </div>
  );
}
