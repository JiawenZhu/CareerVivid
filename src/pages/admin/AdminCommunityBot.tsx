import React, { useState } from 'react';
import { suggestBotTopics, generateAndPublishArticle, generateLinkedInPost, TopicSuggestion } from '../../services/researchBotService';
import { Bot, RefreshCw, Send, CheckCircle2, ChevronRight, Loader2, CalendarClock, Clock, Linkedin } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';

const CATEGORIES = ['Coding', 'System Design', 'Career'];
const FREQUENCIES = ['Daily', 'Weekly', 'Monthly'];

const AdminCommunityBot: React.FC = () => {
    const { currentUser } = useAuth();
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [frequency, setFrequency] = useState(FREQUENCIES[1]);

    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);

    // Status tracking for generation
    const [activeGenerationIndex, setActiveGenerationIndex] = useState<number | null>(null);
    const [generationStatus, setGenerationStatus] = useState('');

    // Scheduling Automation State
    const [scheduleTime, setScheduleTime] = useState(() => localStorage.getItem('careervivid_bot_time') || '09:00');
    const [scheduleFreq, setScheduleFreq] = useState(() => localStorage.getItem('careervivid_bot_freq') || 'Weekly');
    const [isActivating, setIsActivating] = useState(false);
    const [activationStatus, setActivationStatus] = useState('');

    // LinkedIn Automation State
    const [linkedInPostText, setLinkedInPostText] = useState('');
    const [linkedInArticleUrl, setLinkedInArticleUrl] = useState('');
    const [isGeneratingLinkedIn, setIsGeneratingLinkedIn] = useState(false);
    const [isPublishingLinkedIn, setIsPublishingLinkedIn] = useState(false);
    const [linkedInStatus, setLinkedInStatus] = useState('');
    const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
    const [isVerifyingLinkedIn, setIsVerifyingLinkedIn] = useState(true);

    // 1. Check Connection Status on Mount
    useEffect(() => {
        const checkConnection = async () => {
            if (!currentUser) return;
            try {
                const docSnap = await getDoc(doc(db, 'users', currentUser.uid, 'integrations', 'linkedin'));
                if (docSnap.exists() && docSnap.data().connected) {
                    setIsLinkedInConnected(true);
                }
            } catch (err) {
                console.error('LinkedIn check failed:', err);
            } finally {
                setIsVerifyingLinkedIn(false);
            }
        };
        checkConnection();
    }, [currentUser]);

    // 2. Handle OAuth Callback
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (code && state === currentUser?.uid && !isLinkedInConnected) {
            const completeHandshake = async () => {
                setLinkedInStatus('Completing LinkedIn connection...');
                try {
                    const functions = getFunctions(undefined, 'us-west1');
                    const handleLinkedInCallback = httpsCallable(functions, 'handleLinkedInCallback');
                    await handleLinkedInCallback({
                        code,
                        state,
                        redirectUri: window.location.origin + window.location.pathname
                    });
                    setIsLinkedInConnected(true);
                    setLinkedInStatus('LinkedIn connected successfully! 🎉');
                    // Clean URL
                    window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
                    setTimeout(() => setLinkedInStatus(''), 4000);
                } catch (err: any) {
                    console.error('LinkedIn Handshake Failed:', err);
                    setLinkedInStatus(`Connection failed: ${err.message}`);
                }
            };
            completeHandshake();
        }
    }, [currentUser, isLinkedInConnected]);

    const handleConnectLinkedIn = async () => {
        setLinkedInStatus('Initiating LinkedIn connection...');
        try {
            const functions = getFunctions(undefined, 'us-west1');
            const getLinkedInAuthUrl = httpsCallable(functions, 'getLinkedInAuthUrl');
            const result: any = await getLinkedInAuthUrl({
                redirectUri: window.location.origin + window.location.pathname
            });
            if (result.data?.url) {
                window.location.href = result.data.url;
            }
        } catch (err: any) {
            console.error('Failed to get auth URL:', err);
            setLinkedInStatus(`Error: ${err.message}`);
        }
    };

    const handleSuggestTopics = async () => {
        setIsSuggesting(true);
        setSuggestions([]);
        try {
            const topics = await suggestBotTopics(category, frequency);
            setSuggestions(topics);
        } catch (error) {
            console.error(error);
            alert('Failed to suggest topics.');
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleApproveAndGenerate = async (index: number, topicTitle: string) => {
        if (activeGenerationIndex !== null) return; // Prevent multiple concurrent generations to avoid UI mess

        setActiveGenerationIndex(index);
        setGenerationStatus('Starting...');

        try {
            if (!currentUser) throw new Error("Admin user not authenticated");
            const adminUserId = currentUser.uid;

            const newArticle = await generateAndPublishArticle(
                adminUserId,
                topicTitle,
                category,
                (status) => setGenerationStatus(status)
            );

            setGenerationStatus('Article Published! Drafting LinkedIn Post...');
            setIsGeneratingLinkedIn(true);

            // Construct exact article URL
            const fullArticleUrl = `https://careervivid.app/community/post/${newArticle.id}`;
            setLinkedInArticleUrl(fullArticleUrl);

            // Immediately pipe the newly published article into the LinkedIn Social generator
            const socialText = await generateLinkedInPost(newArticle.title, newArticle.content);
            setLinkedInPostText(socialText);

            setGenerationStatus('Done. Review LinkedIn Post.');
            setIsGeneratingLinkedIn(false);

            // Remove from suggestions list after a short delay
            setTimeout(() => {
                setSuggestions(prev => prev.filter((_, i) => i !== index));
                setActiveGenerationIndex(null);
                setGenerationStatus('');
            }, 2000);

        } catch (error) {
            console.error('Generation failed:', error);
            setGenerationStatus('Failed! See console.');
            setTimeout(() => {
                setActiveGenerationIndex(null);
                setGenerationStatus('');
            }, 3000);
        }
    };

    const handleActivateAutomation = async () => {
        setIsActivating(true);
        setActivationStatus('Saving schedule...');
        try {
            // Persist to local storage so it survives refresh
            localStorage.setItem('careervivid_bot_time', scheduleTime);
            localStorage.setItem('careervivid_bot_freq', scheduleFreq);

            // Mock backend save for now — this would write to a 'bot_schedules' collection
            await new Promise(resolve => setTimeout(resolve, 1500));
            setActivationStatus('Automation Active!');
            setTimeout(() => setActivationStatus(''), 3000);
        } catch (error) {
            console.error(error);
            setActivationStatus('Failed to activate');
            setTimeout(() => setActivationStatus(''), 3000);
        } finally {
            setIsActivating(false);
        }
    };

    const handlePublishLinkedIn = async () => {
        setIsPublishingLinkedIn(true);
        setLinkedInStatus('Publishing to LinkedIn...');

        try {
            const functions = getFunctions(undefined, 'us-west1');
            const publishLinkedInPost = httpsCallable(functions, 'publishLinkedInPost');

            await publishLinkedInPost({
                text: linkedInPostText,
                articleUrl: linkedInArticleUrl
            });

            setLinkedInStatus('Successfully posted to LinkedIn! 🚀');
            setTimeout(() => {
                // Reset state once finished
                setLinkedInPostText('');
                setLinkedInArticleUrl('');
                setLinkedInStatus('');
            }, 6000);
        } catch (error: any) {
            console.error('LinkedIn Publishing Error:', error);

            if (error.message?.includes('not connected')) {
                setLinkedInStatus('Error: Admin is not connected to LinkedIn. Please connect via Integration Settings.');
            } else {
                setLinkedInStatus(`Error: ${error.message || 'Failed to post.'}`);
            }
            setTimeout(() => setLinkedInStatus(''), 5000);
        } finally {
            setIsPublishingLinkedIn(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center gap-3">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-xl">
                    <Bot size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expert Researcher Bot</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Automate high-quality community content with Gemini & Tavily.</p>
                </div>
            </div>

            {/* Controls panel */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Focus Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Schedule Context</label>
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleSuggestTopics}
                    disabled={isSuggesting || activeGenerationIndex !== null}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSuggesting ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                    {isSuggesting ? 'Brainstorming Topics...' : 'Suggest Topics'}
                </button>
            </div>

            {/* Schedule Automation Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
                <div className="flex items-center gap-2 mb-6 text-gray-900 dark:text-white">
                    <CalendarClock size={20} className="text-primary-600 dark:text-primary-400" />
                    <h2 className="text-lg font-bold">Schedule Automation</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                            <Clock size={16} /> Publish Time
                        </label>
                        <input
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                            <RefreshCw size={16} /> Frequency
                        </label>
                        <select
                            value={scheduleFreq}
                            onChange={(e) => setScheduleFreq(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Every Two Weeks">Every Two Weeks</option>
                            <option value="Monthly">Monthly</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end items-center gap-4">
                    {activationStatus && (
                        <span className={`text-sm font-medium ${activationStatus.includes('Active') ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}>
                            {activationStatus}
                        </span>
                    )}
                    <button
                        onClick={handleActivateAutomation}
                        disabled={isActivating}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isActivating ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                        Approve & Activate Automation
                    </button>
                </div>
            </div>

            {/* Suggestions list */}
            {suggestions.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Suggested Topics <span className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-xs py-0.5 px-2 rounded-full">{suggestions.length}</span>
                    </h2>

                    <div className="grid gap-4">
                        {suggestions.map((suggestion, idx) => {
                            const isGenerating = activeGenerationIndex === idx;
                            const isBusy = activeGenerationIndex !== null;

                            return (
                                <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <h3 className="text-gray-900 dark:text-gray-100 font-medium leading-snug flex-1 flex items-start gap-3">
                                        <ChevronRight size={18} className="text-gray-400 shrink-0 mt-0.5 hidden sm:block" />
                                        {suggestion.title}
                                    </h3>

                                    <div className="shrink-0 min-w-[160px] flex justify-end">
                                        {isGenerating ? (
                                            <div className="flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-4 py-2 rounded-lg w-full justify-center">
                                                {generationStatus === 'Published!' ? <CheckCircle2 size={16} /> : <Loader2 size={16} className="animate-spin" />}
                                                <span>{generationStatus}</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleApproveAndGenerate(idx, suggestion.title)}
                                                disabled={isBusy}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition-colors shadow-sm disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed dark:disabled:bg-gray-800 dark:disabled:text-gray-600"
                                            >
                                                <Send size={15} />
                                                Approve & Generate
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Empty state when no suggestions and not suggesting */}
            {!isSuggesting && suggestions.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">Click "Suggest Topics" to see AI-generated ideas.</p>
                </div>
            )}

            {/* LinkedIn Preview Modal/Area */}
            {(linkedInPostText || isGeneratingLinkedIn) && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Linkedin size={24} className="text-[#0A66C2]" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Review LinkedIn Post</h3>
                            </div>
                            <button
                                onClick={() => { setLinkedInPostText(''); setLinkedInStatus(''); }}
                                disabled={isPublishingLinkedIn || isGeneratingLinkedIn}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                Cancel
                            </button>
                        </div>

                        <div className="p-6">
                            {isGeneratingLinkedIn ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <Bot size={48} className="text-blue-500 mb-4 animate-bounce" />
                                    <h4 className="text-gray-900 dark:text-white font-medium mb-2">AI is drafting your viral LinkedIn hook...</h4>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Summarizing the article to drive maximal engagement.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Edit the AI-generated post before it goes live:</p>
                                    <textarea
                                        value={linkedInPostText}
                                        onChange={(e) => setLinkedInPostText(e.target.value)}
                                        className="w-full h-64 p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent outline-none resize-none font-sans text-sm leading-relaxed"
                                        placeholder="Write your post here..."
                                        disabled={!isLinkedInConnected || isPublishingLinkedIn}
                                    />

                                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-lg text-sm flex gap-2 items-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                        <span>Attached link: <strong>{linkedInArticleUrl}</strong></span>
                                    </div>

                                    {linkedInStatus && (
                                        <div className={`p-3 rounded-lg text-sm text-center font-medium ${linkedInStatus.includes('Error') || linkedInStatus.includes('failed') ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                                            {linkedInStatus}
                                        </div>
                                    )}

                                    {!isVerifyingLinkedIn && !isLinkedInConnected && (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 flex flex-col items-center gap-3">
                                            <p className="text-sm font-medium text-center">Your LinkedIn account is not connected. You need to link it once to enable automated posting.</p>
                                            <button
                                                onClick={handleConnectLinkedIn}
                                                className="bg-[#0A66C2] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#004182] transition-colors shadow-sm"
                                            >
                                                <Linkedin size={18} />
                                                Connect LinkedIn Account
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-4">
                                        <button
                                            onClick={handlePublishLinkedIn}
                                            disabled={isPublishingLinkedIn || !linkedInPostText || !isLinkedInConnected}
                                            className="bg-[#0A66C2] hover:bg-[#004182] text-white px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isPublishingLinkedIn ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                            Publish immediately
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCommunityBot;
