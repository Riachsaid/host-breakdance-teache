import { useState, useEffect, useCallback } from 'react';

export type PlaybackSpeed = 0.8 | 1.0 | 1.2;

const COACH_VOICE_PITCH = 0.9;
const SPEED_OPTIONS: PlaybackSpeed[] = [0.8, 1.0, 1.2];

function getPreferredVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const lang = 'en-US';
  return (
    voices.find(
      v =>
        v.lang.startsWith(lang) &&
        /female|samantha|google us|microsoft|zira/i.test(v.name)
    ) ??
    voices.find(
      v =>
        v.lang.startsWith('en') &&
        /male|david|mark|james|daniel|google uk/i.test(v.name)
    ) ??
    voices.find(v => v.lang.startsWith('en')) ??
    voices[0]
  );
}

function isSpeechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function useTts() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [voiceReady, setVoiceReady] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1.0);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    if (!isSpeechAvailable()) return;
    if (window.speechSynthesis.getVoices().length > 0) {
      setVoiceReady(true);
      return;
    }
    const handler = () => {
      setVoiceReady(true);
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler, { once: true });
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isSpeechAvailable()) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = playbackSpeed;
      utterance.pitch = COACH_VOICE_PITCH;
      utterance.volume = 1;

      if (voiceReady) {
        const preferred = getPreferredVoice();
        if (preferred) utterance.voice = preferred;
      }

      window.speechSynthesis.speak(utterance);
    },
    [voiceReady, playbackSpeed],
  );

  const stop = useCallback(() => {
    if (!isSpeechAvailable()) return;
    window.speechSynthesis.cancel();
  }, []);

  return { speak, stop, isOnline, voiceReady, playbackSpeed, setPlaybackSpeed, SPEED_OPTIONS } as const;
}
