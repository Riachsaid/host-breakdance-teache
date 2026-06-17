export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseFrame {
  landmarks: PoseLandmark[];
  timestamp: number;
}

export type UserLevel = 'beginner' | 'intermediate' | 'advanced' | 'master';

export interface FaultEntry {
  timestamp: number;
  second: number;
  issue: string;
  anatomy: string;
  solution: string;
}

export interface SessionReport {
  id: string;
  date: string;
  level: UserLevel;
  postureScore: number;
  flowScore: number;
  powerScore: number;
  overallScore: number;
  postureAnalysis: string;
  faults: FaultEntry[];
  feedbackTts: string;
  duration: number;
  sessionType: 'live' | 'upload';
}

export type SessionStatus = 'idle' | 'recording' | 'processing' | 'complete' | 'error';

export interface HistoryEntry extends SessionReport {
  thumbnail?: string;
}

export type CaptureMode = 'live' | 'upload';
