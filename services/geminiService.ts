import { GoogleGenAI, Type, createPartFromUri, createUserContent } from "@google/genai";
import { LessonAnalysis, QAPair, TranscriptSegment, TokenUsage } from '../types';
import { GEMINI_MODEL, SYSTEM_INSTRUCTION } from '../constants';
import { segmentVideo, VideoSegment, SegmentationProgressCallback } from './videoSegmenter';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Chunk duration in minutes for segmented analysis
const CHUNK_DURATION_MINUTES = 5;

/**
 * Token usage tracker for accumulating usage across multiple API calls
 */
class TokenTracker {
  private chunkAnalysis = { prompt: 0, completion: 0 };
  private feedbackGeneration = { prompt: 0, completion: 0 };

  addChunkAnalysis(prompt: number, completion: number) {
    this.chunkAnalysis.prompt += prompt;
    this.chunkAnalysis.completion += completion;
  }

  addFeedbackGeneration(prompt: number, completion: number) {
    this.feedbackGeneration.prompt += prompt;
    this.feedbackGeneration.completion += completion;
  }

  getUsage(): TokenUsage {
    const promptTokens = 
      this.chunkAnalysis.prompt + 
      this.feedbackGeneration.prompt;
    
    const completionTokens = 
      this.chunkAnalysis.completion + 
      this.feedbackGeneration.completion;

    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      breakdown: {
        chunkAnalysis: { ...this.chunkAnalysis },
        feedbackGeneration: { ...this.feedbackGeneration },
      }
    };
  }
}

/**
 * Uploads a file to Gemini using a manual Multipart request to bypass
 * browser CORS issues with the SDK's resumable upload and size limits of Base64.
 */
const uploadFileToGemini = async (file: File): Promise<string> => {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    throw new Error("API_KEY is missing. Please ensure it is set in your environment variables.");
  }

  // Enforce a safe limit for browser-based multipart uploads (200MB)
  if (file.size > 200 * 1024 * 1024) {
    throw new Error("File size exceeds the 200MB limit for this browser-based demo. Please use a smaller file.");
  }

  const boundary = '-------314159265358979323846';

  // Metadata part: specific JSON structure for the Gemini Files API
  const metadata = {
    file: {
      display_name: file.name,
    }
  };

  // Read file as binary
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const metadataStr = JSON.stringify(metadata);

  // CRITICAL FIX: Ensure valid Content-Type even if file.type is empty
  const mimeType = file.type || 'application/octet-stream';

  const metadataHeader = `Content-Type: application/json\r\n\r\n`;
  const fileHeader = `Content-Type: ${mimeType}\r\n\r\n`;

  // Construct the Multipart body manually
  const part1Pre = `--${boundary}\r\n${metadataHeader}${metadataStr}\r\n`;
  const part2Pre = `--${boundary}\r\n${fileHeader}`;
  const part2Post = `\r\n--${boundary}--`;

  const textEncoder = new TextEncoder();
  const part1 = textEncoder.encode(part1Pre);
  const part2Head = textEncoder.encode(part2Pre);
  const part2Tail = textEncoder.encode(part2Post);

  // Combine all parts into a single Uint8Array
  const totalLength = part1.length + part2Head.length + bytes.length + part2Tail.length;
  const body = new Uint8Array(totalLength);

  let offset = 0;
  body.set(part1, offset); offset += part1.length;
  body.set(part2Head, offset); offset += part2Head.length;
  body.set(bytes, offset); offset += bytes.length;
  body.set(part2Tail, offset);

  // Perform the upload
  const response = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'multipart',
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  const uri = result.file?.uri || result.uri;
  if (!uri) {
    throw new Error("Upload successful but no URI returned.");
  }
  return uri;
};

/**
 * Polls the Gemini API to check if the file is ready for analysis.
 */
const getFileStatus = async (fileUri: string): Promise<string> => {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) throw new Error("API Key missing during status check.");

  const response = await fetch(`${fileUri}?key=${API_KEY}`);
  if (!response.ok) {
    throw new Error("Failed to check file status");
  }
  const result = await response.json();
  return result.state; // Returns 'PROCESSING', 'ACTIVE', or 'FAILED'
};

/**
 * Formats seconds to MM:SS timestamp
 */
const formatTimestamp = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Parses a timestamp string (MM:SS or HH:MM:SS) to seconds
 */
const parseTimestamp = (timestamp: string): number => {
  const parts = timestamp.split(':').map(p => parseInt(p, 10) || 0);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
};

/**
 * Adjusts a timestamp by adding an offset (for segment-based analysis)
 */
const adjustTimestamp = (timestamp: string, offsetSeconds: number): string => {
  const originalSeconds = parseTimestamp(timestamp);
  return formatTimestamp(originalSeconds + offsetSeconds);
};

/**
 * Normalizes text for comparison (lowercase, trim, remove extra whitespace)
 */
const normalizeText = (text: string): string => {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
};

/**
 * Calculates text similarity (simple approach: check if one contains most of the other)
 */
const areTextsSimilar = (text1: string, text2: string): boolean => {
  const norm1 = normalizeText(text1);
  const norm2 = normalizeText(text2);
  
  // Exact match after normalization
  if (norm1 === norm2) return true;
  
  // Check if one is a substring of the other (for slight variations)
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // Check word overlap (if 80%+ words match, consider similar)
  const words1 = new Set(norm1.split(' '));
  const words2 = new Set(norm2.split(' '));
  const intersection = [...words1].filter(w => words2.has(w));
  const similarity = intersection.length / Math.max(words1.size, words2.size);
  
  return similarity >= 0.8;
};

/**
 * Deduplicates transcript segments
 */
const deduplicateTranscript = (transcript: TranscriptSegment[]): TranscriptSegment[] => {
  const result: TranscriptSegment[] = [];
  
  for (const segment of transcript) {
    const isDuplicate = result.some(existing => {
      // Same speaker
      if (existing.speaker !== segment.speaker) return false;
      
      // Similar timestamp (within 10 seconds)
      const timeDiff = Math.abs(parseTimestamp(existing.timestamp) - parseTimestamp(segment.timestamp));
      if (timeDiff > 10) return false;
      
      // Similar text
      return areTextsSimilar(existing.text, segment.text);
    });
    
    if (!isDuplicate) {
      result.push(segment);
    }
  }
  
  return result;
};

/**
 * Deduplicates Q&A pairs
 */
const deduplicateQaPairs = (qaPairs: QAPair[]): QAPair[] => {
  const result: QAPair[] = [];
  
  for (const qa of qaPairs) {
    const isDuplicate = result.some(existing => {
      // Similar timestamp (within 15 seconds)
      const timeDiff = Math.abs(parseTimestamp(existing.timestamp) - parseTimestamp(qa.timestamp));
      if (timeDiff > 15) return false;
      
      // Similar question
      return areTextsSimilar(existing.question, qa.question);
    });
    
    if (!isDuplicate) {
      result.push(qa);
    }
  }
  
  return result;
};

/**
 * Schema for segment analysis
 */
const getSegmentSchema = () => ({
  type: Type.OBJECT,
  properties: {
    teacherTalkSeconds: { type: Type.NUMBER, description: "Total seconds the teacher is speaking in this video segment." },
    studentTalkSeconds: { type: Type.NUMBER, description: "Total seconds students are speaking in this video segment." },
    silenceSeconds: { type: Type.NUMBER, description: "Total seconds of silence or group work in this video segment." },
    qaPairs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "The specific question asked by the teacher." },
          answer: { type: Type.STRING, description: "The student's response (or 'No response')." },
          timestamp: { type: Type.STRING, description: "Time in this segment where this interaction occurred (e.g., '02:15')." },
          waitTimeSeconds: { type: Type.NUMBER, description: "Seconds of silence between question and answer." },
          bloomTaxonomyLevel: { type: Type.STRING, description: "Level of Bloom's Taxonomy for the question." }
        },
        required: ["question", "answer", "timestamp", "waitTimeSeconds", "bloomTaxonomyLevel"]
      }
    },
    transcript: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          speaker: { type: Type.STRING, description: "Who is speaking: 'Teacher' or 'Student'." },
          text: { type: Type.STRING, description: "The spoken content." },
          timestamp: { type: Type.STRING, description: "Time of speech in this segment (e.g., '02:15')." }
        },
        required: ["speaker", "text", "timestamp"]
      }
    }
  },
  required: ["teacherTalkSeconds", "studentTalkSeconds", "silenceSeconds", "qaPairs", "transcript"]
});

interface SegmentAnalysis {
  teacherTalkSeconds: number;
  studentTalkSeconds: number;
  silenceSeconds: number;
  qaPairs: QAPair[];
  transcript: TranscriptSegment[];
}

/**
 * Analyzes a video segment that has been physically split from the original
 */
const analyzeVideoSegment = async (
  fileUri: string, 
  mimeType: string,
  segmentIndex: number,
  totalSegments: number,
  segmentDurationHint: string,
  tokenTracker: TokenTracker
): Promise<SegmentAnalysis> => {
  const maxRetries = 3;
  let attempt = 0;
  let response;

  while (attempt < maxRetries) {
    try {
      response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: createUserContent([
          createPartFromUri(fileUri, mimeType),
          `Analyze this ENTIRE video segment completely from start to finish.

This is segment ${segmentIndex + 1} of ${totalSegments} from a longer lesson (approximately ${segmentDurationHint}).

Provide:
1. Total seconds the teacher speaks in this segment
2. Total seconds students speak in this segment  
3. Total seconds of silence/group work in this segment
4. ALL question-answer interactions in this segment
5. COMPLETE transcript of EVERYTHING said in this segment from beginning to end

CRITICAL: Analyze the ENTIRE segment. Do not stop partway through. Include ALL dialogue from the first second to the last second of this video file.

Timestamps should be relative to this segment (starting from 00:00).`
        ]),
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: getSegmentSchema(),
          maxOutputTokens: 8192,
        }
      });
      break;
    } catch (e: any) {
      if (e.message?.includes('503') || e.status === 503) {
        attempt++;
        console.warn(`Gemini API 503 Overloaded on segment ${segmentIndex + 1}. Retrying attempt ${attempt}/${maxRetries}...`);
        if (attempt >= maxRetries) throw e;
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt - 1)));
      } else {
        throw e;
      }
    }
  }

  // Track token usage
  const usage = response?.usageMetadata;
  if (usage) {
    tokenTracker.addChunkAnalysis(
      usage.promptTokenCount || 0,
      usage.candidatesTokenCount || 0
    );
  }

  const resultText = response?.text;
  if (!resultText) {
    throw new Error(`No data returned from Gemini for segment ${segmentIndex + 1}.`);
  }

  return JSON.parse(resultText) as SegmentAnalysis;
};

/**
 * Generates overall feedback based on combined analysis
 */
const generateOverallFeedback = async (
  combinedData: Omit<LessonAnalysis, 'overallFeedback' | 'tokenUsage'>,
  tokenTracker: TokenTracker
): Promise<string> => {
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: createUserContent([
      `Based on the following classroom analysis data, provide a brief summary paragraph (approximately 50 words) with qualitative feedback on the lesson flow, teaching effectiveness, and student engagement. 

Key metrics from the full video analysis:
- Teacher talk time: ${combinedData.teacherTalkTimePercentage.toFixed(1)}%
- Student talk time: ${combinedData.studentTalkTimePercentage.toFixed(1)}%
- Silence/group work: ${combinedData.silenceOrGroupWorkPercentage.toFixed(1)}%
- Average wait time: ${combinedData.averageWaitTimeSeconds.toFixed(1)} seconds
- Total Q&A interactions: ${combinedData.qaPairs.length}

Sample questions asked:
${combinedData.qaPairs.slice(0, 5).map(qa => `- "${qa.question}" (${qa.bloomTaxonomyLevel})`).join('\n')}

Provide constructive, actionable feedback in a supportive tone.`
    ]),
    config: {
      maxOutputTokens: 200,
    }
  });

  // Track token usage
  const usage = response.usageMetadata;
  if (usage) {
    tokenTracker.addFeedbackGeneration(
      usage.promptTokenCount || 0,
      usage.candidatesTokenCount || 0
    );
  }

  return response.text || "The lesson demonstrated a structured approach to content delivery with opportunities for increased student participation.";
};

/**
 * Progress callback type with extended phases for segmentation
 */
export type ProgressCallback = (progress: {
  phase: 'segmenting' | 'uploading' | 'processing' | 'analyzing' | 'combining' | 'feedback';
  currentSegment: number;
  totalSegments: number;
  currentStep: string;
  percent?: number;
}) => void;

export const analyzeLessonVideo = async (
  file: File, 
  onProgress?: ProgressCallback
): Promise<LessonAnalysis> => {
  // Initialize token tracker
  const tokenTracker = new TokenTracker();
  
  try {
    // 1. Segment the video using FFmpeg.wasm
    console.log("Segmenting video with FFmpeg.wasm...");
    
    const segmentDurationSeconds = CHUNK_DURATION_MINUTES * 60;
    
    const handleSegmentationProgress: SegmentationProgressCallback = (progress) => {
      onProgress?.({
        phase: 'segmenting',
        currentSegment: 0,
        totalSegments: 1,
        currentStep: progress.message,
        percent: progress.percent,
      });
    };
    
    const segments = await segmentVideo(file, segmentDurationSeconds, handleSegmentationProgress);
    const numSegments = segments.length;
    
    console.log(`Video segmented into ${numSegments} parts`);

    // 2. Upload each segment and wait for processing
    const segmentUris: string[] = [];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      // Upload
      console.log(`Uploading segment ${i + 1}/${numSegments}...`);
      onProgress?.({
        phase: 'uploading',
        currentSegment: i + 1,
        totalSegments: numSegments,
        currentStep: `Uploading segment ${i + 1}/${numSegments} (${segment.startTimestamp} - ${segment.endTimestamp})...`,
      });
      
      const fileUri = await uploadFileToGemini(segment.file);
      
      // Wait for processing
      onProgress?.({
        phase: 'processing',
        currentSegment: i + 1,
        totalSegments: numSegments,
        currentStep: `Processing segment ${i + 1}/${numSegments} on server...`,
      });
      
      let state = "PROCESSING";
      while (state === "PROCESSING") {
        await new Promise(resolve => setTimeout(resolve, 2000));
        state = await getFileStatus(fileUri);
      }

      if (state !== "ACTIVE") {
        throw new Error(`Video processing failed for segment ${i + 1} on Gemini servers.`);
      }
      
      segmentUris.push(fileUri);
      
      // Small delay between uploads to avoid rate limiting
      if (i < segments.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 3. Analyze each segment
    const segmentResults: SegmentAnalysis[] = [];
    const mimeType = file.type || 'video/mp4';
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const segmentDuration = `${Math.round((segment.endTimeSeconds - segment.startTimeSeconds) / 60)} minutes`;
      
      console.log(`Analyzing segment ${i + 1}/${numSegments}: ${segment.startTimestamp} - ${segment.endTimestamp}`);
      onProgress?.({ 
        phase: 'analyzing',
        currentSegment: i + 1, 
        totalSegments: numSegments, 
        currentStep: `Analyzing segment ${i + 1}/${numSegments} (${segment.startTimestamp} - ${segment.endTimestamp})` 
      });
      
      const analysisData = await analyzeVideoSegment(
        segmentUris[i], 
        mimeType,
        i, 
        numSegments,
        segmentDuration,
        tokenTracker
      );
      
      // Adjust timestamps to reflect position in original video
      const offsetSeconds = segment.startTimeSeconds;
      
      // Adjust transcript timestamps
      if (analysisData.transcript) {
        analysisData.transcript = analysisData.transcript.map(t => ({
          ...t,
          timestamp: adjustTimestamp(t.timestamp, offsetSeconds),
        }));
      }
      
      // Adjust Q&A timestamps
      if (analysisData.qaPairs) {
        analysisData.qaPairs = analysisData.qaPairs.map(qa => ({
          ...qa,
          timestamp: adjustTimestamp(qa.timestamp, offsetSeconds),
        }));
      }
      
      segmentResults.push(analysisData);
      
      // Small delay between analyses to avoid rate limiting
      if (i < segments.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 4. Combine results
    console.log("Combining analysis results...");
    onProgress?.({ 
      phase: 'combining',
      currentSegment: numSegments, 
      totalSegments: numSegments, 
      currentStep: "Combining results..." 
    });
    
    let totalTeacherSeconds = 0;
    let totalStudentSeconds = 0;
    let totalSilenceSeconds = 0;
    let allQaPairs: QAPair[] = [];
    let allTranscript: TranscriptSegment[] = [];

    for (const result of segmentResults) {
      totalTeacherSeconds += result.teacherTalkSeconds || 0;
      totalStudentSeconds += result.studentTalkSeconds || 0;
      totalSilenceSeconds += result.silenceSeconds || 0;
      
      if (result.qaPairs) {
        allQaPairs.push(...result.qaPairs);
      }
      if (result.transcript) {
        allTranscript.push(...result.transcript);
      }
    }

    const totalTime = totalTeacherSeconds + totalStudentSeconds + totalSilenceSeconds;
    
    // Calculate percentages and round to one decimal place
    const teacherPercentage = totalTime > 0 
      ? Math.round((totalTeacherSeconds / totalTime) * 1000) / 10 
      : 0;
    const studentPercentage = totalTime > 0 
      ? Math.round((totalStudentSeconds / totalTime) * 1000) / 10 
      : 0;
    const silencePercentage = totalTime > 0 
      ? Math.round((totalSilenceSeconds / totalTime) * 1000) / 10 
      : 0;

    // Sort transcript by timestamp first, then deduplicate
    allTranscript.sort((a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp));
    allTranscript = deduplicateTranscript(allTranscript);
    console.log(`Transcript: ${allTranscript.length} segments after deduplication`);

    // Sort QA pairs by timestamp first, then deduplicate
    allQaPairs.sort((a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp));
    allQaPairs = deduplicateQaPairs(allQaPairs);
    console.log(`Q&A pairs: ${allQaPairs.length} pairs after deduplication`);

    // Calculate average wait time from deduplicated Q&A pairs
    const waitTimes = allQaPairs.map(qa => qa.waitTimeSeconds).filter(w => w > 0);
    const avgWaitTime = waitTimes.length > 0 
      ? Math.round((waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) * 10) / 10
      : 0;

    const combinedData: Omit<LessonAnalysis, 'overallFeedback' | 'tokenUsage'> = {
      teacherTalkTimePercentage: teacherPercentage,
      studentTalkTimePercentage: studentPercentage,
      silenceOrGroupWorkPercentage: silencePercentage,
      averageWaitTimeSeconds: avgWaitTime,
      qaPairs: allQaPairs,
      transcript: allTranscript,
    };

    // 5. Generate overall feedback
    console.log("Generating overall feedback...");
    onProgress?.({ 
      phase: 'feedback',
      currentSegment: numSegments, 
      totalSegments: numSegments, 
      currentStep: "Generating feedback..." 
    });
    const overallFeedback = await generateOverallFeedback(combinedData, tokenTracker);

    // Get final token usage
    const tokenUsage = tokenTracker.getUsage();
    console.log(`Token Usage Summary:
      - Prompt tokens: ${tokenUsage.promptTokens.toLocaleString()}
      - Completion tokens: ${tokenUsage.completionTokens.toLocaleString()}
      - Total tokens: ${tokenUsage.totalTokens.toLocaleString()}`);

    const finalResult: LessonAnalysis = {
      ...combinedData,
      overallFeedback,
      tokenUsage,
    };

    console.log("Analysis complete!");
    return finalResult;

  } catch (error) {
    console.error("Error analyzing video:", error);
    throw error;
  }
};
