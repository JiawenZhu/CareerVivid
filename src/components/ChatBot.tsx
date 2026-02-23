import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, HelpCircle } from 'lucide-react';
import { generalChat } from '../services/geminiService';
import { useResumes } from '../hooks/useResumes';
import { useAuth } from '../contexts/AuthContext';

type ChatMessage = {
    role: 'user' | 'model';
    parts: { text: string }[];
};

const FAQs = [
    { question: "How credit works?", answer: "Free users get 10 credits/month. Pro Month gets 300 credits! 1 credit = 1 AI response. Chat is free!" },
    { question: "How to export PDF?", answer: "Go to your Resume Dashboard, click 'Download' on any resume card." },
    { question: "Can I customize the design?", answer: "Yes! Use the 'Design' tab in the editor to change fonts, colors, and layouts." },
    { question: "How to upgrade?", answer: "Go to Profile -> Payment & Subscription -> Click on Manage Payment & Subscription button." }
];

const ChatBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { currentUser } = useAuth();

    // Note: ChatBot is intentionally free and does not check for AI credits.

    const { resumes } = useResumes();
    const language = resumes[0]?.language || 'English';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleFAQClick = (faq: typeof FAQs[0]) => {
        const userMessage: ChatMessage = { role: 'user', parts: [{ text: faq.question }] };
        const botMessage: ChatMessage = { role: 'model', parts: [{ text: faq.answer }] };
        setMessages(prev => [...prev, userMessage, botMessage]);
    };

    const handleSend = async () => {
        if (input.trim() === '' || isLoading || !currentUser) return;

        // No credit check for ChatBot - it's a free service!

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const responseText = await generalChat(currentUser.uid, messages, input, language);
            const modelMessage: ChatMessage = { role: 'model', parts: [{ text: responseText }] };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: "Sorry, I'm having trouble connecting right now." }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-gradient-to-r from-primary-600 to-indigo-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:shadow-2xl hover:scale-105 transition-all z-40"
                aria-label="Toggle Chat"
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-4 sm:right-6 w-[90vw] sm:w-[380px] h-[600px] max-h-[75vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right border dark:border-gray-700 z-40 animate-in slide-in-from-bottom-5 fade-in">
                    {/* Header */}
                    <header className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white p-4 rounded-t-2xl flex items-center shadow-md">
                        <div className="bg-white/20 p-2 rounded-lg mr-3">
                            <Bot className="text-white" size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">AI Assistant</h3>
                            <p className="text-xs text-indigo-100 opacity-90">Instant support & AI help (Free)</p>
                        </div>
                    </header>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 p-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                        {messages.length === 0 && (
                            <div className="text-center mt-8 mb-6">
                                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="text-indigo-600 dark:text-indigo-400" size={32} />
                                </div>
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">How can I help you?</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Ask me anything or choose a topic below.</p>
                            </div>
                        )}

                        <div className="space-y-4 pb-4">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-primary-600 text-white rounded-tr-none'
                                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-600'
                                        }`}>
                                        <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-gray-700 p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-600">
                                        <div className="flex items-center space-x-1.5">
                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* FAQs */}
                        {messages.length < 2 && (
                            <div className="mt-auto pt-4">
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2 flex items-center gap-1">
                                    <HelpCircle size={12} /> Common Questions
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                    {FAQs.map((faq, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                if (faq.question === "How to upgrade?") {
                                                    localStorage.setItem('upgrade_guide_step', '1');
                                                    window.dispatchEvent(new Event('trigger-upgrade-guide'));
                                                }
                                                handleFAQClick(faq);
                                            }}
                                            className="text-left px-4 py-3 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors shadow-sm hover:shadow active:scale-[0.98]"
                                        >
                                            {faq.question}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 rounded-b-2xl">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type a message..."
                                className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-gray-900/50 border-transparent focus:bg-white dark:focus:bg-gray-900 border focus:border-indigo-500 rounded-xl text-sm focus:outline-none transition-all dark:text-white"
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="absolute right-2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:bg-gray-400 transition-colors shadow-sm"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatBot;