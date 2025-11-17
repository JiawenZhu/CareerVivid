import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, Session, LiveServerMessage } from "@google/genai";
import { InterviewStatus, TranscriptEntry, InterviewAnalysis, GenAIBlob, PracticeHistoryEntry, Job } from '../types';
import { analyzeInterviewTranscript } from '../services/geminiService';
import { Loader2, Mic, StopCircle, X, Download, Bot, User, FileText, BarChart } from 'lucide-react';
import { usePracticeHistory } from '../hooks/useJobHistory';
import InterviewReportModal from './InterviewReportModal';
import { useAuth } from '../contexts/AuthContext';

// --- Audio Utility Functions ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface AIInterviewAgentModalProps {
  jobId: string;
  interviewPrompt: string;
  questions: string[];
  isFirstTime: boolean;
  resumeContext: string;
  jobTitle: string;
  jobCompany: string;
  onClose: () => void;
  isGuestMode?: boolean;
}

const analysisLoadingMessages = [
    "Reviewing your full transcript...",
    "Analyzing vocal tone and confidence...",
    "Assessing clarity and articulation...",
    "Evaluating the relevance of your answers...",
    "Identifying your key strengths...",
    "Compiling constructive feedback...",
    "Putting the final touches on your report...",
];

const AIInterviewAgentModal: React.FC<AIInterviewAgentModalProps> = ({ jobId, interviewPrompt, questions, isFirstTime, resumeContext, jobTitle, jobCompany, onClose, isGuestMode = false }) => {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<InterviewStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [analysisResult, setAnalysisResult] = useState<InterviewAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGreetingPrompt, setShowGreetingPrompt] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  
  const INACTIVITY_TIMEOUT_MS = 20000; // 20 seconds of inactivity
  const inactivityTimerRef = useRef<number | null>(null);

  const { addAnalysisToJob } = usePracticeHistory();

  const sessionPromiseRef = useRef<Promise<Session> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isCleaningUpRef = useRef(false);

  useEffect(() => {
    let interval: number;
    if (status === 'analyzing') {
        setLoadingMessageIndex(0); // Reset on start
        interval = window.setInterval(() => {
            setLoadingMessageIndex(prevIndex => {
                if (prevIndex >= analysisLoadingMessages.length - 1) {
                    return prevIndex; // Stay on the last message
                }
                return prevIndex + 1;
            });
        }, 1800);
    }
    return () => clearInterval(interval);
  }, [status]);
  
  const cleanup = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;

    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    scriptProcessorRef.current?.disconnect();
    scriptProcessorRef.current = null;
    mediaStreamSourceRef.current?.disconnect();
    mediaStreamSourceRef.current = null;
    if (inputAudioContextRef.current?.state !== 'closed') inputAudioContextRef.current?.close().catch(console.error);
    inputAudioContextRef.current = null;
    if (outputAudioContextRef.current?.state !== 'closed') outputAudioContextRef.current?.close().catch(console.error);
    outputAudioContextRef.current = null;
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();
    
    sessionPromiseRef.current?.then(session => session.close()).catch(console.error);
    sessionPromiseRef.current = null;
  }, []);

  const endInterview = useCallback(() => {
    if (status === 'ended' || status === 'error' || isCleaningUpRef.current) return;
    setStatus('ended');
    cleanup();
  }, [status, cleanup]);
  
  const handleGetFeedback = useCallback(async () => {
    // Prevent analysis if conversation is too short
    const conversationTurns = transcript.filter(t => t.isFinal).length;
    if (conversationTurns < 2) {
      setError("Not enough conversation to analyze. Please try the interview again.");
      setStatus('ended'); // Revert status
      return;
    }

    setStatus('analyzing');
    setError(null);
    let success = false;
    try {
        const firstEntry = transcript.find(t => t.timestamp);
        const lastEntry = [...transcript].reverse().find(t => t.timestamp);
        let durationInSeconds = 0;
        if (firstEntry?.timestamp && lastEntry?.timestamp) {
            durationInSeconds = (lastEntry.timestamp - firstEntry.timestamp) / 1000;
        }

        const analysisData = await analyzeInterviewTranscript(currentUser?.uid || 'guest', transcript, interviewPrompt, durationInSeconds);
        if (isGuestMode) {
            const guestAnalysis: InterviewAnalysis = {
                ...analysisData,
                transcript,
                id: `guest_analysis_${Date.now()}`,
                timestamp: Date.now(),
            };
             const guestPracticeEntry: PracticeHistoryEntry = {
                id: 'guest',
                job: {
                    id: 'guest_job',
                    title: jobTitle,
                    company: jobCompany,
                    description: interviewPrompt,
                    location: '',
                    url: ''
                },
                questions,
                timestamp: Date.now(),
                interviewHistory: [guestAnalysis]
            };
            localStorage.setItem('guestInterview', JSON.stringify(guestPracticeEntry));
            setAnalysisResult(guestAnalysis);
        } else if (currentUser) {
            const fullAnalysis = await addAnalysisToJob(jobId, { ...analysisData, transcript });
            setAnalysisResult(fullAnalysis);
        } else {
             throw new Error("Cannot save feedback without being logged in.");
        }
        success = true;
    } catch(e: any) {
        setError(e.message || "Failed to get interview feedback.");
    } finally {
        if (!success) {
            setStatus('ended');
        }
    }
  }, [currentUser, transcript, interviewPrompt, isGuestMode, jobTitle, jobCompany, questions, addAnalysisToJob, jobId]);

  const handleInactivity = useCallback(() => {
    // If the AI is speaking or audio is still playing, it's not inactive.
    // Reset the timer and check again later.
    if (status === 'speaking' || audioSourcesRef.current.size > 0) {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = window.setTimeout(handleInactivity, INACTIVITY_TIMEOUT_MS);
      return;
    }
  
    // If we get here, there's been genuine silence from both sides.
    if (status !== 'ended' && status !== 'analyzing' && status !== 'error') {
      endInterview();
      handleGetFeedback();
    }
  }, [status, endInterview, handleGetFeedback]);
  
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = window.setTimeout(handleInactivity, INACTIVITY_TIMEOUT_MS);
  }, [handleInactivity]);

  const handleClose = useCallback(() => {
    cleanup();
    onClose();
  }, [cleanup, onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            handleClose();
        }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose]);


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (transcript.length > 0 && showGreetingPrompt) setShowGreetingPrompt(false);
    
    if (status === 'listening' || status === 'speaking') {
      resetInactivityTimer();
    } else {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    }
  }, [transcript, showGreetingPrompt, status, resetInactivityTimer]);

  const startInterview = async () => {
    isCleaningUpRef.current = false;
    setShowGreetingPrompt(true);
    setError(null);
    setTranscript([]);
    setAnalysisResult(null);
    setStatus('connecting');

    try {
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      let systemInstruction = `You are an expert AI interviewer for the company "${jobCompany}". Your name is Vivid. If the candidate asks your name, you MUST say "My name is Vivid." Do not say Gemini or any other name. You are conducting an interview for the position of "${jobTitle}". Your task is to conduct a short, focused interview. ${isFirstTime ? 'Begin with a polished introduction summarizing the company background if available, the role overview and key responsibilities, and any relevant industry or mission context gleaned from the job description. After the introduction, politely ask: "Do you have any questions before we begin the interview?" Wait for a brief acknowledgement before proceeding.' : 'Start by greeting the candidate briefly and then ask the first question from the list without waiting for the candidate to speak first.'} Proceed through the list of questions. You may ask one or two relevant follow-up questions if the candidate’s response invites it.

After the final question and the candidate’s answer, provide a brief wrap‑up before ending:

Give a concise 2–3 sentence summary of the candidate’s overall performance.
Provide 2–3 short, personalized tips for improvement.
Then say: "You can view a full feedback report by clicking Get Feedback.".
Finally, append the exact text token <END_INTERVIEW> to your text output only (do not speak this token).

**Important policy:**

If the candidate asks about the company, team, or culture and you are not certain, do not fabricate details.
Be transparent about uncertainty and suggest asking the recruiter or checking official sources (e.g., the company website).
Maintain a polite and professional tone while emphasizing honesty.

Here are the questions:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
`;
        if (resumeContext) {
            systemInstruction += `\n\nFor additional context, here is the candidate's resume. Use this to ask more targeted questions relating their experience to the job description.\n\n--- RESUME ---\n${resumeContext}`;
        }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction,
        },
        callbacks: {
          onopen: () => {
            setStatus('listening');
            if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
            const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
            mediaStreamSourceRef.current = source;
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              if (isCleaningUpRef.current) return;
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              
              const buffer = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                  const s = Math.max(-1, Math.min(1, inputData[i]));
                  buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }

              const pcmBlob: GenAIBlob = {
                data: encode(new Uint8Array(buffer.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };

              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            resetInactivityTimer();

            const processTranscription = (transcription: { text?: string } | undefined, speaker: 'user' | 'ai') => {
              const endToken = '<END_INTERVIEW>';
              let text = transcription?.text?.trim();
              if (text) {
                  if (text.includes(endToken)) {
                      endInterview();
                      text = text.replace(endToken, '').trim();
                  }
                  if (!text) return;

                   setTranscript(prev => {
                        const last = prev[prev.length - 1];
                        if (last?.speaker === speaker && !last.isFinal) {
                            // Append to the last entry if it's the same speaker and not final
                             const newTranscript = [...prev];
                             newTranscript[newTranscript.length - 1] = { ...last, text: last.text + ' ' + text };
                             return newTranscript;
                        } else {
                            // Create a new entry
                            return [...prev, { speaker, text, isFinal: false, timestamp: Date.now() }];
                        }
                    });
              }
            };

            processTranscription(message.serverContent?.inputTranscription, 'user');
            processTranscription(message.serverContent?.outputTranscription, 'ai');

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
                setStatus('speaking');
                const ctx = outputAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.addEventListener('ended', () => {
                  audioSourcesRef.current.delete(source);
                  if (audioSourcesRef.current.size === 0 && status !== 'ended') {
                      setStatus('listening');
                  }
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                audioSourcesRef.current.add(source);
            }
            
            if (message.serverContent?.turnComplete) {
              setTranscript(prev => prev.map(t => ({...t, isFinal: true})));
            }
          },
          onclose: () => {
            cleanup();
          },
          onerror: (e: Event) => {
            console.error("Interview session error:", e);
            setError("A connection error occurred during the interview.");
            setStatus('error');
            cleanup();
          },
        },
      });

    } catch (err: any) {
      console.error(err);
      const errorMessage = err.name === 'NotAllowedError' 
        ? "Microphone permission was denied. Please allow microphone access to start."
        : "Could not start the interview. Please check your microphone.";
      setError(errorMessage);
      setStatus('error');
    }
  };
  
  const getStatusIndicator = () => {
    switch (status) {
        case 'connecting': return <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Connecting...</>;
        case 'listening': return <><span className="relative flex h-3 w-3 mr-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>Listening...</>;
        case 'speaking': return <><span className="relative flex h-3 w-3 mr-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>Speaking...</>;
        case 'analyzing': return <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</>;
        case 'ended': return "Interview Ended";
        case 'error': return "Error";
        default: return "Ready";
    }
  };

  if (analysisResult) {
    const jobForReport: Job = {
      id: jobId,
      title: jobTitle,
      company: jobCompany,
      location: '',
      description: interviewPrompt,
      url: '',
    };

    const practiceHistoryEntryForReport: PracticeHistoryEntry = {
      id: jobId,
      job: jobForReport,
      questions: questions,
      timestamp: analysisResult.timestamp,
      interviewHistory: [analysisResult],
    };
    return <InterviewReportModal jobHistoryEntry={practiceHistoryEntryForReport} onClose={handleClose} isGuestMode={isGuestMode} />;
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col">
        <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">AI Interview Agent</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">Topic: {interviewPrompt}</p>
            <div className="text-sm mt-1 font-semibold flex items-center">{getStatusIndicator()}</div>
          </div>
          <button onClick={handleClose} className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 md:p-2">
            <X size={24} className="md:h-5 md:w-5"/>
          </button>
        </header>

        <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
           {status === 'analyzing' ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto" />
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-6">Generating Your Feedback Report...</h1>
                    <div className="h-6 mt-2">
                        <p key={loadingMessageIndex} className="text-gray-500 dark:text-gray-400 animate-fade-in">
                            {analysisLoadingMessages[loadingMessageIndex]}
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {error && <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md text-sm">{error}</div>}
                    
                    {showGreetingPrompt && (
                        <div className="flex flex-col items-center justify-center text-center p-4 animate-gentle-pulse">
                            <Mic className="w-12 h-12 text-primary-400 mb-3" />
                            <p className="font-semibold text-gray-700 dark:text-gray-300">
                                The AI is ready!
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Say "Hello" or "Hi" to begin.
                            </p>
                        </div>
                    )}

                    {transcript.map((entry, index) => (
                        <div key={index} className={`flex flex-col ${entry.speaker === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-start gap-3 ${entry.speaker === 'user' ? 'flex-row-reverse' : ''}`}>
                                {entry.speaker === 'ai' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center"><Bot size={18}/></div>}
                                <div className={`p-3 rounded-lg max-w-[80%] text-sm ${entry.speaker === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                    <p className="whitespace-pre-wrap">{entry.text}</p>
                                </div>
                                {entry.speaker === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center"><User size={18}/></div>}
                            </div>
                             {entry.isFinal && entry.timestamp && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">
                                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                </p>
                            )}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </>
            )}
        </div>
        
        <footer className="p-4 border-t dark:border-gray-700 flex justify-center md:justify-between items-center">
            <div>
                {status !== 'idle' && status !== 'ended' && status !== 'error' && (
                    <button 
                        onClick={endInterview}
                        disabled={status === 'analyzing'}
                        className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 flex items-center gap-2 disabled:bg-red-400 disabled:cursor-not-allowed"
                    >
                        <StopCircle size={20}/> End Interview
                    </button>
                )}
                 {status === 'idle' || status === 'error' ? (
                    <button onClick={startInterview} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 flex items-center gap-2">
                        <Mic size={20}/> Start Interview
                    </button>
                 ) : null}
                 {status === 'ended' && transcript.length > 0 && !analysisResult && (
                    <button onClick={handleGetFeedback} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2">
                        <BarChart size={20}/> Get Feedback
                    </button>
                 )}
            </div>
        </footer>
      </div>
    </div>
  );
};

export default AIInterviewAgentModal;
