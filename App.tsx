import React, { useState } from 'react';
import { AnalysisState, AnalysisStatus, AnalysisProgress } from './types';
import { analyzeLessonVideo, ProgressCallback } from './services/geminiService';
import FileUpload from './components/FileUpload';
import AnalysisDashboard from './components/AnalysisDashboard';
import { Layout, PlaySquare, Loader2, Sparkles, AlertTriangle, Scissors, Upload, Brain, FileText } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AnalysisState>({
    status: AnalysisStatus.IDLE,
    data: null,
    error: null,
  });

  const [fileName, setFileName] = useState<string>('');

  const handleFileSelect = async (file: File) => {
    setFileName(file.name);
    setState({ status: AnalysisStatus.SEGMENTING, data: null, error: null });

    try {
      const handleProgress: ProgressCallback = (progress) => {
        let status: AnalysisStatus;
        switch (progress.phase) {
          case 'segmenting':
            status = AnalysisStatus.SEGMENTING;
            break;
          case 'uploading':
          case 'processing':
            status = AnalysisStatus.UPLOADING;
            break;
          case 'analyzing':
          case 'combining':
          case 'feedback':
            status = AnalysisStatus.ANALYZING;
            break;
          default:
            status = AnalysisStatus.ANALYZING;
        }
        
        setState(prev => ({
          ...prev,
          status,
          progress: {
            phase: progress.phase,
            currentSegment: progress.currentSegment,
            totalSegments: progress.totalSegments,
            currentStep: progress.currentStep,
            percent: progress.percent,
          }
        }));
      };
      
      const analysisData = await analyzeLessonVideo(file, handleProgress);
      
      setState({
        status: AnalysisStatus.COMPLETE,
        data: analysisData,
        error: null,
        progress: undefined
      });
    } catch (err: any) {
      let errorMessage = "An unexpected error occurred.";
      if (err instanceof Error) {
        errorMessage = err.message;
        if (err.message.includes("413")) {
          errorMessage = "The file is too large for this browser-based demo. Please try a smaller or lower resolution video.";
        }
      }
      setState({
        status: AnalysisStatus.ERROR,
        data: null,
        error: errorMessage,
        progress: undefined
      });
    }
  };

  const reset = () => {
    setState({ status: AnalysisStatus.IDLE, data: null, error: null });
    setFileName('');
  };

  const getPhaseDisplay = (progress?: AnalysisProgress) => {
    if (!progress) {
      return {
        title: 'Processing...',
        subtitle: 'Preparing video for analysis.',
        icon: <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />,
        color: '#2563eb',
      };
    }

    switch (progress.phase) {
      case 'segmenting':
        return {
          title: 'Splitting Video',
          subtitle: progress.currentStep || 'Dividing video into segments for better analysis...',
          icon: <Scissors size={32} />,
          color: '#9333ea',
        };
      case 'uploading':
        return {
          title: 'Uploading Segments',
          subtitle: progress.currentStep || 'Sending video segments to Gemini...',
          icon: <Upload size={32} />,
          color: '#2563eb',
        };
      case 'processing':
        return {
          title: 'Processing on Server',
          subtitle: progress.currentStep || 'Gemini is processing the video segment...',
          icon: <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />,
          color: '#2563eb',
        };
      case 'analyzing':
        return {
          title: 'Analyzing Content',
          subtitle: progress.currentStep || `Gemini is watching "${fileName}"...`,
          icon: <Brain size={32} />,
          color: '#4f46e5',
        };
      case 'combining':
        return {
          title: 'Combining Results',
          subtitle: 'Merging analysis from all segments...',
          icon: <FileText size={32} />,
          color: '#16a34a',
        };
      case 'feedback':
        return {
          title: 'Generating Feedback',
          subtitle: 'Creating actionable insights...',
          icon: <Sparkles size={32} />,
          color: '#d97706',
        };
      default:
        return {
          title: 'Analyzing Lesson...',
          subtitle: progress.currentStep || 'Processing video...',
          icon: <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />,
          color: '#2563eb',
        };
    }
  };

  const phaseDisplay = getPhaseDisplay(state.progress);
  const isProcessing = state.status === AnalysisStatus.SEGMENTING || 
                       state.status === AnalysisStatus.UPLOADING || 
                       state.status === AnalysisStatus.ANALYZING;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', paddingBottom: '5rem' }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '4rem' }}>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
              onClick={reset}
            >
              <div style={{ backgroundColor: '#2563eb', padding: '0.5rem', borderRadius: '0.5rem', color: '#ffffff' }}>
                <Layout size={20} />
              </div>
              <h1 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 700, 
                background: 'linear-gradient(to right, #1d4ed8, #4338ca)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0
              }}>
                Classroom Insight AI
              </h1>
            </div>
            {state.status === AnalysisStatus.COMPLETE && (
               <button 
                onClick={reset}
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#64748b',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
               >
                 Analyze Another Video
               </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2.5rem 1rem' }}>
        
        {state.status === AnalysisStatus.IDLE && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: '2rem',
          }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '42rem' }}>
              <h2 style={{ 
                fontSize: '2.25rem', 
                fontWeight: 800, 
                letterSpacing: '-0.025em', 
                color: '#0f172a',
                lineHeight: '1.1',
                margin: 0
              }}>
                Analyze teaching dynamics <br/>
                <span style={{ color: '#2563eb' }}>in seconds.</span>
              </h2>
              <p style={{ fontSize: '1.125rem', color: '#475569', margin: 0 }}>
                Upload a classroom video to automatically generate insights on Talk Time, Question Wait Time, and Bloom's Taxonomy distribution.
              </p>
            </div>
            <FileUpload onFileSelect={handleFileSelect} />
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
              gap: '1.5rem',
              width: '100%',
              maxWidth: '56rem',
              marginTop: '3rem',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '50%', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', marginBottom: '0.75rem' }}>
                  <Sparkles style={{ width: '1.5rem', height: '1.5rem', color: '#a855f7' }} />
                </div>
                <h3 style={{ fontWeight: 600, margin: '0 0 0.25rem 0' }}>AI Transcription</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Detects every question and response.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '50%', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', marginBottom: '0.75rem' }}>
                  <PlaySquare style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
                </div>
                <h3 style={{ fontWeight: 600, margin: '0 0 0.25rem 0' }}>Multimodal Analysis</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Watches video & listens to audio simultaneously.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '50%', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', marginBottom: '0.75rem' }}>
                  <Layout style={{ width: '1.5rem', height: '1.5rem', color: '#22c55e' }} />
                </div>
                <h3 style={{ fontWeight: 600, margin: '0 0 0.25rem 0' }}>Actionable Data</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Visual charts for talk ratios and wait times.</p>
              </div>
            </div>
          </div>
        )}

        {isProcessing && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: '1.5rem',
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '6rem',
                height: '6rem',
                border: '4px solid #f1f5f9',
                borderRadius: '50%',
              }}></div>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '6rem',
                height: '6rem',
                border: `4px solid ${phaseDisplay.color}`,
                borderRadius: '50%',
                borderTopColor: 'transparent',
                animation: 'spin 1s linear infinite',
              }}></div>
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: phaseDisplay.color,
              }}>
                {phaseDisplay.icon}
              </div>
            </div>
            <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem 0' }}>
                {phaseDisplay.title}
              </h3>
              <p style={{ color: '#64748b', margin: 0 }}>
                {phaseDisplay.subtitle}
              </p>
              
              {state.progress && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: phaseDisplay.color, margin: 0 }}>
                    {state.progress.currentStep}
                  </p>
                  
                  {state.progress.phase === 'segmenting' && state.progress.percent !== undefined && (
                    <div style={{ width: '16rem', margin: '0 auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                        <span>Progress</span>
                        <span>{state.progress.percent}%</span>
                      </div>
                      <div style={{ height: '0.5rem', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            backgroundColor: phaseDisplay.color, 
                            borderRadius: '9999px',
                            width: `${state.progress.percent}%`,
                            transition: 'width 0.3s',
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {state.progress.phase !== 'segmenting' && state.progress.totalSegments > 1 && (
                    <div style={{ width: '16rem', margin: '0 auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                        <span>Segments</span>
                        <span>{state.progress.currentSegment} / {state.progress.totalSegments}</span>
                      </div>
                      <div style={{ height: '0.5rem', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            backgroundColor: phaseDisplay.color, 
                            borderRadius: '9999px',
                            width: `${(state.progress.currentSegment / state.progress.totalSegments) * 100}%`,
                            transition: 'width 0.5s',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {state.status === AnalysisStatus.ERROR && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            textAlign: 'center',
            gap: '1.5rem',
          }}>
            <div style={{ backgroundColor: '#fef2f2', padding: '1.5rem', borderRadius: '50%' }}>
              <AlertTriangle style={{ width: '3rem', height: '3rem', color: '#ef4444' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Analysis Failed</h3>
              <p style={{ color: '#475569', margin: 0, maxWidth: '28rem' }}>{state.error}</p>
            </div>
            <button 
              onClick={reset}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0f172a'}
            >
              Try Again
            </button>
          </div>
        )}

        {state.status === AnalysisStatus.COMPLETE && state.data && (
          <AnalysisDashboard data={state.data} />
        )}

      </main>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default App;
