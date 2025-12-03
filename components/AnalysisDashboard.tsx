import React, { useState } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { LessonAnalysis } from '../types';
import { Clock, MessageCircle, BarChart2, Mic, Users, PauseCircle, FileText, LayoutDashboard, Zap, ChevronDown, ChevronUp } from 'lucide-react';

interface AnalysisDashboardProps {
  data: LessonAnalysis;
}

const COLORS = ['#3b82f6', '#10b981', '#94a3b8']; // Blue (Teacher), Green (Student), Gray (Silence)

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'transcript'>('insights');
  const [showTokenDetails, setShowTokenDetails] = useState(false);

  const pieData = [
    { name: 'Teacher Talk', value: parseFloat(data.teacherTalkTimePercentage.toFixed(1)) },
    { name: 'Student Talk', value: parseFloat(data.studentTalkTimePercentage.toFixed(1)) },
    { name: 'Silence/Work', value: parseFloat(data.silenceOrGroupWorkPercentage.toFixed(1)) },
  ];

  const waitTimeData = data.qaPairs.map((pair, index) => ({
    name: `Q${index + 1}`,
    waitTime: pair.waitTimeSeconds,
    question: pair.question, // For tooltip
    timestamp: pair.timestamp
  }));

  // Style definitions
  const dashboardContainerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '2rem 1rem',
  };

  const tabContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    borderBottom: '2px solid #e2e8f0',
    marginBottom: '2rem',
  };

  const getTabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    border: 'none',
    backgroundColor: 'transparent',
    color: isActive ? '#2563eb' : '#64748b',
    borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: isActive ? 600 : 500,
    transition: 'all 0.2s',
    marginBottom: '-2px',
  });

  const insightsContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  };

  const summaryGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
  };

  const summaryCardStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    border: '1px solid #e2e8f0',
  };

  const getSummaryIconStyle = (color: 'blue' | 'green' | 'amber'): React.CSSProperties => {
    const colors = {
      blue: { bg: '#dbeafe', color: '#2563eb' },
      green: { bg: '#d1fae5', color: '#10b981' },
      amber: { bg: '#fef3c7', color: '#d97706' },
    };
    return {
      padding: '0.75rem',
      borderRadius: '0.5rem',
      backgroundColor: colors[color].bg,
      color: colors[color].color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  };

  const summaryLabelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: 0,
    marginBottom: '0.25rem',
  };

  const summaryValueStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1e293b',
    margin: 0,
  };

  const chartsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '1.5rem',
  };

  const chartCardStyle: React.CSSProperties = {
    padding: '1.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    border: '1px solid #e2e8f0',
  };

  const chartTitleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '1rem',
  };

  const chartIconStyle: React.CSSProperties = {
    width: '1.25rem',
    height: '1.25rem',
    color: '#64748b',
  };

  const chartContainerStyle: React.CSSProperties = {
    height: '16rem',
    width: '100%',
  };

  const feedbackCardStyle: React.CSSProperties = {
    padding: '1.5rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.75rem',
    border: '1px solid #e2e8f0',
  };

  const feedbackTitleStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '0.75rem',
  };

  const feedbackTextStyle: React.CSSProperties = {
    color: '#475569',
    lineHeight: '1.75',
    margin: 0,
  };

  const interactionTableContainerStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  };

  const interactionTableHeaderStyle: React.CSSProperties = {
    padding: '1.5rem',
    borderBottom: '1px solid #e2e8f0',
  };

  const interactionTableTitleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#1e293b',
    margin: 0,
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const tableHeaderStyle: React.CSSProperties = {
    backgroundColor: '#f8fafc',
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#475569',
    borderBottom: '1px solid #e2e8f0',
  };

  const tableCellStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    borderBottom: '1px solid #e2e8f0',
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 500,
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
  };

  const tokenPanelStyle: React.CSSProperties = {
    backgroundColor: '#1e293b',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    border: '1px solid #334155',
  };

  const tokenPanelButtonStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#ffffff',
  };

  const tokenPanelContentStyle: React.CSSProperties = {
    padding: '1.5rem',
    borderTop: '1px solid #334155',
    backgroundColor: '#0f172a',
  };

  const tokenDetailsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  };

  const tokenDetailCardStyle: React.CSSProperties = {
    padding: '1rem',
    backgroundColor: '#1e293b',
    borderRadius: '0.5rem',
    border: '1px solid #334155',
  };

  const tokenDetailLabelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#cbd5e1',
    marginBottom: '0.75rem',
    margin: 0,
  };

  const tokenDetailRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  };

  const transcriptContainerStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  };

  const transcriptHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #e2e8f0',
  };

  const transcriptContentStyle: React.CSSProperties = {
    padding: '1.5rem',
    maxHeight: '70vh',
    overflowY: 'auto',
  };

  const getTranscriptSegmentStyle = (isTeacher: boolean): React.CSSProperties => ({
    display: 'flex',
    justifyContent: isTeacher ? 'flex-start' : 'flex-end',
    marginBottom: '1rem',
  });

  const getTranscriptBubbleStyle = (isTeacher: boolean): React.CSSProperties => ({
    maxWidth: '70%',
    padding: '1rem',
    borderRadius: '0.75rem',
    backgroundColor: isTeacher ? '#eff6ff' : '#f0fdf4',
    border: `1px solid ${isTeacher ? '#bfdbfe' : '#bbf7d0'}`,
  });

  const transcriptBubbleHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  };

  const getTranscriptSpeakerStyle = (isTeacher: boolean): React.CSSProperties => ({
    fontSize: '0.75rem',
    fontWeight: 600,
    color: isTeacher ? '#2563eb' : '#10b981',
  });

  const transcriptTimestampStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#94a3b8',
  };

  const transcriptTextStyle: React.CSSProperties = {
    color: '#1e293b',
    lineHeight: '1.6',
    margin: 0,
  };

  const transcriptEmptyStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    color: '#94a3b8',
    textAlign: 'center',
  };

  return (
    <div style={dashboardContainerStyle}>
      {/* Navigation Tabs */}
      <div style={tabContainerStyle}>
        <button
          onClick={() => setActiveTab('insights')}
          style={getTabButtonStyle(activeTab === 'insights')}
        >
          <LayoutDashboard size={18} />
          <span>Insights & Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('transcript')}
          style={getTabButtonStyle(activeTab === 'transcript')}
        >
          <FileText size={18} />
          <span>Full Transcript</span>
        </button>
      </div>

      {activeTab === 'insights' ? (
        <div style={insightsContainerStyle}>
          {/* Summary Cards */}
          <div style={summaryGridStyle}>
            <div style={summaryCardStyle}>
              <div style={getSummaryIconStyle('blue')}>
                <Mic size={24} />
              </div>
              <div>
                <p style={summaryLabelStyle}>Teacher Talk</p>
                <p style={summaryValueStyle}>{data.teacherTalkTimePercentage.toFixed(1)}%</p>
              </div>
            </div>
            <div style={summaryCardStyle}>
              <div style={getSummaryIconStyle('green')}>
                <Users size={24} />
              </div>
              <div>
                <p style={summaryLabelStyle}>Student Talk</p>
                <p style={summaryValueStyle}>{data.studentTalkTimePercentage.toFixed(1)}%</p>
              </div>
            </div>
            <div style={summaryCardStyle}>
              <div style={getSummaryIconStyle('amber')}>
                <Clock size={24} />
              </div>
              <div>
                <p style={summaryLabelStyle}>Avg Wait Time</p>
                <p style={summaryValueStyle}>{data.averageWaitTimeSeconds.toFixed(1)}s</p>
              </div>
            </div>
          </div>

          {/* Main Charts Area */}
          <div style={chartsGridStyle}>
            {/* Talk Time Distribution */}
            <div style={chartCardStyle}>
              <h3 style={chartTitleStyle}>
                <BarChart2 style={chartIconStyle} />
                Talk Time Distribution
              </h3>
              <div style={chartContainerStyle}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Wait Time Analysis */}
            <div style={chartCardStyle}>
              <h3 style={chartTitleStyle}>
                <PauseCircle style={chartIconStyle} />
                Wait Time per Question
              </h3>
              <div style={chartContainerStyle}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waitTimeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill: '#64748b'}} axisLine={false} tickLine={false} label={{ value: 'Seconds', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                    <RechartsTooltip 
                      cursor={{fill: '#f1f5f9'}}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div style={{
                              backgroundColor: '#1e293b',
                              color: '#ffffff',
                              padding: '0.75rem',
                              borderRadius: '0.5rem',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                              fontSize: '0.75rem',
                              maxWidth: '20rem',
                            }}>
                              <p style={{ fontWeight: 700, marginBottom: '0.25rem', margin: 0 }}>{data.timestamp} - {data.name}</p>
                              <p style={{ marginBottom: '0.25rem', margin: 0 }}>Wait: {data.waitTime.toFixed(1)}s</p>
                              <p style={{ opacity: 0.8, fontStyle: 'italic', margin: 0 }}>"{data.question}"</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="waitTime" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Overall Qualitative Feedback */}
          <div style={feedbackCardStyle}>
            <h3 style={feedbackTitleStyle}>AI Observation Summary</h3>
            <p style={feedbackTextStyle}>
              {data.overallFeedback}
            </p>
          </div>

          {/* Interaction Log */}
          <div style={interactionTableContainerStyle}>
            <div style={interactionTableHeaderStyle}>
              <h3 style={interactionTableTitleStyle}>
                <MessageCircle style={chartIconStyle} />
                Classroom Interaction Log
              </h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Time</th>
                    <th style={tableHeaderStyle}>Question (Teacher)</th>
                    <th style={tableHeaderStyle}>Bloom's Level</th>
                    <th style={tableHeaderStyle}>Wait Time</th>
                    <th style={tableHeaderStyle}>Response (Student)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.qaPairs.map((pair, idx) => (
                    <tr key={idx}>
                      <td style={{ ...tableCellStyle, color: '#64748b', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{pair.timestamp}</td>
                      <td style={{ ...tableCellStyle, color: '#1e293b', fontWeight: 500, maxWidth: '20rem' }}>{pair.question}</td>
                      <td style={tableCellStyle}>
                        <span style={badgeStyle}>
                          {pair.bloomTaxonomyLevel}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{
                          fontWeight: 700,
                          color: pair.waitTimeSeconds < 3 ? '#ef4444' : '#16a34a',
                        }}>
                          {pair.waitTimeSeconds.toFixed(1)}s
                        </span>
                      </td>
                      <td style={{ ...tableCellStyle, color: '#64748b', maxWidth: '20rem', fontStyle: 'italic' }}>"{pair.answer}"</td>
                    </tr>
                  ))}
                  {data.qaPairs.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ ...tableCellStyle, padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                        No clear Q&A interactions detected in this segment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Token Usage Panel */}
          {data.tokenUsage && (
            <div style={tokenPanelStyle}>
              <button
                onClick={() => setShowTokenDetails(!showTokenDetails)}
                style={tokenPanelButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.2)', borderRadius: '0.5rem' }}>
                    <Zap size={20} color="#fbbf24" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#cbd5e1', margin: 0 }}>API Token Usage</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                      {data.tokenUsage.totalTokens.toLocaleString()} <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#94a3b8' }}>total tokens</span>
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.875rem' }}>
                    <div>
                      <span style={{ color: '#94a3b8' }}>Input:</span>{' '}
                      <span style={{ color: '#34d399', fontWeight: 600 }}>{data.tokenUsage.promptTokens.toLocaleString()}</span>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8' }}>Output:</span>{' '}
                      <span style={{ color: '#60a5fa', fontWeight: 600 }}>{data.tokenUsage.completionTokens.toLocaleString()}</span>
                    </div>
                  </div>
                  {showTokenDetails ? (
                    <ChevronUp size={20} color="#94a3b8" />
                  ) : (
                    <ChevronDown size={20} color="#94a3b8" />
                  )}
                </div>
              </button>
              
              {showTokenDetails && (
                <div style={tokenPanelContentStyle}>
                  <div style={tokenDetailsGridStyle}>
                    {/* Duration Check */}
                    <div style={tokenDetailCardStyle}>
                      <p style={tokenDetailLabelStyle}>Duration Check</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={tokenDetailRowStyle}>
                          <span style={{ color: '#94a3b8' }}>Input</span>
                          <span style={{ color: '#34d399', fontFamily: 'monospace' }}>{data.tokenUsage.breakdown.durationCheck?.prompt?.toLocaleString() || '0'}</span>
                        </div>
                        <div style={tokenDetailRowStyle}>
                          <span style={{ color: '#94a3b8' }}>Output</span>
                          <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{data.tokenUsage.breakdown.durationCheck?.completion?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Chunk Analysis */}
                    <div style={tokenDetailCardStyle}>
                      <p style={tokenDetailLabelStyle}>Video Analysis</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={tokenDetailRowStyle}>
                          <span style={{ color: '#94a3b8' }}>Input</span>
                          <span style={{ color: '#34d399', fontFamily: 'monospace' }}>{data.tokenUsage.breakdown.chunkAnalysis.prompt.toLocaleString()}</span>
                        </div>
                        <div style={tokenDetailRowStyle}>
                          <span style={{ color: '#94a3b8' }}>Output</span>
                          <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{data.tokenUsage.breakdown.chunkAnalysis.completion.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Feedback Generation */}
                    <div style={tokenDetailCardStyle}>
                      <p style={tokenDetailLabelStyle}>Feedback</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={tokenDetailRowStyle}>
                          <span style={{ color: '#94a3b8' }}>Input</span>
                          <span style={{ color: '#34d399', fontFamily: 'monospace' }}>{data.tokenUsage.breakdown.feedbackGeneration.prompt.toLocaleString()}</span>
                        </div>
                        <div style={tokenDetailRowStyle}>
                          <span style={{ color: '#94a3b8' }}>Output</span>
                          <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{data.tokenUsage.breakdown.feedbackGeneration.completion.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cost estimate note */}
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1rem', textAlign: 'center', margin: '1rem 0 0 0' }}>
                    Token counts are approximate. Video tokens are calculated based on Gemini's multimodal processing.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={transcriptContainerStyle}>
            <div style={transcriptHeaderStyle}>
              <h3 style={interactionTableTitleStyle}>
                <FileText style={chartIconStyle} />
                Full Lesson Transcript
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {data.transcript?.length || 0} segments found
              </div>
            </div>
            
            <div style={transcriptContentStyle}>
              {data.transcript && data.transcript.length > 0 ? (
                data.transcript.map((segment, idx) => {
                  const isTeacher = segment.speaker?.toLowerCase().includes('teacher');
                  
                  return (
                    <div 
                      key={idx} 
                      style={getTranscriptSegmentStyle(isTeacher)}
                    >
                      <div style={getTranscriptBubbleStyle(isTeacher)}>
                        <div style={transcriptBubbleHeaderStyle}>
                          <span style={getTranscriptSpeakerStyle(isTeacher)}>
                            {isTeacher ? 'Teacher' : 'Student'}
                          </span>
                          <span style={transcriptTimestampStyle}>
                            {segment.timestamp}
                          </span>
                        </div>
                        <p style={transcriptTextStyle}>
                          {segment.text}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={transcriptEmptyStyle}>
                  <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>Transcript data not available for this analysis.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisDashboard;
