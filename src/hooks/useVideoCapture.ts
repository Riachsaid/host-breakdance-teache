import { useState, useRef, useCallback, useEffect } from 'react';
import type { CaptureMode, SessionStatus } from '../types';

const MAX_DURATION = 20;

function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return 'video/webm';
}

export function useVideoCapture() {
  const [mode, setMode] = useState<CaptureMode | null>(null);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [countdown, setCountdown] = useState(MAX_DURATION);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const metadataUrlRef = useRef<string | null>(null);
  const recordedUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recordedUrlRef.current) {
      URL.revokeObjectURL(recordedUrlRef.current);
      recordedUrlRef.current = null;
    }
    if (metadataUrlRef.current) {
      URL.revokeObjectURL(metadataUrlRef.current);
      metadataUrlRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cleanup();
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      try { mediaRecorder.current.stop(); } catch { /* ignore */ }
    }
    mediaRecorder.current = null;
    chunks.current = [];
    setMode(null);
    setStatus('idle');
    setCountdown(MAX_DURATION);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setError(null);
  }, [cleanup]);

  const startLiveSession = useCallback(async () => {
    reset();
    setMode('live');
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
      streamRef.current = s;
      setStatus('recording');
      setCountdown(MAX_DURATION);
      chunks.current = [];

      const mimeType = getSupportedMimeType();
      const mr = new MediaRecorder(s, { mimeType });
      mediaRecorder.current = mr;

      mr.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        recordedUrlRef.current = url;
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setStatus('processing');
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
      };

      mr.onerror = () => {
        setError('Recording failed');
        setStatus('error');
        cleanup();
      };

      mr.start(100);
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = Math.max(0, MAX_DURATION - elapsed);
        setCountdown(Math.ceil(remaining));
        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
            mediaRecorder.current.stop();
          }
        }
      }, 200);
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera permission denied'
          : err instanceof DOMException && err.name === 'NotFoundError'
            ? 'No camera found on this device'
            : 'Failed to access camera';
      setError(msg);
      setStatus('error');
    }
  }, [reset, cleanup]);

  const handleUpload = useCallback((file: File) => {
    reset();
    setMode('upload');
    setError(null);
    const video = document.createElement('video');
    video.preload = 'metadata';
    const tempUrl = URL.createObjectURL(file);
    metadataUrlRef.current = tempUrl;
    video.src = tempUrl;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(tempUrl);
      metadataUrlRef.current = null;
      if (video.duration > MAX_DURATION) {
        setError(
          `Video exceeds ${MAX_DURATION}s limit (${Math.round(video.duration)}s)`
        );
        setStatus('error');
        return;
      }
      const url = URL.createObjectURL(file);
      recordedUrlRef.current = url;
      setRecordedBlob(file);
      setRecordedUrl(url);
      setStatus('processing');
    };

    video.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      metadataUrlRef.current = null;
      setError('Could not read video file');
      setStatus('error');
    };
  }, [reset]);

  useEffect(() => {
    return () => {
      cleanup();
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        try { mediaRecorder.current.stop(); } catch { /* ignore */ }
      }
      if (recordedUrlRef.current) {
        URL.revokeObjectURL(recordedUrlRef.current);
      }
    };
  }, [cleanup]);

  return {
    mode,
    status,
    countdown,
    recordedBlob,
    recordedUrl,
    error,
    startLiveSession,
    handleUpload,
    reset,
    get stream(): MediaStream | null {
      return streamRef.current;
    },
  };
}
