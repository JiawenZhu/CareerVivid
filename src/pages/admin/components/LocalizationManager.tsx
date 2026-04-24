import React, { useState } from 'react';
import { Globe, Search, Plus, CheckCircle2, AlertCircle, RefreshCcw, X, Save, Trash2, Edit2 } from 'lucide-react';
import Toast from '../../../components/Toast';

interface Locale {
    lang: string;
    code: string;
    status: string;
    coverage: string;
}

interface TranslationKey {
    key: string;
    val: string;
    status: 'ready' | 'pending' | 'missing';
}

const AVAILABLE_LOCALES = [
    { lang: 'German', code: 'de' },
    { lang: 'Japanese', code: 'ja' },
    { lang: 'Portuguese (Brazil)', code: 'pt-BR' },
    { lang: 'Chinese (Simplified)', code: 'zh-CN' },
    { lang: 'Arabic', code: 'ar' },
    { lang: 'Korean', code: 'ko' },
    { lang: 'Dutch', code: 'nl' },
];

const LocalizationManager: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const [locales, setLocales] = useState<Locale[]>([
        { lang: 'English (US)', code: 'en', status: 'Primary', coverage: '100%' },
        { lang: 'Spanish (Latin Am)', code: 'es', status: 'Active', coverage: '92%' },
        { lang: 'French (Canada)', code: 'fr-CA', status: 'Reviewing', coverage: '78%' },
    ]);

    const [keys, setKeys] = useState<TranslationKey[]>([
        { key: 'hero_title', val: 'Build Your Career with Impact', status: 'ready' },
        { key: 'cta_primary', val: 'Apply Today', status: 'ready' },
        { key: 'footer_copyright', val: '© 2026 CareerVivid. All rights reserved.', status: 'pending' },
        { key: 'login_error_invalid', val: 'Invalid credentials. Please try again.', status: 'ready' },
        { key: 'dealer_portal_welcome', val: 'Welcome to the Dealer Network', status: 'missing' },
        { key: 'pricing_headline', val: 'Simple, Transparent Pricing', status: 'ready' },
        { key: 'onboarding_step1', val: 'Upload your resume to get started', status: 'pending' },
    ]);

    // Modals
    const [addLocaleOpen, setAddLocaleOpen] = useState(false);
    const [selectedNewLocale, setSelectedNewLocale] = useState('');
    const [editingKey, setEditingKey] = useState<TranslationKey | null>(null);
    const [editForm, setEditForm] = useState<Partial<TranslationKey>>({});
    const [addKeyOpen, setAddKeyOpen] = useState(false);
    const [newKeyForm, setNewKeyForm] = useState<Partial<TranslationKey>>({ key: '', val: '', status: 'pending' });

    const filteredKeys = keys.filter(k =>
        k.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.val.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddLocale = () => {
        if (!selectedNewLocale) return;
        const locale = AVAILABLE_LOCALES.find(l => l.lang === selectedNewLocale);
        if (!locale) return;
        if (locales.find(l => l.code === locale.code)) {
            setToastMessage(`"${locale.lang}" is already added.`);
            return;
        }
        setLocales([...locales, { lang: locale.lang, code: locale.code, status: 'Draft', coverage: '0%' }]);
        setToastMessage(`Locale "${locale.lang}" added. Start translating keys to build coverage.`);
        setAddLocaleOpen(false);
        setSelectedNewLocale('');
    };

    const handleDeleteLocale = (code: string) => {
        const locale = locales.find(l => l.code === code);
        if (locale?.status === 'Primary') {
            setToastMessage("Cannot remove the primary locale.");
            return;
        }
        setLocales(locales.filter(l => l.code !== code));
        setToastMessage(`Locale removed.`);
    };

    const openEditKey = (k: TranslationKey) => {
        setEditForm({ ...k });
        setEditingKey(k);
    };

    const handleSaveKey = () => {
        if (!editForm.key?.trim() || !editForm.val?.trim()) return;
        setKeys(keys.map(k => k.key === editingKey?.key ? { ...k, ...editForm } as TranslationKey : k));
        setToastMessage(`Key "${editForm.key}" updated.`);
        setEditingKey(null);
    };

    const handleDeleteKey = (key: string) => {
        setKeys(keys.filter(k => k.key !== key));
        setToastMessage(`Key "${key}" deleted.`);
        setEditingKey(null);
    };

    const handleAddKey = () => {
        if (!newKeyForm.key?.trim() || !newKeyForm.val?.trim()) return;
        if (keys.find(k => k.key === newKeyForm.key)) {
            setToastMessage(`Key "${newKeyForm.key}" already exists.`);
            return;
        }
        setKeys([...keys, { key: newKeyForm.key!, val: newKeyForm.val!, status: newKeyForm.status || 'pending' }]);
        setToastMessage(`Key "${newKeyForm.key}" added.`);
        setAddKeyOpen(false);
        setNewKeyForm({ key: '', val: '', status: 'pending' });
    };

    const statusColor = (s: string) => {
        if (s === 'ready') return 'text-green-600';
        if (s === 'pending') return 'text-amber-600';
        return 'text-red-600';
    };

    const StatusIcon = ({ s }: { s: string }) => {
        if (s === 'ready') return <CheckCircle2 size={14} className="text-green-500" />;
        if (s === 'pending') return <RefreshCcw size={14} className="text-amber-500" />;
        return <AlertCircle size={14} className="text-red-500" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Globe className="h-6 w-6 text-primary-500" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Localization &amp; Translation</h2>
                </div>
                <button
                    onClick={() => setAddLocaleOpen(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm font-medium shadow-sm transition-all active:scale-95"
                >
                    <Plus size={18} /> Add Locale
                </button>
            </div>

            {/* Language Health Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {locales.map((l, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-primary-500/50 transition-all group">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h4 className="font-bold text-sm">{l.lang}</h4>
                                <span className="text-[10px] text-gray-400 font-mono uppercase">{l.code}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">{l.status}</span>
                                {l.status !== 'Primary' && (
                                    <button
                                        onClick={() => handleDeleteLocale(l.code)}
                                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-500 rounded-full transition-all duration-1000" style={{ width: l.coverage }} />
                            </div>
                            <span className="text-xs font-bold text-gray-500">{l.coverage}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Translation Key Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between gap-4">
                    <h3 className="font-bold shrink-0">Content Keys</h3>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search keys..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setAddKeyOpen(true)}
                        className="shrink-0 px-3 py-1.5 text-xs font-bold bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 rounded-lg flex items-center gap-1 transition-all"
                    >
                        <Plus size={14} /> Add Key
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Key ID</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Default (EN)</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredKeys.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-500 italic text-sm">No keys match your search.</td></tr>
                            ) : filteredKeys.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group">
                                    <td className="p-4 font-mono text-[10px] text-gray-500">{row.key}</td>
                                    <td className="p-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">{row.val}</td>
                                    <td className="p-4">
                                        <span className={`flex items-center gap-1 text-xs font-medium ${statusColor(row.status)}`}>
                                            <StatusIcon s={row.status} />
                                            {row.status === 'ready' ? 'Ready' : row.status === 'pending' ? 'Pending Review' : 'Missing Translation'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => openEditKey(row)}
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-primary-500"
                                            title="Edit key"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Locale Modal */}
            {addLocaleOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setAddLocaleOpen(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">Add a New Locale</h3>
                            <button onClick={() => setAddLocaleOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Language</label>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {AVAILABLE_LOCALES.map(l => (
                                    <label key={l.code} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedNewLocale === l.lang ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                                        <input
                                            type="radio"
                                            name="locale"
                                            value={l.lang}
                                            checked={selectedNewLocale === l.lang}
                                            onChange={() => setSelectedNewLocale(l.lang)}
                                            className="accent-primary-600"
                                        />
                                        <span className="font-medium text-sm">{l.lang}</span>
                                        <span className="ml-auto text-xs text-gray-400 font-mono uppercase">{l.code}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setAddLocaleOpen(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                            <button onClick={handleAddLocale} disabled={!selectedNewLocale} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 disabled:opacity-50 transition-all active:scale-95">Add Locale</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Key Modal */}
            {editingKey && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditingKey(null)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">Edit Key</h3>
                            <button onClick={() => setEditingKey(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Key ID</label>
                                <input
                                    type="text"
                                    value={editForm.key || ''}
                                    onChange={(e) => setEditForm({ ...editForm, key: e.target.value })}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Value (EN)</label>
                                <textarea
                                    rows={3}
                                    value={editForm.val || ''}
                                    onChange={(e) => setEditForm({ ...editForm, val: e.target.value })}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                                <select
                                    value={editForm.status || 'pending'}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TranslationKey['status'] })}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-sm"
                                >
                                    <option value="ready">Ready</option>
                                    <option value="pending">Pending Review</option>
                                    <option value="missing">Missing Translation</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleDeleteKey(editingKey.key)}
                                className="p-2.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete key"
                            >
                                <Trash2 size={16} />
                            </button>
                            <button onClick={() => setEditingKey(null)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveKey} disabled={!editForm.key?.trim() || !editForm.val?.trim()} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95">
                                <Save size={14} /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Key Modal */}
            {addKeyOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setAddKeyOpen(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">Add Translation Key</h3>
                            <button onClick={() => setAddKeyOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Key ID *</label>
                                <input
                                    type="text"
                                    value={newKeyForm.key || ''}
                                    onChange={(e) => setNewKeyForm({ ...newKeyForm, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm font-mono"
                                    placeholder="e.g. nav_signup_cta"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Default Value (EN) *</label>
                                <textarea
                                    rows={2}
                                    value={newKeyForm.val || ''}
                                    onChange={(e) => setNewKeyForm({ ...newKeyForm, val: e.target.value })}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                                    placeholder="The English text value..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setAddKeyOpen(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                            <button onClick={handleAddKey} disabled={!newKeyForm.key?.trim() || !newKeyForm.val?.trim()} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 disabled:opacity-50 transition-all active:scale-95">Add Key</button>
                        </div>
                    </div>
                </div>
            )}

            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
        </div>
    );
};

export default LocalizationManager;
