
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { InterviewAnalysis, TranscriptEntry, PracticeHistoryEntry, Job } from '../types';
import { X, Download, FileText, BarChart, Bot, User, Loader2 } from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import { useAuth } from '../contexts/AuthContext';


// Minimal MarkdownRenderer for bolding
const MarkdownRenderer: React.FC<{ text: string }> = ({ text = '' }) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <div className="whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-semibold text-primary-600 dark:text-primary-400">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </div>
  );
};


const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
    const validScore = typeof score === 'number' && !isNaN(score) ? score : 0;
    const size = 120;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (validScore / 100) * circumference;

    const scoreColor = validScore >= 75 ? 'text-green-500' : validScore >= 50 ? 'text-yellow-500' : 'text-red-500';
    const ringColor = validScore >= 75 ? 'stroke-green-500' : validScore >= 50 ? 'stroke-yellow-500' : 'stroke-red-500';

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                <circle className="stroke-gray-200 dark:stroke-gray-700" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
                <circle
                    className={`${ringColor} transition-all duration-1000 ease-out`}
                    strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2}
                    strokeDasharray={`${circumference} ${circumference}`} style={{ strokeDashoffset: offset }} strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${scoreColor}`}>{Math.round(validScore)}</span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Overall</span>
            </div>
        </div>
    );
};

const MetricBar: React.FC<{ label: string; score: number }> = ({ label, score }) => {
    const validScore = typeof score === 'number' && !isNaN(score) ? score : 0;
    return (
        <div>
            <div className="flex justify-between items-center text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                <span>{label}</span>
                <span className="font-mono">{Math.round(validScore)}%</span>
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-2 bg-primary-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${validScore}%` }} />
            </div>
        </div>
    );
};

const FeedbackReportView: React.FC<{ analysis: InterviewAnalysis }> = ({ analysis }) => (
    <div className="space-y-6 p-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-gray-100 dark:bg-gray-900/50 p-6 rounded-lg">
            <div className="md:col-span-1 flex justify-center"><ScoreRing score={analysis.overallScore} /></div>
            <div className="md:col-span-2 space-y-4">
                <MetricBar label="Communication" score={analysis.communicationScore} />
                <MetricBar label="Confidence" score={analysis.confidenceScore} />
                <MetricBar label="Answer Relevance" score={analysis.relevanceScore} />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold mb-3">Strengths</h3>
                <div className="text-sm leading-relaxed"><MarkdownRenderer text={analysis.strengths} /></div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold mb-3">Areas for Improvement</h3>
                <div className="text-sm leading-relaxed"><MarkdownRenderer text={analysis.areasForImprovement} /></div>
            </div>
        </div>
    </div>
);

interface InterviewReportModalProps {
  jobHistoryEntry: PracticeHistoryEntry;
  onClose: () => void;
  isGuestMode?: boolean;
}

const InterviewReportModal: React.FC<InterviewReportModalProps> = ({ jobHistoryEntry, onClose, isGuestMode = false }) => {
    const [activeTab, setActiveTab] = useState<'feedback' | 'transcript'>('feedback');
    const [isDownloading, setIsDownloading] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    
    const sortedHistory = useMemo(() => {
        if (!jobHistoryEntry?.interviewHistory) return [];
        return [...jobHistoryEntry.interviewHistory].sort((a, b) => b.timestamp - a.timestamp);
    }, [jobHistoryEntry.interviewHistory]);

    const [currentAnalysis, setCurrentAnalysis] = useState<InterviewAnalysis | null>(sortedHistory[0] || null);

    // Logic to decide whether to show the feedback modal
    useEffect(() => {
        if (isGuestMode) return;

        const submittedCount = parseInt(localStorage.getItem('interviewFeedbackSubmittedCount') || '0', 10);
        const closedCount = parseInt(localStorage.getItem('interviewFeedbackClosedCount') || '0', 10);

        if (submittedCount < 2 && closedCount < 2) {
            const timer = setTimeout(() => {
                setIsFeedbackModalOpen(true);
            }, 2000); // show after 2s
            return () => clearTimeout(timer);
        }
    }, [isGuestMode]);

    const handleFeedbackSubmitted = () => {
        const currentCount = parseInt(localStorage.getItem('interviewFeedbackSubmittedCount') || '0', 10);
        localStorage.setItem('interviewFeedbackSubmittedCount', (currentCount + 1).toString());
    };

    const handleFeedbackCancelled = () => {
        const currentCount = parseInt(localStorage.getItem('interviewFeedbackClosedCount') || '0', 10);
        localStorage.setItem('interviewFeedbackClosedCount', (currentCount + 1).toString());
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const formatAnalysisToText = (analysis: InterviewAnalysis) => {
        const header = `Interview Feedback Report\nTopic: ${jobHistoryEntry.job.title}\nDate: ${new Date(analysis.timestamp).toLocaleString()}\n\n`;
        const scores = `--- OVERALL SCORE: ${Math.round(analysis.overallScore || 0)}/100 ---\n- Communication: ${Math.round(analysis.communicationScore || 0)}%\n- Confidence: ${Math.round(analysis.confidenceScore || 0)}%\n- Answer Relevance: ${Math.round(analysis.relevanceScore || 0)}%\n\n`;
        const strengths = `STRENGTHS:\n${(analysis.strengths || '').replace(/\*\*/g, '')}\n\n`;
        const improvements = `AREAS FOR IMPROVEMENT:\n${(analysis.areasForImprovement || '').replace(/\*\*/g, '')}\n\n`;
        
        let transcriptText = "--- TRANSCRIPT ---\n";
        (analysis.transcript || []).forEach(t => {
            const speaker = t.speaker === 'ai' ? 'Interviewer' : 'You';
            transcriptText += `${speaker}:\n${t.text}\n\n`;
        });

        return header + scores + strengths + improvements + transcriptText;
    };

    const handleDownloadTxt = () => {
        if (!currentAnalysis) return;
        const fileContent = formatAnalysisToText(currentAnalysis);
        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interview_report_${currentAnalysis.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadPdf = async () => {
        if (!currentAnalysis) return;
        setIsDownloading(true);
        try {
            // Dynamic imports to reduce initial bundle size
            const { jsPDF } = await import('jspdf');
            const html2canvas = (await import('html2canvas')).default;

            const element = printRef.current;
            if (!element) throw new Error("Printable element not found.");
    
            const canvas = await html2canvas(element, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                backgroundColor: '#ffffff',
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
    
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
    
            const imgProps = pdf.getImageProperties(imgData);
            const imgWidth = imgProps.width;
            const imgHeight = imgProps.height;
    
            const ratio = imgWidth / pdfWidth;
            const totalPdfHeight = imgHeight / ratio;
    
            let position = 0;
            let heightLeft = totalPdfHeight;
    
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalPdfHeight);
            heightLeft -= pdfHeight;
    
            while (heightLeft > 0) {
                position -= pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalPdfHeight);
                heightLeft -= pdfHeight;
            }
    
            pdf.save(`interview_report_${currentAnalysis.id}.pdf`);
    
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert("Sorry, an error occurred while generating the PDF.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-0 md:p-4">
      {isFeedbackModalOpen && currentAnalysis && (
        <FeedbackModal
            isOpen={isFeedbackModalOpen}
            onClose={() => setIsFeedbackModalOpen(false)}
            onSubmitted={handleFeedbackSubmitted}
            onCancel={handleFeedbackCancelled}
            source="interview"
            context={{
                jobId: jobHistoryEntry.id,
                jobTitle: jobHistoryEntry.job.title,
                analysisId: currentAnalysis.id,
            }}
        />
       )}
      {/* Hidden element for printing */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', fontFamily: 'Inter, sans-serif' }}>
          {currentAnalysis && (
              <div ref={printRef} className="bg-white" style={{ width: '800px', padding: '40px' }}>
                  <div className="text-center mb-8">
                      <h1 className="text-2xl font-bold text-gray-900">Interview Feedback Report</h1>
                      <p className="text-sm text-gray-600">
                          For the role of "{jobHistoryEntry.job.title}" on {new Date(currentAnalysis.timestamp).toLocaleDateString()}
                      </p>
                  </div>
                  
                  <FeedbackReportView analysis={currentAnalysis} />

                  <div style={{ pageBreakBefore: 'always', marginTop: '40px' }}>
                      <h2 className="text-xl font-bold text-gray-900 mb-4 pt-4 border-t">Interview Transcript</h2>
                      <div className="space-y-4">
                          {currentAnalysis.transcript.map((entry, index) => (
                              <div key={index} className={`flex items-start gap-3 w-full ${entry.speaker === 'user' ? 'flex-row-reverse' : 'items-start'}`}>
                                  <div className={`flex-shrink-0 w-8 h-8 rounded-full text-white flex items-center justify-center ${entry.speaker === 'ai' ? 'bg-primary-600' : 'bg-gray-500'}`}>
                                      {entry.speaker === 'ai' ? <Bot size={18}/> : <User size={18}/>}
                                  </div>
                                  <div className={`p-3 rounded-lg max-w-[80%] text-sm ${entry.speaker === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                      <p className="whitespace-pre-wrap">{entry.text}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-none md:rounded-lg shadow-2xl w-full h-full md:max-w-5xl md:h-[90vh] flex flex-col md:flex-row">
        
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-1/4 min-w-[200px] bg-gray-50 dark:bg-gray-800/50 border-r dark:border-gray-700 flex-col">
            <h3 className="p-4 text-lg font-bold border-b dark:border-gray-700 flex-shrink-0">Session History</h3>
            <div className="overflow-y-auto flex-grow">
                {sortedHistory.map(analysisItem => (
                    <button
                        key={analysisItem.id}
                        onClick={() => setCurrentAnalysis(analysisItem)}
                        className={`w-full text-left p-4 text-sm border-l-4 ${currentAnalysis?.id === analysisItem.id ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                    >
                        <p className="font-semibold">{new Date(analysisItem.timestamp).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(analysisItem.timestamp).toLocaleTimeString()}</p>
                    </button>
                ))}
            </div>
        </aside>

        {/* Main report content */}
        <div className="flex-grow flex flex-col overflow-hidden">
            <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                <div>
                    <h2 className="text-xl font-bold">Interview Report</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {currentAnalysis ? `Analysis from ${new Date(currentAnalysis.timestamp).toLocaleString()}` : 'No session selected'}
                    </p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20}/></button>
            </header>

            {currentAnalysis ? (
                <>
                    <div className="p-2 flex-shrink-0 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                         {/* Mobile Session Selector */}
                        <div className="md:hidden mb-2 px-2">
                             <label htmlFor="session-select" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Session History</label>
                             <select
                                id="session-select"
                                value={currentAnalysis?.id || ''}
                                onChange={e => {
                                    const selected = sortedHistory.find(h => h.id === e.target.value);
                                    if(selected) setCurrentAnalysis(selected);
                                }}
                                className="block w-full text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md dark:bg-gray-700 dark:border-gray-600"
                            >
                                {sortedHistory.map(analysisItem => (
                                    <option key={analysisItem.id} value={analysisItem.id}>
                                        {new Date(analysisItem.timestamp).toLocaleString()}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-center gap-2">
                            <button onClick={() => setActiveTab('feedback')} className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-2 ${activeTab === 'feedback' ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-600 dark:text-gray-300'}`}><BarChart size={16}/> Feedback</button>
                            <button onClick={() => setActiveTab('transcript')} className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-2 ${activeTab === 'transcript' ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-600 dark:text-gray-300'}`}><FileText size={16}/> Transcript</button>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900/50">
                    {activeTab === 'feedback' ? (
                            <FeedbackReportView analysis={currentAnalysis} />
                        ) : (
                            <div className="space-y-4">
                                {currentAnalysis.transcript.map((entry, index) => (
                                    <div key={index} className={`flex items-start gap-3 ${entry.speaker === 'user' ? 'justify-end' : ''}`}>
                                        {entry.speaker === 'ai' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center"><Bot size={18}/></div>}
                                        <div className={`p-3 rounded-lg max-w-[80%] text-sm ${entry.speaker === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                            <p className="whitespace-pre-wrap">{entry.text}</p>
                                        </div>
                                        {entry.speaker === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center"><User size={18}/></div>}
                                    </div>
                                ))}
                            </div>
                    )}
                    </div>

                    <footer className="p-4 border-t dark:border-gray-700 flex justify-end gap-3 flex-shrink-0">
                        {isGuestMode ? (
                            <a href="#/auth" className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-primary-700">
                                Sign Up to Save & Download Report
                            </a>
                        ) : (
                            <>
                                <button onClick={handleDownloadTxt} disabled={isDownloading} className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-gray-700 flex items-center gap-2">
                                    <Download size={20}/> Download TXT
                                </button>
                                <button onClick={handleDownloadPdf} disabled={isDownloading} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2">
                                    {isDownloading ? <Loader2 className="animate-spin" size={20}/> : <Download size={20}/>}
                                    {isDownloading ? 'Generating...' : 'Download PDF'}
                                </button>
                            </>
                        )}
                    </footer>
                </>
            ) : (
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-gray-500">No report available for this session.</p>
                </div>
            )}
        </div>
      </div>
    </div>
    )
};

export default InterviewReportModal;
