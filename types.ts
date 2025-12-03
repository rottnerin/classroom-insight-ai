export interface QAPair {
  question: string;
  answer: string;
  timestamp: string;
  waitTimeSeconds: number;
  bloomTaxonomyLevel: string; // e.g., "Remembering", "Analyzing"
}

export interface TranscriptSegment {
  speaker: string; // 'Teacher' | 'Student'
  text: string;
  timestamp: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  // Breakdown by call type
  breakdown: {
    chunkAnalysis: { prompt: number; completion: number };
    feedbackGeneration: { prompt: number; completion: number };
  };
}

export interface LessonAnalysis {
  teacherTalkTimePercentage: number;
  studentTalkTimePercentage: number;
  silenceOrGroupWorkPercentage: number;
  averageWaitTimeSeconds: number;
  qaPairs: QAPair[];
  transcript: TranscriptSegment[];
  overallFeedback: string;
  tokenUsage?: TokenUsage;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  SEGMENTING = 'SEGMENTING', // FFmpeg splitting video
  UPLOADING = 'UPLOADING', // Uploading segments to Gemini
  ANALYZING = 'ANALYZING', // Gemini analyzing video
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export type AnalysisPhase = 'segmenting' | 'uploading' | 'processing' | 'analyzing' | 'combining' | 'feedback';

export interface AnalysisProgress {
  phase: AnalysisPhase;
  currentSegment: number;
  totalSegments: number;
  currentStep: string;
  percent?: number;
}

export interface AnalysisState {
  status: AnalysisStatus;
  data: LessonAnalysis | null;
  error: string | null;
  progress?: AnalysisProgress;
}