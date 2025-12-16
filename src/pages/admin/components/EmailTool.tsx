import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Send, Loader2, CheckCircle, AlertCircle, Wand2, FileText, User, Users, Plus, Trash2, Save, Code } from 'lucide-react';
import { useUsers } from '../hooks';
import { EMAIL_TEMPLATES as SYSTEM_TEMPLATES, EmailTemplate } from './EmailTemplates';
import AIImprovementPanel from '../../../components/AIImprovementPanel';
import { useAuth } from '../../../contexts/AuthContext';
import AutoResizeTextarea from '../../../components/AutoResizeTextarea';

export default function EmailTool() {
    const { currentUser } = useAuth();
    const { users, loading: usersLoading } = useUsers();

    // Email State
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [sendToAll, setSendToAll] = useState(false);

    // Template State
    const [customTemplates, setCustomTemplates] = useState<EmailTemplate[]>([]);
    const [templatesLoading, setTemplatesLoading] = useState(true);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);

    // Suggestion State
    const [showSuggestions, setShowSuggestions] = useState(false);

    // AI State
    const [aiActive, setAiActive] = useState(false);
    const [alertState, setAlertState] = useState<{ isOpen: boolean, title: string, message: string }>({ isOpen: false, title: '', message: '' });

    // Fetch Custom Templates & Handle URL Params and LocalStorage
    useEffect(() => {
        // Handle URL Params for deep linking
        const searchParams = new URLSearchParams(window.location.search);
        const urlTo = searchParams.get('to');
        const urlTemplateId = searchParams.get('templateId');

        // Set 'To' field: URL param has priority over local storage
        if (urlTo) {
            setTo(urlTo);
        } else {
            const savedEmail = localStorage.getItem('last_admin_email_to');
            if (savedEmail) setTo(savedEmail);
        }

        const q = query(collection(db, 'email_templates'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const temps = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as EmailTemplate));
            setCustomTemplates(temps);
            setTemplatesLoading(false);

            // Apply Template if requested via URL
            if (urlTemplateId) {
                // Check System Templates first
                const systemTemplate = SYSTEM_TEMPLATES.find(t => t.id === urlTemplateId);
                if (systemTemplate) {
                    setSubject(systemTemplate.subject);
                    setMessage(systemTemplate.html);
                } else {
                    // Check Custom Templates
                    const customTemplate = temps.find(t => t.id === urlTemplateId);
                    if (customTemplate) {
                        setSubject(customTemplate.subject);
                        setMessage(customTemplate.html);
                    }
                }
            }
        }, (error) => {
            console.error("Error fetching templates:", error);
            setTemplatesLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredUsers = useMemo(() => {
        if (!to || sendToAll) return [];
        const lowerTerm = to.toLowerCase();

        // Support for :all command
        if (lowerTerm === ':all') {
            return users;
        }

        return users.filter(u => {
            // Defensive checks for null/undefined fields
            const emailMatch = u.email && typeof u.email === 'string' && u.email.toLowerCase().includes(lowerTerm);
            const nameMatch = u.displayName && typeof u.displayName === 'string' && u.displayName.toLowerCase().includes(lowerTerm);
            return emailMatch || nameMatch;
        }).slice(0, 5);
    }, [to, users, sendToAll]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if (sendToAll) {
            const confirmCount = users.length;
            if (!window.confirm(`Are you sure you want to send this email to ALL ${confirmCount} users?`)) {
                return;
            }
        }

        setLoading(true);
        setStatus(null);

        try {
            const emailData = {
                message: {
                    subject: subject,
                    html: message.replace(/\n/g, '<br>'),
                    text: message
                },
                createdAt: serverTimestamp()
            };

            const mailCollection = collection(db, 'mail');

            if (sendToAll) {
                // Batch send to all users
                const promises = users.map(user =>
                    addDoc(mailCollection, {
                        ...emailData,
                        to: user.email
                    })
                );
                await Promise.all(promises);
                setStatus({ type: 'success', msg: `Email queued for all ${users.length} users.` });
            } else {
                // Single send
                await addDoc(mailCollection, {
                    ...emailData,
                    to: to
                });
                // Update local storage with latest email
                localStorage.setItem('last_admin_email_to', to);
                setStatus({ type: 'success', msg: `Email queued for ${to}` });
            }

            // Reset Form (keep subject/message if it was a bulk send? No, usually safer to clear)
            setTo('');
            if (!sendToAll) {
                // Optional: keep content
            }
        } catch (error: any) {
            console.error("Error sending email:", error);
            setStatus({ type: 'error', msg: "Failed to queue email: " + error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTemplate = async () => {
        if (!subject || !message) {
            alert("Please enter a subject and message to save as a template.");
            return;
        }

        const name = prompt("Enter a name for this template:");
        if (!name) return;

        setIsSavingTemplate(true);
        try {
            await addDoc(collection(db, 'email_templates'), {
                name,
                subject,
                html: message, // Saving raw message as 'html' content string
                createdAt: serverTimestamp()
            });
            setStatus({ type: 'success', msg: "Template saved successfully!" });
        } catch (error: any) {
            console.error("Error saving template:", error);
            setStatus({ type: 'error', msg: "Failed to save template." });
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("Delete this template?")) return;
        try {
            await deleteDoc(doc(db, 'email_templates', id));
        } catch (error) {
            console.error("Error deleting template:", error);
        }
    };

    const applyTemplate = (template: EmailTemplate) => {
        if (subject || message) {
            if (!window.confirm('Replace current content with template?')) return;
        }
        setSubject(template.subject);
        setMessage(template.html);
    };

    const handleFormatHTML = () => {
        if (!message) return;
        let formatted = message;
        // 1. Collapse multiple spaces to single (optional, maybe risky for pre tags, but good for messy html)
        // formatted = formatted.replace(/\s+/g, ' '); 

        // 2. Add newlines BEFORE block opening tags
        formatted = formatted.replace(/(<(div|ul|ol|li|h[1-6]|p|blockquote|br|table|tr)[^>]*>)/gi, '\n$1');

        // 3. Add newlines AFTER block closing tags
        formatted = formatted.replace(/(<\/(div|ul|ol|li|h[1-6]|p|blockquote|table|tr)>)/gi, '$1\n');

        // 4. Clean up double newlines
        formatted = formatted.replace(/\n\s*\n/g, '\n');

        setMessage(formatted.trim());
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 border-b dark:border-gray-700 pb-4">
                <Send className="w-6 h-6 text-primary-600" />
                Send Custom Email
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSend} className="space-y-4">
                        {/* Recipient Input with Autocomplete */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recipient</label>

                            {/* Send to All Toggle */}
                            <div className="mb-4 flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
                                <input
                                    type="checkbox"
                                    id="sendToAll"
                                    checked={sendToAll}
                                    onChange={(e) => {
                                        setSendToAll(e.target.checked);
                                        if (e.target.checked) setTo('');
                                    }}
                                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                />
                                <label htmlFor="sendToAll" className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2 cursor-pointer select-none">
                                    <Users size={16} /> Send to ALL Users ({users.length})
                                </label>
                            </div>

                            {!sendToAll && (
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        required={!sendToAll}
                                        value={to}
                                        onChange={(e) => { setTo(e.target.value); setShowSuggestions(true); }}
                                        onFocus={() => setShowSuggestions(true)}
                                        // Delay hiding to allow click
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        placeholder="Search user by email or name..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />

                                    {/* Suggestions Dropdown */}
                                    {showSuggestions && to && filteredUsers.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                                            {filteredUsers.map(user => (
                                                <button
                                                    key={user.uid}
                                                    type="button"
                                                    onClick={() => { setTo(user.email); setShowSuggestions(false); }}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex flex-col"
                                                >
                                                    <span className="font-medium text-gray-900 dark:text-white">{user.email}</span>
                                                    {user.displayName && <span className="text-xs text-gray-500 dark:text-gray-400">{user.displayName}</span>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                            <input
                                type="text"
                                required
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Subject line..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message (HTML/Text)</label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleFormatHTML}
                                        className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors"
                                        title="Pretty format HTML"
                                    >
                                        <Code size={12} /> Format HTML
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAiActive(!aiActive)}
                                        className="text-xs flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium transition-colors"
                                    >
                                        <Wand2 size={12} /> {aiActive ? 'Close AI' : 'Edit with AI'}
                                    </button>
                                </div>
                            </div>

                            <AutoResizeTextarea
                                required
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message here..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                                minHeight={300}
                            />

                            {/* AI Panel */}
                            {aiActive && currentUser && (
                                <AIImprovementPanel
                                    userId={currentUser.uid}
                                    sectionName="Email Body"
                                    currentText={message}
                                    language="English"
                                    onAccept={(text) => { setMessage(text); setAiActive(false); }}
                                    onClose={() => setAiActive(false)}
                                    onError={(t, m) => setAlertState({ isOpen: true, title: t, message: m })}
                                    contextType="email"
                                />
                            )}
                        </div>

                        {status && (
                            <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                                {status.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {status.msg}
                            </div>
                        )}

                        <div className="flex justify-between pt-2">
                            <button
                                type="button"
                                onClick={handleSaveTemplate}
                                disabled={isSavingTemplate || !subject || !message}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md font-medium text-sm transition-colors disabled:opacity-50"
                            >
                                {isSavingTemplate ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={16} />}
                                Save as Template
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {loading && <Loader2 className="animate-spin w-4 h-4" />}
                                Send Email
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right Column: Templates */}
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700 h-fit max-h-[700px] overflow-y-auto">
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2 sticky top-0 bg-gray-50 dark:bg-gray-700/30 pb-2 z-10">
                        <FileText size={16} /> Templates
                    </h3>

                    {/* Custom Templates Section */}
                    {customTemplates.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 uppercase">Custom</h4>
                            <div className="space-y-2">
                                {customTemplates.map(template => (
                                    <div key={template.id} className="relative group">
                                        <button
                                            type="button"
                                            onClick={() => applyTemplate(template)}
                                            className="w-full text-left p-3 pr-8 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-900 rounded-md hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-sm transition-all"
                                        >
                                            <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                                                {template.name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                                {template.subject}
                                            </div>
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteTemplate(template.id, e)}
                                            className="absolute right-2 top-3 p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete Template"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* System Templates Section */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 uppercase">System</h4>
                        <div className="space-y-2">
                            {SYSTEM_TEMPLATES.map(template => (
                                <button
                                    key={template.id}
                                    type="button"
                                    onClick={() => applyTemplate(template)}
                                    className="w-full text-left p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-sm transition-all group"
                                >
                                    <div className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 text-sm">
                                        {template.name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                        {template.subject}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 text-xs text-gray-400 px-1">
                        Click a template to populate the form.
                    </div>
                </div>
            </div>

            {/* Error Modal for AI */}
            {alertState.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-sm w-full shadow-xl">
                        <h3 className="text-lg font-bold text-red-600 mb-2">{alertState.title}</h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">{alertState.message}</p>
                        <button
                            onClick={() => setAlertState({ isOpen: false, title: '', message: '' })}
                            className="w-full py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
