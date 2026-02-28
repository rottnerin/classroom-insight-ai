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
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(to top, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
      color: '#0a0a0a', 
      paddingBottom: '5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Cloud-like decorative shapes */}
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '5%',
        width: '200px',
        height: '100px',
        background: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '50px',
        filter: 'blur(40px)',
        opacity: 0.6,
        zIndex: 0
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '10%',
        width: '250px',
        height: '120px',
        background: 'rgba(255, 255, 255, 0.12)',
        borderRadius: '60px',
        filter: 'blur(50px)',
        opacity: 0.5,
        zIndex: 0
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '50%',
        width: '180px',
        height: '90px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '45px',
        filter: 'blur(35px)',
        opacity: 0.4,
        zIndex: 0
      }}></div>

      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '4rem' }}>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
              onClick={reset}
            >
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: 700
              }}>
                C
              </div>
              <h1 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 700, 
                letterSpacing: '-0.02em',
                color: '#ffffff',
                margin: 0
              }}>
                Classroom Insight AI
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              {state.status === AnalysisStatus.COMPLETE && (
                <button 
                  onClick={reset}
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#ffffff',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    padding: '0.5rem 1rem',
                    transition: 'all 200ms ease-in-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  Analyze Another Video
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2.5rem 1rem', position: 'relative', zIndex: 1 }}>
        
        {state.status === AnalysisStatus.IDLE && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '70vh',
            gap: '3rem',
            paddingTop: '4rem',
          }}>
            <div style={{ 
              textAlign: 'center', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.5rem', 
              maxWidth: '48rem',
              animation: 'fadeInUp 0.4s ease-out'
            }}>
              <h2 style={{ 
                fontSize: '4rem', 
                fontWeight: 400, 
                letterSpacing: '-0.02em', 
                color: '#ffffff',
                lineHeight: '1.1',
                margin: 0,
                fontFamily: 'Georgia, serif'
              }}>
                Elevate your teaching.
              </h2>
              <p style={{ fontSize: '1.25rem', color: 'rgba(255, 255, 255, 0.9)', margin: 0, maxWidth: '36rem', marginLeft: 'auto', marginRight: 'auto' }}>
                Classroom Insight AI is an intelligent analysis tool that brings video insights directly into your teaching practice.
              </p>
            </div>
            <FileUpload onFileSelect={handleFileSelect} />
            
            {/* Feature Cards - Tilted Style */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
              width: '100%',
              maxWidth: '64rem',
              marginTop: '6rem',
              position: 'relative',
            }}>
              {/* AI Transcription Card */}
              <div style={{ 
                backgroundColor: '#ffffff',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                transform: 'rotate(-2deg)',
                transition: 'transform 200ms ease-in-out',
                animation: 'fadeInUp 0.4s ease-out 0.1s both',
                position: 'relative',
                zIndex: 1
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(-1deg) scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(-2deg) scale(1)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ backgroundColor: '#f3e8ff', padding: '0.75rem', borderRadius: '0.5rem' }}>
                    <Sparkles style={{ width: '1.5rem', height: '1.5rem', color: '#a855f7' }} />
                  </div>
                  <h3 style={{ fontWeight: 600, fontSize: '1rem', margin: 0, color: '#1e293b' }}>AI Transcription</h3>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
                  Automatically detects every question, response, and interaction with precise timestamps.
                </p>
              </div>

              {/* Multimodal Analysis Card */}
              <div style={{ 
                backgroundColor: '#ffffff',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                transform: 'rotate(1.5deg)',
                transition: 'transform 200ms ease-in-out',
                animation: 'fadeInUp 0.4s ease-out 0.15s both',
                position: 'relative',
                zIndex: 1
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(0.5deg) scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(1.5deg) scale(1)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ backgroundColor: '#dbeafe', padding: '0.75rem', borderRadius: '0.5rem' }}>
                    <PlaySquare style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
                  </div>
                  <h3 style={{ fontWeight: 600, fontSize: '1rem', margin: 0, color: '#1e293b' }}>Multimodal Analysis</h3>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
                  Watches video and listens to audio simultaneously for comprehensive classroom insights.
                </p>
              </div>

              {/* Actionable Data Card */}
              <div style={{ 
                backgroundColor: '#ffffff',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                transform: 'rotate(-1deg)',
                transition: 'transform 200ms ease-in-out',
                animation: 'fadeInUp 0.4s ease-out 0.2s both',
                position: 'relative',
                zIndex: 1
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(0deg) scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(-1deg) scale(1)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ backgroundColor: '#dcfce7', padding: '0.75rem', borderRadius: '0.5rem' }}>
                    <Layout style={{ width: '1.5rem', height: '1.5rem', color: '#22c55e' }} />
                  </div>
                  <h3 style={{ fontWeight: 600, fontSize: '1rem', margin: 0, color: '#1e293b' }}>Actionable Insights</h3>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
                  Visual charts and data for talk ratios, wait times, and Bloom's Taxonomy distribution.
                </p>
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
            animation: 'fadeIn 0.4s ease-out',
            paddingTop: '4rem',
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '6rem',
                height: '6rem',
                border: '4px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
              }}></div>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '6rem',
                height: '6rem',
                border: `4px solid #ffffff`,
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
                color: '#ffffff',
              }}>
                {phaseDisplay.icon}
              </div>
            </div>
            <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
              <h3 style={{ fontSize: '2rem', fontWeight: 400, letterSpacing: '-0.02em', color: '#ffffff', margin: '0 0 0.5rem 0', fontFamily: 'Georgia, serif' }}>
                {phaseDisplay.title}
              </h3>
              <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
                {phaseDisplay.subtitle}
              </p>
              
                  {state.progress && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
                    {state.progress.currentStep}
                  </p>
                  
                  {state.progress.phase === 'segmenting' && state.progress.percent !== undefined && (
                    <div style={{ width: '16rem', margin: '0 auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>
                        <span>Progress</span>
                        <span>{state.progress.percent}%</span>
                      </div>
                      <div style={{ height: '0.5rem', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            backgroundColor: '#ffffff', 
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>
                        <span>Segments</span>
                        <span>{state.progress.currentSegment} / {state.progress.totalSegments}</span>
                      </div>
                      <div style={{ height: '0.5rem', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            backgroundColor: '#ffffff', 
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
            paddingTop: '4rem',
          }}>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '1.5rem', borderRadius: '50%', backdropFilter: 'blur(10px)' }}>
              <AlertTriangle style={{ width: '3rem', height: '3rem', color: '#ffffff' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 400, letterSpacing: '-0.02em', color: '#ffffff', margin: '0 0 0.5rem 0', fontFamily: 'Georgia, serif' }}>Analysis Failed</h3>
              <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.9)', margin: 0, maxWidth: '28rem' }}>{state.error}</p>
            </div>
            <button 
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#ffffff',
                color: '#3b82f6',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 200ms ease-in-out',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default App;
