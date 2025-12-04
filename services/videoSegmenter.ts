import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

/**
 * Represents a video segment with metadata
 */
export interface VideoSegment {
  file: File;
  index: number;
  startTimeSeconds: number;
  endTimeSeconds: number;
  startTimestamp: string;
  endTimestamp: string;
}

/**
 * Progress callback for segmentation
 */
export type SegmentationProgressCallback = (progress: {
  phase: 'loading' | 'segmenting' | 'complete';
  message: string;
  percent?: number;
}) => void;

// Singleton FFmpeg instance
let ffmpeg: FFmpeg | null = null;
let isLoaded = false;

/**
 * Formats seconds to MM:SS timestamp
 */
const formatTimestamp = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Checks if SharedArrayBuffer is available (required for FFmpeg.wasm)
 */
const checkSharedArrayBufferSupport = (): void => {
  if (typeof SharedArrayBuffer === 'undefined') {
    throw new Error(
      'SharedArrayBuffer is not available. This is required for FFmpeg.wasm to work. ' +
      'Please ensure the server is running with the correct CORS headers (Cross-Origin-Opener-Policy: same-origin, ' +
      'Cross-Origin-Embedder-Policy: require-corp). If you see this error, the server may need to be restarted.'
    );
  }
};

/**
 * Loads FFmpeg.wasm if not already loaded
 */
const loadFFmpeg = async (onProgress?: SegmentationProgressCallback): Promise<FFmpeg> => {
  if (ffmpeg && isLoaded) {
    return ffmpeg;
  }

  // Check for SharedArrayBuffer support
  checkSharedArrayBufferSupport();

  onProgress?.({
    phase: 'loading',
    message: 'Loading FFmpeg.wasm (first time only, ~31MB)...',
    percent: 0,
  });

  ffmpeg = new FFmpeg();

  // Set up progress logging
  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg]', message);
  });

  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.({
      phase: 'segmenting',
      message: 'Splitting video into segments...',
      percent: Math.round(progress * 100),
    });
  });

  // Load FFmpeg with locally served core files (from public directory, same origin)
  try {
    onProgress?.({
      phase: 'loading',
      message: 'Fetching FFmpeg core files...',
      percent: 10,
    });
    
    // Use files from public directory - served from same origin with correct headers
    const coreURL = '/ffmpeg/ffmpeg-core.js';
    const wasmURL = '/ffmpeg/ffmpeg-core.wasm';
    
    onProgress?.({
      phase: 'loading',
      message: 'Converting to blob URLs...',
      percent: 30,
    });
    
    // Fetch and convert to blob URLs manually (more reliable than toBlobURL)
    console.log('[FFmpeg] Loading core from:', coreURL);
    const coreResponse = await fetch(coreURL);
    if (!coreResponse.ok) {
      throw new Error(`Failed to fetch core: ${coreResponse.status} ${coreResponse.statusText}`);
    }
    const coreBlob = await coreResponse.blob();
    const coreBlobURL = URL.createObjectURL(new Blob([coreBlob], { type: 'text/javascript' }));
    console.log('[FFmpeg] Core loaded, loading WASM from:', wasmURL);
    
    onProgress?.({
      phase: 'loading',
      message: 'Loading WASM file (this may take a moment)...',
      percent: 60,
    });
    
    const wasmResponse = await fetch(wasmURL);
    if (!wasmResponse.ok) {
      throw new Error(`Failed to fetch WASM: ${wasmResponse.status} ${wasmResponse.statusText}`);
    }
    const wasmBlob = await wasmResponse.blob();
    const wasmBlobURL = URL.createObjectURL(new Blob([wasmBlob], { type: 'application/wasm' }));
    console.log('[FFmpeg] WASM loaded, initializing FFmpeg...');
    
    onProgress?.({
      phase: 'loading',
      message: 'Initializing FFmpeg...',
      percent: 80,
    });
    
    await ffmpeg.load({
      coreURL: coreBlobURL,
      wasmURL: wasmBlobURL,
    });
    
    console.log('[FFmpeg] FFmpeg loaded successfully');
  } catch (error: any) {
    console.error('[FFmpeg] Load error:', error);
    // Provide helpful error message if loading fails
    if (error.message?.includes('SharedArrayBuffer') || typeof SharedArrayBuffer === 'undefined') {
      throw new Error(
        'FFmpeg.wasm requires SharedArrayBuffer support. Please ensure:\n' +
        '1. The server is running with CORS headers (Cross-Origin-Opener-Policy: same-origin, Cross-Origin-Embedder-Policy: require-corp)\n' +
        '2. You are accessing the app via localhost or HTTPS\n' +
        '3. The server has been restarted after configuration changes'
      );
    }
    throw error;
  }

  isLoaded = true;
  
  onProgress?.({
    phase: 'loading',
    message: 'FFmpeg loaded successfully',
    percent: 100,
  });

  return ffmpeg;
};

/**
 * Gets the video duration using HTML5 video element
 */
const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Segments a video file into smaller chunks using FFmpeg.wasm
 * 
 * @param file - The video file to segment
 * @param segmentDurationSeconds - Duration of each segment in seconds (default: 300 = 5 minutes)
 * @param onProgress - Progress callback
 * @returns Array of VideoSegment objects
 */
export const segmentVideo = async (
  file: File,
  segmentDurationSeconds: number = 300,
  onProgress?: SegmentationProgressCallback
): Promise<VideoSegment[]> => {
  // Load FFmpeg
  const ff = await loadFFmpeg(onProgress);

  // Get video duration
  const totalDuration = await getVideoDuration(file);
  const numSegments = Math.ceil(totalDuration / segmentDurationSeconds);
  
  console.log(`Video duration: ${totalDuration}s, creating ${numSegments} segments`);

  onProgress?.({
    phase: 'segmenting',
    message: `Preparing to split video into ${numSegments} segments...`,
    percent: 0,
  });

  // Write input file to FFmpeg's virtual filesystem
  const inputFileName = 'input.mp4';
  const inputData = await fetchFile(file);
  await ff.writeFile(inputFileName, inputData);

  const segments: VideoSegment[] = [];

  // Process each segment individually for better control
  for (let i = 0; i < numSegments; i++) {
    const startTime = i * segmentDurationSeconds;
    const duration = Math.min(segmentDurationSeconds, totalDuration - startTime);
    const endTime = startTime + duration;
    const outputFileName = `segment_${i.toString().padStart(3, '0')}.mp4`;

    onProgress?.({
      phase: 'segmenting',
      message: `Creating segment ${i + 1}/${numSegments} (${formatTimestamp(startTime)} - ${formatTimestamp(endTime)})...`,
      percent: Math.round((i / numSegments) * 100),
    });

    // Use FFmpeg to extract this segment
    // -ss before -i for fast seeking, -t for duration, -c copy for stream copy (fast, no re-encoding)
    await ff.exec([
      '-ss', startTime.toString(),
      '-i', inputFileName,
      '-t', duration.toString(),
      '-c', 'copy',
      '-avoid_negative_ts', 'make_zero',
      '-y',
      outputFileName
    ]);

    // Read the output file
    const outputData = await ff.readFile(outputFileName);
    // Convert to Uint8Array with ArrayBuffer backing (Blob doesn't accept SharedArrayBuffer)
    // FileData can be Uint8Array or string, but for binary video data it should be Uint8Array
    const dataArray = outputData instanceof Uint8Array 
      ? new Uint8Array(outputData) // Copy to new ArrayBuffer to avoid SharedArrayBuffer issues
      : new Uint8Array(0); // Fallback (shouldn't happen for binary video data)
    const blob = new Blob([dataArray], { type: file.type || 'video/mp4' });
    const segmentFile = new File([blob], `${file.name}_segment_${i}.mp4`, { 
      type: file.type || 'video/mp4' 
    });

    segments.push({
      file: segmentFile,
      index: i,
      startTimeSeconds: startTime,
      endTimeSeconds: endTime,
      startTimestamp: formatTimestamp(startTime),
      endTimestamp: formatTimestamp(endTime),
    });

    // Clean up segment file from virtual filesystem
    await ff.deleteFile(outputFileName);
  }

  // Clean up input file
  await ff.deleteFile(inputFileName);

  onProgress?.({
    phase: 'complete',
    message: `Successfully created ${segments.length} segments`,
    percent: 100,
  });

  console.log(`Created ${segments.length} video segments`);
  return segments;
};

/**
 * Check if FFmpeg is already loaded (useful for UI feedback)
 */
export const isFFmpegLoaded = (): boolean => {
  return isLoaded;
};

