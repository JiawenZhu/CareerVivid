import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { generalChat } from '../services/geminiService';
import { useResumes } from '../hooks/useResumes'; // Assuming language is part of a global state or context accessible here
import { useAuth } from '../contexts/AuthContext';

type ChatMessage = {
    role: 'user' | 'model';
    parts: { text: string }[];
};

const ChatBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { currentUser } = useAuth();
    // This is a simplified way to get a language preference. 
    // In a real app, this might come from a context provider.
    const { resumes } = useResumes();
    const language = resumes[0]?.language || 'English';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || isLoading || !currentUser) return;

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
                className="fixed bottom-6 right-6 bg-primary-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-transform transform hover:scale-110"
                aria-label="Toggle Chat"
            >
                {isOpen ? <X size={32} /> : <MessageSquare size={32} />}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-full max-w-sm h-auto max-h-[70vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right border dark:border-gray-700">
                    <header className="bg-primary-600 text-white p-4 rounded-t-xl flex items-center">
                        <Bot className="mr-3" size={24}/>
                        <h3 className="font-bold text-lg">AI Assistant</h3>
                    </header>
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
                        <div className="space-y-4">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${msg.role === 'user' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.parts[0].text}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                               <div className="flex justify-start">
                                   <div className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl px-4 py-2">
                                       <div className="flex items-center space-x-1">
                                           <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                                           <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></span>
                                           <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                                       </div>
                                   </div>
                               </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask anything..."
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <button onClick={handleSend} disabled={isLoading} className="bg-primary-600 text-white p-3 rounded-full hover:bg-primary-700 disabled:bg-primary-300">
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatBot;