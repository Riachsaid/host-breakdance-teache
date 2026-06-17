import { useState, useCallback } from 'react';
import type { PoseFrame } from '../types';

export function usePoseAnalyzer() {
  const [frames, setFrames] = useState<PoseFrame[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeVideo = useCallback(async (videoEl: HTMLVideoElement): Promise<PoseFrame[]> => {
    setIsAnalyzing(true);
    const extracted: PoseFrame[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = videoEl.videoWidth || 640;
    canvas.height = videoEl.videoHeight || 480;

    return new Promise((resolve) => {
      videoEl.currentTime = 0;
      const fps = 15;
      const interval = 1000 / fps;
      let lastTime = -interval;

      const sampleFrame = () => {
        if (videoEl.ended || videoEl.currentTime >= videoEl.duration) {
          setIsAnalyzing(false);
          setFrames(extracted);
          resolve(extracted);
          return;
        }
        if (videoEl.currentTime - lastTime >= interval / 1000) {
          lastTime = videoEl.currentTime;
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const landmarks = dummyPoseEstimate(imageData, canvas.width, canvas.height);
          extracted.push({ landmarks, timestamp: videoEl.currentTime });
        }
        requestAnimationFrame(sampleFrame);
      };
      videoEl.play().then(sampleFrame).catch(() => {
        setIsAnalyzing(false);
        resolve(extracted);
      });
    });
  }, []);

  return { frames, isAnalyzing, analyzeVideo };
}

function dummyPoseEstimate(
  _imageData: ImageData,
  width: number,
  height: number
): { x: number; y: number; z: number; visibility?: number }[] {
  const landmarks: { x: number; y: number; z: number; visibility?: number }[] = [];
  for (let i = 0; i < 33; i++) {
    const angle = (i / 33) * Math.PI * 2;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;
    landmarks.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      z: Math.sin(angle * 3) * 50,
      visibility: 0.9 + Math.random() * 0.1,
    });
  }
  return landmarks;
}
