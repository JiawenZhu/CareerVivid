import React, { useState, useRef } from 'react';
import { Send, Calendar, Zap, CheckCircle, X, Info } from 'lucide-react';
import { useUsers } from '../hooks';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import Toast from '../../../components/Toast';

const MAX_SMS_LENGTH = 160;

const MessagingAutomation: React.FC = () => {
    const { users } = useUsers();
    const { currentUser: adminUser } = useAuth();
    const [message, setMessage] = useState('');
    const [audience, setAudience] = useState('all');
    const [sending, setSending] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [channel, setChannel] = useState<'sms' | 'whatsapp'>('sms');
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const templates = [
        { name: 'Welcome Message', body: 'Hi {first_name}, welcome to CareerVivid! We are excited to help you build your future.' },
        { name: 'Application Confirmation', body: 'Hello {first_name}, we have received your application for {company}. We will review it shortly.' },
        { name: 'Interview Invite', body: 'Great news {first_name}! {company} would like to invite you for an interview. Please check your dashboard.' },
        { name: 'Follow-up Reminder', body: 'Hi {first_name}, just a quick reminder to complete your profile on CareerVivid to unlock more opportunities.' },
        { name: 'Nudge (Inactive Users)', body: 'We miss you, {first_name}! New roles matching your profile were just posted. Come take a look!' }
    ];

    const tokens = ['{first_name}', '{last_name}', '{company}', '{job_title}'];

    const insertToken = (token: string) => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const newMsg = message.slice(0, start) + token + message.slice(end);
        setMessage(newMsg);
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + token.length;
                textareaRef.current.focus();
            }
        }, 0);
    };

    const handleSendNow = async () => {
        if (!message.trim()) {
            setToastMessage("Please enter a message.");
            return;
        }

        setSending(true);
        try {
            // Filter users based on audience
            let targetUsers = users;
            if (audience === 'inactive') {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                targetUsers = users.filter((u: any) => {
                    // Try different possible last login fields
                    const lastLogin = u.metadata?.lastSignInTime || u.lastLogin || u.updatedAt;
                    if (!lastLogin) return true;
                    const loginDate = typeof lastLogin === 'object' && lastLogin.toDate ? lastLogin.toDate() : new Date(lastLogin);
                    return loginDate < thirtyDaysAgo;
                });
            }

            // Create messaging queue entries
            const promises = targetUsers.map((u: any) => {
                const fullName = u.displayName || 'there';
                const firstName = fullName.split(' ')[0];
                const lastName = fullName.split(' ').slice(1).join(' ') || '';

                let personalizedMessage = message;
                personalizedMessage = personalizedMessage.replace(/{first_name}/g, firstName);
                personalizedMessage = personalizedMessage.replace(/{last_name}/g, lastName);

                return addDoc(collection(db, 'messaging_queue'), {
                    userId: u.uid || u.id,
                    recipientName: fullName,
                    content: personalizedMessage,
                    status: 'pending',
                    channel: channel,
                    type: 'sms_whatsapp',
                    createdAt: serverTimestamp(),
                    adminId: adminUser?.uid
                });
            });

            await Promise.all(promises);
            setToastMessage(`Success! ${targetUsers.length} messages added to the queue.`);
            setMessage('');
        } catch (err) {
            console.error(err);
            setToastMessage("Error sending messages. Check console.");
        } finally {
            setSending(false);
        }
    };

    const handleScheduleLater = () => {
        setToastMessage("Scheduling system will be available in the next release. For now, use 'Send Now' for immediate dispatch.");
    };

    return (
        <div className="max-w-4xl space-y-6">
            <div className="flex justify-between items-center border-b dark:border-gray-700 pb-4">
                <div className="flex items-center gap-3">
                    <Zap className="h-6 w-6 text-amber-500" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messaging Automation</h2>
                </div>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <button 
                        onClick={() => setChannel('sms')}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${channel === 'sms' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600' : 'text-gray-500'}`}
                    >
                        SMS
                    </button>
                    <button 
                        onClick={() => setChannel('whatsapp')}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${channel === 'whatsapp' ? 'bg-white dark:bg-gray-700 shadow-sm text-green-600' : 'text-gray-500'}`}
                    >
                        WhatsApp
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-bold">New Message Campaign</h3>
                        <p className="text-sm text-gray-500">Reach your candidates via {channel === 'sms' ? 'SMS' : 'WhatsApp'}</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleScheduleLater}
                            className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Calendar size={18} /> Later
                        </button>
                        <button 
                            onClick={handleSendNow}
                            disabled={sending}
                            className="px-6 py-2 text-sm font-bold bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2 shadow-lg shadow-primary-500/20 disabled:opacity-50 active:scale-95"
                        >
                            <Send size={18} /> {sending ? 'Sending...' : 'Send Now'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Target Audience</label>
                            <select 
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
                                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                            >
                                <option value="all">All Users ({users?.length || 0})</option>
                                <option value="inactive">Inactive Users (&gt;30 days)</option>
                                <option value="academic">Academic Partners</option>
                                <option value="candidates">New Candidates (Last 7 days)</option>
                            </select>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase">Message Content</label>
                                <span className={`text-[10px] font-mono ${message.length > MAX_SMS_LENGTH && channel === 'sms' ? 'text-red-500' : 'text-gray-400'}`}>
                                    {message.length}/{channel === 'sms' ? MAX_SMS_LENGTH : 4096} characters
                                </span>
                            </div>
                            <textarea 
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full h-40 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none font-medium text-sm"
                                placeholder="Enter your message here..."
                            />
                            <div className="flex flex-wrap gap-2 mt-2">
                                {tokens.map(token => (
                                    <button 
                                        key={token}
                                        onClick={() => insertToken(token)}
                                        className="text-[10px] font-mono px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-primary-600 rounded border border-transparent hover:border-primary-500/30 transition-all"
                                    >
                                        {token}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-gray-400 uppercase">Quick Templates</label>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar text-sm">
                            {templates.map((t, i) => (
                                <button 
                                    key={i}
                                    onClick={() => setMessage(t.body)}
                                    className="w-full text-left p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-primary-500/50 hover:bg-primary-50/10 transition-all group"
                                >
                                    <p className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-primary-600">{t.name}</p>
                                    <p className="text-[10px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">{t.body}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {toastMessage && (
                <Toast 
                    message={toastMessage} 
                    onClose={() => setToastMessage(null)} 
                />
            )}
        </div>
    );
};

export default MessagingAutomation;
