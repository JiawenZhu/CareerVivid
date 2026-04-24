import React, { useState } from 'react';
import { Layout, Plus, Search, Filter, ExternalLink, MoreVertical, Copy, Palette, X, Trash2, Save, Check } from 'lucide-react';
import Toast from '../../../components/Toast';

interface Template {
    id: number;
    name: string;
    category: string;
    usage: number;
    color: string;
    description?: string;
    url?: string;
}

const CATEGORIES = ['General', 'Construction', 'B2B', 'Operations', 'Partners', 'Draft'];
const COLORS = [
    { label: 'Amber', value: 'bg-amber-500' },
    { label: 'Blue', value: 'bg-blue-500' },
    { label: 'Emerald', value: 'bg-emerald-500' },
    { label: 'Indigo', value: 'bg-indigo-500' },
    { label: 'Rose', value: 'bg-rose-500' },
    { label: 'Purple', value: 'bg-purple-500' },
    { label: 'Gray', value: 'bg-gray-500' },
];

const LandingPageTemplates: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [templates, setTemplates] = useState<Template[]>([
        { id: 1, name: 'Lead Magnet v1', category: 'Construction', usage: 12, color: 'bg-amber-500', description: 'Capture leads from construction professionals.', url: 'https://careervivid.app/lp/lead-magnet' },
        { id: 2, name: 'Event Registration', category: 'General', usage: 45, color: 'bg-blue-500', description: 'Register attendees for CareerVivid events.', url: 'https://careervivid.app/lp/events' },
        { id: 3, name: 'Product Showcase', category: 'B2B', usage: 8, color: 'bg-emerald-500', description: 'Showcase CareerVivid platform to business clients.', url: '' },
        { id: 4, name: 'Dealer Onboarding', category: 'Operations', usage: 124, color: 'bg-indigo-500', description: 'Onboard new dealer partners quickly.', url: 'https://careervivid.app/lp/dealer' },
        { id: 5, name: 'Partner Promo', category: 'Partners', usage: 31, color: 'bg-rose-500', description: 'Promotional page for academic and business partners.', url: '' },
    ]);

    // Modal state
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
    const [menuOpen, setMenuOpen] = useState<number | null>(null);

    // Form state (shared for create + edit)
    const [formData, setFormData] = useState<Partial<Template>>({});

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openCreate = () => {
        setFormData({ name: '', category: 'General', color: 'bg-blue-500', description: '', url: '' });
        setIsCreating(true);
    };

    const openEdit = (t: Template) => {
        setFormData({ ...t });
        setEditingTemplate(t);
        setMenuOpen(null);
    };

    const handleSave = () => {
        if (!formData.name?.trim()) return;
        if (isCreating) {
            const newTemplate: Template = {
                id: Date.now(),
                name: formData.name!,
                category: formData.category || 'General',
                color: formData.color || 'bg-blue-500',
                description: formData.description || '',
                url: formData.url || '',
                usage: 0,
            };
            setTemplates([newTemplate, ...templates]);
            setToastMessage(`Template "${newTemplate.name}" created successfully.`);
            setIsCreating(false);
        } else if (editingTemplate) {
            setTemplates(templates.map(t => t.id === editingTemplate.id ? { ...t, ...formData } as Template : t));
            setToastMessage(`Template "${formData.name}" updated.`);
            setEditingTemplate(null);
        }
        setFormData({});
    };

    const handleDuplicate = (t: Template) => {
        const dup: Template = { ...t, id: Date.now(), name: `${t.name} (Copy)`, usage: 0 };
        setTemplates([dup, ...templates]);
        setToastMessage(`"${t.name}" duplicated.`);
        setMenuOpen(null);
    };

    const handleDelete = (id: number) => {
        const t = templates.find(t => t.id === id);
        setTemplates(templates.filter(t => t.id !== id));
        setToastMessage(`"${t?.name}" deleted.`);
        setMenuOpen(null);
    };

    const isModalOpen = isCreating || !!editingTemplate;

    return (
        <div className="space-y-6" onClick={() => setMenuOpen(null)}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Layout className="h-6 w-6 text-primary-500" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Landing Page Template Library</h2>
                </div>
                <button
                    onClick={openCreate}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm font-medium shadow-sm transition-all active:scale-95"
                >
                    <Plus size={18} /> Create Template
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    {CATEGORIES.slice(0, 4).map(cat => (
                        <button
                            key={cat}
                            onClick={(e) => { e.stopPropagation(); setSearchQuery(searchQuery === cat ? '' : cat); }}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${searchQuery === cat ? 'bg-primary-600 text-white' : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-500 italic">No templates found.</div>
                ) : filteredTemplates.map((t) => (
                    <div key={t.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-md transition-all">
                        {/* Preview thumbnail */}
                        <div className={`h-36 ${t.color} opacity-80 group-hover:opacity-100 transition-opacity flex items-center justify-center relative`}>
                            <Layout size={40} className="text-white opacity-20" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <div className="absolute bottom-3 left-3 flex gap-2">
                                <span className="text-[10px] px-2 py-0.5 bg-black/50 text-white rounded backdrop-blur-md uppercase font-bold tracking-widest">{t.category}</span>
                            </div>
                            {/* Actions overlay */}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setPreviewTemplate(t); }}
                                    className="p-1.5 bg-white/90 rounded-lg text-gray-700 hover:text-primary-600 transition-colors shadow-sm"
                                    title="Preview"
                                >
                                    <ExternalLink size={14} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDuplicate(t); }}
                                    className="p-1.5 bg-white/90 rounded-lg text-gray-700 hover:text-primary-600 transition-colors shadow-sm"
                                    title="Duplicate"
                                >
                                    <Copy size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-gray-900 dark:text-white">{t.name}</h3>
                                <div className="relative" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => setMenuOpen(menuOpen === t.id ? null : t.id)}
                                        className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                    {menuOpen === t.id && (
                                        <div className="absolute right-0 top-7 z-10 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden text-sm">
                                            <button onClick={() => openEdit(t)} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200">Edit</button>
                                            <button onClick={() => handleDuplicate(t)} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200">Duplicate</button>
                                            <button onClick={() => handleDelete(t.id)} className="w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2">Delete</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {t.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{t.description}</p>}
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-400">Used {t.usage} times</p>
                            </div>
                            <button
                                onClick={() => openEdit(t)}
                                className="w-full mt-3 py-2 border border-primary-100 dark:border-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg text-xs font-bold hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors active:scale-95"
                            >
                                Edit Template
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setIsCreating(false); setEditingTemplate(null); }}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">{isCreating ? 'Create New Template' : `Edit: ${editingTemplate?.name}`}</h3>
                            <button onClick={() => { setIsCreating(false); setEditingTemplate(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Template Name *</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                    placeholder="e.g. Summer Campaign 2026"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                                    <select
                                        value={formData.category || 'General'}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-sm"
                                    >
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Color</label>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {COLORS.map(c => (
                                            <button
                                                key={c.value}
                                                onClick={() => setFormData({ ...formData, color: c.value })}
                                                className={`w-6 h-6 rounded-full ${c.value} transition-all ${formData.color === c.value ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : 'opacity-60 hover:opacity-100'}`}
                                                title={c.label}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                                    placeholder="Brief description of this template..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Landing Page URL</label>
                                <input
                                    type="url"
                                    value={formData.url || ''}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                    placeholder="https://careervivid.app/lp/..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => { setIsCreating(false); setEditingTemplate(null); }}
                                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!formData.name?.trim()}
                                className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <Save size={16} /> {isCreating ? 'Create Template' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPreviewTemplate(null)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">{previewTemplate.name}</h3>
                            <button onClick={() => setPreviewTemplate(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className={`h-40 ${previewTemplate.color} rounded-xl flex items-center justify-center`}>
                            <Layout size={48} className="text-white opacity-30" />
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex gap-2">
                                <span className="text-gray-500 w-24">Category:</span>
                                <span className="font-medium">{previewTemplate.category}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-gray-500 w-24">Used:</span>
                                <span className="font-medium">{previewTemplate.usage} times</span>
                            </div>
                            {previewTemplate.description && (
                                <div className="flex gap-2">
                                    <span className="text-gray-500 w-24">Description:</span>
                                    <span>{previewTemplate.description}</span>
                                </div>
                            )}
                            {previewTemplate.url && (
                                <div className="flex gap-2">
                                    <span className="text-gray-500 w-24">URL:</span>
                                    <a href={previewTemplate.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate">{previewTemplate.url}</a>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => { setPreviewTemplate(null); openEdit(previewTemplate); }} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Edit</button>
                            {previewTemplate.url && (
                                <a href={previewTemplate.url} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-all flex items-center justify-center gap-2">
                                    Open Page <ExternalLink size={14} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
        </div>
    );
};

export default LandingPageTemplates;
