import { useRef, useEffect, useState } from 'react';
import type { PoseFrame } from '../types';

interface Props {
  videoUrl?: string;
  frames: PoseFrame[];
  autoPlay?: boolean;
}

const CONNECTIONS: [number, number][] = [
  [11, 12], [11, 23], [12, 24], [23, 24],
  [11, 13], [13, 15], [12, 14], [14, 16],
  [23, 25], [25, 27], [27, 29], [31, 29],
  [24, 26], [26, 28], [28, 30], [32, 30],
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
];

function drawSkeleton(ctx: CanvasRenderingContext2D, frame: PoseFrame, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 8;

  for (const [i, j] of CONNECTIONS) {
    const a = frame.landmarks[i];
    const b = frame.landmarks[j];
    if (a && b && a.visibility && a.visibility > 0.5 && b.visibility && b.visibility > 0.5) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  ctx.shadowBlur = 12;
  for (const lm of frame.landmarks) {
    if (lm.visibility && lm.visibility > 0.5) {
      ctx.beginPath();
      ctx.arc(lm.x, lm.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ff00e6';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lm.x, lm.y, 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 0, 230, 0.4)';
      ctx.stroke();
    }
  }

  ctx.shadowBlur = 0;
}

export default function PoseOverlay({ videoUrl, frames, autoPlay = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animRef = useRef<number>(0);
  const frameIdxRef = useRef(0);
  const lastTimeRef = useRef(0);
  const [dimensions, setDimensions] = useState({ w: 640, h: 480 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(width * dpr);
      const h = Math.round(height * dpr);
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = w;
        canvas.height = h;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
      setDimensions({ w, h });
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length === 0) return;
    const ctx = canvas.getContext('2d')!;

    if (videoUrl && videoRef.current) {
      const video = videoRef.current;
      let animId: number;

      const draw = () => {
        if (video.ended || video.paused) {
          animId = requestAnimationFrame(draw);
          return;
        }
        const idx = Math.min(
          Math.floor((video.currentTime / video.duration) * frames.length),
          frames.length - 1
        );
        const frame = frames[idx];
        if (frame) drawSkeleton(ctx, frame, dimensions.w, dimensions.h);
        animId = requestAnimationFrame(draw);
      };

      video.addEventListener('play', () => draw(), { once: true });
      return () => cancelAnimationFrame(animId);
    }

    if (autoPlay && frames.length > 0) {
      let paused = false;
      const fps = 30;
      const interval = 1000 / fps;
      const totalFrames = frames.length;

      const animate = (timestamp: number) => {
        if (paused) return;
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const delta = timestamp - lastTimeRef.current;
        if (delta >= interval) {
          lastTimeRef.current = timestamp;
          frameIdxRef.current = (frameIdxRef.current + 1) % totalFrames;
          drawSkeleton(ctx, frames[frameIdxRef.current], dimensions.w, dimensions.h);
        }
        animRef.current = requestAnimationFrame(animate);
      };

      drawSkeleton(ctx, frames[0], dimensions.w, dimensions.h);
      animRef.current = requestAnimationFrame(animate);
      return () => {
        paused = true;
        cancelAnimationFrame(animRef.current);
      };
    }

    if (frames.length > 0) {
      drawSkeleton(ctx, frames[0], dimensions.w, dimensions.h);
    }
  }, [frames, videoUrl, autoPlay, dimensions]);

  return (
    <div ref={containerRef} className="relative rounded-xl overflow-hidden border border-neon-cyan/20 shadow-sm bg-white">
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full max-h-[400px] object-contain"
          controls
          playsInline
        />
      )}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
}
