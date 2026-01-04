import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, ExternalLink, Upload, Image as ImageIcon, Tag, Link as LinkIcon, Palette, QrCode, MessageCircle } from 'lucide-react';
import { FaTiktok, FaWeixin, FaFacebookF } from 'react-icons/fa';
import { PortfolioData, LinkInBioButton } from '../../types/portfolio';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LinksEditorProps {
    linkInBio: PortfolioData['linkInBio'];
    onUpdate: (data: PortfolioData['linkInBio']) => void;
    theme: 'light' | 'dark';
    onImageUploadTrigger?: (field: string) => void;
}

// --- Option Mappings ---

const ICON_OPTIONS = [
    { value: '', label: 'No Icon', icon: <div className="w-4 h-4 rounded-full border border-current opacity-40" /> },
    { value: 'Tiktok', label: 'TikTok', icon: <FaTiktok size={14} /> },
    { value: 'Github', label: 'GitHub', icon: <div className="i-lucide-github" /> }, // Will use Lucide icons dynamically rendered
    { value: 'Linkedin', label: 'LinkedIn', icon: null },
    { value: 'Twitter', label: 'Twitter/X', icon: null },
    { value: 'Instagram', label: 'Instagram', icon: null },
    { value: 'Youtube', label: 'YouTube', icon: null },
    { value: 'Facebook', label: 'Facebook', icon: <FaFacebookF size={14} /> },
    { value: 'Wechat', label: 'WeChat', icon: <FaWeixin size={14} /> },
    { value: 'Venmo', label: 'Venmo', icon: <div className="w-4 h-4 flex items-center justify-center font-bold text-[10px] border border-current rounded-full">V</div> },
    { value: 'Weibo', label: 'Weibo', icon: null },
    { value: 'Douyin', label: 'Douyin', icon: null },
    { value: 'Globe', label: 'Website', icon: <ExternalLink size={14} /> },
    { value: 'Mail', label: 'Message', icon: <MessageCircle size={14} /> }, // Was 'Email' - now interactive Message
    { value: 'FileText', label: 'Resume', icon: <Tag size={14} /> }
];

// Helper to get actual Lucide icon component by name string
// In a real app we might want to map these explicitly to imported components
// For now, we reuse the pattern seen elsewhere or just simple text/emoji if imports are missing
// But wait, user wants VISUAL.
// I need to import specific icons from lucide-react.
// Since I can't easily dynamic import, I'll add them to the main import.

// --- Rich Select Component ---
interface RichSelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
    preview?: React.ReactNode;
}

const RichSelect = ({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    themeClasses,
    isOpen,
    onToggle
}: {
    value: string;
    onChange: (val: string) => void;
    options: RichSelectOption[];
    placeholder?: string;
    themeClasses: any;
    isOpen: boolean;
    onToggle: () => void;
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onToggle();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onToggle]);

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                }}
                className={`w-full flex items-center justify-between text-left rounded-lg px-3 py-2.5 text-sm border transition-all outline-none 
                    ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'hover:border-indigo-500/50'} 
                    ${themeClasses.inputBg} h-11`}
            >
                <div className="flex items-center gap-2.5 overflow-hidden">
                    {selectedOption?.icon && <span className="shrink-0 text-gray-500">{selectedOption.icon}</span>}
                    {selectedOption?.preview && <span className="shrink-0">{selectedOption.preview}</span>}
                    <span className={`font-medium ${!selectedOption ? 'text-gray-400' : ''}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                {/* Chevron */}
                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className={`absolute left-0 right-0 top-full mt-2 rounded-xl border shadow-xl shadow-indigo-500/10 z-50 max-h-60 overflow-y-auto ${themeClasses.inputBg} py-1.5 animate-in fade-in zoom-in-95 duration-100`}>
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(option.value);
                                onToggle(); // Close on select
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left group
                                ${value === option.value ? 'bg-indigo-500/5 text-indigo-500 font-medium' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'}
                            `}
                        >
                            {/* Checkmark for selected */}
                            <div className={`w-4 h-4 shrink-0 flex items-center justify-center transition-opacity ${value === option.value ? 'opacity-100' : 'opacity-0'}`}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            {option.icon && <span className={`shrink-0 ${value === option.value ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`}>{option.icon}</span>}
                            {option.preview && <span className="shrink-0 scale-90">{option.preview}</span>}
                            <span className="">{option.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};


const SortableLinkItem = ({
    link,
    idx,
    themeClasses,
    handleUpdateLink,
    handleDeleteLink,
    onImageUploadTrigger
}: {
    link: LinkInBioButton;
    idx: number;
    themeClasses: any;
    handleUpdateLink: (id: string, updates: Partial<LinkInBioButton>) => void;
    handleDeleteLink: (id: string) => void;
    onImageUploadTrigger?: (field: string) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: link.id });

    // Track active dropdown to fix z-index stacking context
    const [activeDropdown, setActiveDropdown] = useState<'style' | 'icon' | null>(null);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : (activeDropdown ? 40 : 1),
        opacity: isDragging ? 0.5 : 1,
    };

    // --- Dynamic Options ---
    // Icons
    const iconOptions: RichSelectOption[] = [
        { value: '', label: 'No Icon', icon: <div className="w-4 h-4 rounded border border-dashed border-gray-400" /> },
        { value: 'Tiktok', label: 'TikTok', icon: <FaTiktok size={14} /> },
        { value: 'Github', label: 'GitHub', icon: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.08-.73.08-.73 1.2.09 1.83 1.23 1.83 1.23 1.07 1.84 2.8 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.46-2.38 1.23-3.22-.12-.3-.54-1.52.12-3.16 0 0 1.0-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.64.24 2.87.12 3.16.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.62-5.47 5.92.43.37.81 1.1.81 2.22l-.01 3.29c0 .31.22.69.82.57A12 12 0 0 0 12 .29z" /></svg> },
        { value: 'Linkedin', label: 'LinkedIn', icon: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg> },
        { value: 'Twitter', label: 'Twitter/X', icon: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /></svg> },
        { value: 'Instagram', label: 'Instagram', icon: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg> },
        { value: 'Youtube', label: 'YouTube', icon: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg> },
        { value: 'Facebook', label: 'Facebook', icon: <FaFacebookF size={14} /> },
        { value: 'Wechat', label: 'WeChat', icon: <FaWeixin size={14} /> },
        { value: 'Venmo', label: 'Venmo', icon: <div className="w-4 h-4 flex items-center justify-center font-bold text-[10px] border border-current rounded-full">V</div> },
        { value: 'Weibo', label: 'Weibo', icon: <div className="w-4 h-4 flex items-center justify-center font-bold text-[10px] border border-current rounded-full">W</div> },
        { value: 'Douyin', label: 'Douyin', icon: <div className="w-4 h-4 flex items-center justify-center font-bold text-[10px] border border-current rounded-full">D</div> },
        { value: 'Globe', label: 'Website', icon: <ExternalLink size={14} /> },
        { value: 'Mail', label: 'Email', icon: <LinkIcon size={14} /> },
        { value: 'FileText', label: 'Resume', icon: <Tag size={14} /> }
    ];

    // Styles
    const styleOptions: RichSelectOption[] = [
        { value: 'primary', label: 'Primary (Filled)', preview: <div className="w-6 h-4 bg-indigo-500 rounded" /> },
        { value: 'secondary', label: 'Secondary (Muted)', preview: <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded" /> },
        { value: 'outline', label: 'Outline', preview: <div className="w-6 h-4 border border-indigo-500 rounded" /> },
        { value: 'ghost', label: 'Ghost (Text)', preview: <div className="w-6 h-4 flex items-center justify-center text-[8px] text-gray-500 font-bold">ABC</div> },
        { value: 'custom', label: 'Custom', preview: <div className="w-6 h-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded" /> },
    ];


    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`p-3 rounded-lg border group relative transition-colors ${themeClasses.cardBg} ${isDragging ? 'border-indigo-500 ring-2 ring-indigo-500/20' : ''}`}
        >
            {/* Action: Delete */}
            <div className="absolute top-2 right-2 flex gap-1 z-20">
                <button
                    onClick={() => handleDeleteLink(link.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded transition-colors"
                    title="Delete Link"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            <div className="flex gap-3">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="pt-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-grab active:cursor-grabbing touch-none flex flex-col items-center justify-start h-full"
                    title="Drag to reorder"
                >
                    <GripVertical size={20} />
                </div>

                <div className="flex-1 space-y-3">
                    {/* Label */}
                    <div>
                        <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
                            <Tag size={12} /> Label
                        </label>
                        <input
                            value={link.label}
                            onChange={(e) => handleUpdateLink(link.id, { label: e.target.value })}
                            className={`w-full rounded px-3 py-2 text-sm outline-none border focus:border-indigo-500 transition-colors ${themeClasses.inputBg}`}
                            placeholder="My Cool Link"
                        />
                    </div>

                    {/* URL */}
                    <div>
                        <div>
                            <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
                                {(link.icon === 'Wechat' || link.icon === 'Venmo') ? <QrCode size={12} /> : <LinkIcon size={12} />}
                                {(link.icon === 'Wechat' || link.icon === 'Venmo') ? 'QR Code Image' : 'URL'}
                            </label>
                            {(link.icon === 'Wechat' || link.icon === 'Venmo') ? (
                                <div className="flex items-center gap-2">
                                    <div className={`flex-1 flex items-center gap-2 p-2 rounded border ${themeClasses.inputBg}`}>
                                        {link.url && link.url.startsWith('http') ? (
                                            <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden shrink-0">
                                                <img src={link.url} alt="QR" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                                                <ImageIcon size={14} className="text-gray-400" />
                                            </div>
                                        )}
                                        <span className="text-xs flex-1 text-gray-500">
                                            {link.url && link.url.startsWith('http') ? 'QR Code Uploaded' : 'No QR Code'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => onImageUploadTrigger && onImageUploadTrigger(`linkInBio.links.${idx}.url`)}
                                        className="px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded text-xs font-medium transition-colors flex items-center gap-1"
                                    >
                                        <Upload size={14} /> Upload
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        value={link.url}
                                        onChange={(e) => handleUpdateLink(link.id, { url: e.target.value })}
                                        className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none border focus:border-indigo-500 transition-colors ${themeClasses.inputBg} pl-9 h-10`}
                                        placeholder="https://"
                                    />
                                    <ExternalLink size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                </div>
                            )}
                        </div>

                        {/* Style & Icon Options using RichSelect - Vertical stack for more space */}
                        <div className="grid grid-cols-1 gap-4 mt-3">
                            <div>
                                <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
                                    <Palette size={12} /> Style
                                </label>
                                <RichSelect
                                    value={link.variant}
                                    onChange={(val) => handleUpdateLink(link.id, { variant: val as any })}
                                    options={styleOptions}
                                    themeClasses={themeClasses}
                                    isOpen={activeDropdown === 'style'}
                                    onToggle={() => setActiveDropdown(activeDropdown === 'style' ? null : 'style')}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full border border-current" /> Icon
                                </label>
                                <RichSelect
                                    value={link.icon || ''}
                                    onChange={(val) => handleUpdateLink(link.id, { icon: val })}
                                    options={iconOptions}
                                    themeClasses={themeClasses}
                                    isOpen={activeDropdown === 'icon'}
                                    onToggle={() => setActiveDropdown(activeDropdown === 'icon' ? null : 'icon')}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LinksEditor: React.FC<LinksEditorProps> = ({ linkInBio, onUpdate, theme, onImageUploadTrigger }) => {
    if (!linkInBio) return null;

    const themeClasses = {
        cardBg: theme === 'dark' ? 'bg-[#1a1d24] border-white/5' : 'bg-gray-50 border-gray-200',
        inputBg: theme === 'dark' ? 'bg-[#0f1117] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900',
        textMain: theme === 'dark' ? 'text-white' : 'text-gray-900',
        textMuted: 'text-gray-500'
    };

    // Sensor Configuration for better UX
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Requires 5px drag to activate (prevents accidental clicks)
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleAddLink = () => {
        const newLink: LinkInBioButton = {
            id: Date.now().toString(),
            label: 'New Link',
            url: 'https://',
            variant: 'primary',
            enabled: true,
            order: (linkInBio.links?.length || 0) + 1
        };
        const newLinks = [...(linkInBio.links || []), newLink];
        onUpdate({ ...linkInBio, links: newLinks });
    };

    const handleUpdateLink = (id: string, updates: Partial<LinkInBioButton>) => {
        const newLinks = linkInBio.links.map(link =>
            link.id === id ? { ...link, ...updates } : link
        );
        onUpdate({ ...linkInBio, links: newLinks });
    };

    const handleDeleteLink = (id: string) => {
        const newLinks = linkInBio.links.filter(link => link.id !== id);
        onUpdate({ ...linkInBio, links: newLinks });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id && linkInBio.links) {
            const oldIndex = linkInBio.links.findIndex((item) => item.id === active.id);
            const newIndex = linkInBio.links.findIndex((item) => item.id === over?.id);

            const newLinks = arrayMove(linkInBio.links, oldIndex, newIndex);

            // Optional: Update order index if meaningful for other logic
            const reorderedLinks = newLinks.map((link, index) => ({
                ...link,
                order: index
            }));

            onUpdate({ ...linkInBio, links: reorderedLinks });
        }
    };

    return (
        <div className="space-y-6">
            <div className={`p-4 rounded-lg border border-dashed border-indigo-500/20 bg-indigo-500/5`}>
                <h3 className="text-sm font-semibold text-indigo-400 mb-2 flex items-center gap-2">
                    <GripVertical size={16} /> Link Management
                </h3>
                <p className="text-xs text-gray-500 mb-4 ml-6">
                    Add, edit, and reorder the links displayed on your page.
                </p>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={linkInBio.links || []}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-3">
                            {linkInBio.links?.map((link, idx) => (
                                <SortableLinkItem
                                    key={link.id}
                                    link={link}
                                    idx={idx}
                                    themeClasses={themeClasses}
                                    handleUpdateLink={handleUpdateLink}
                                    handleDeleteLink={handleDeleteLink}
                                    onImageUploadTrigger={onImageUploadTrigger}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                <button
                    onClick={handleAddLink}
                    className="w-full mt-4 py-3 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-base font-medium transition-colors flex items-center justify-center gap-2 border border-indigo-500/20"
                >
                    <Plus size={18} /> Add New Link
                </button>
            </div>

            {/* General Settings */}
            <div className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase">Page Settings</h3>

                <div className={`flex items-center justify-between p-3 rounded-lg border ${themeClasses.cardBg}`}>
                    <span className={`text-sm ${themeClasses.textMain}`}>Show Social Icons</span>
                    <button
                        onClick={() => onUpdate({ ...linkInBio, showSocial: !linkInBio.showSocial })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${linkInBio.showSocial ? 'bg-indigo-500' : 'bg-gray-600'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${linkInBio.showSocial ? 'translate-x-6' : ''}`} />
                    </button>
                </div>

                <div className={`flex items-center justify-between p-3 rounded-lg border ${themeClasses.cardBg}`}>
                    <span className={`text-sm ${themeClasses.textMain}`}>Show Email Contact</span>
                    <button
                        onClick={() => onUpdate({ ...linkInBio, showEmail: !linkInBio.showEmail })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${linkInBio.showEmail ? 'bg-indigo-500' : 'bg-gray-600'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${linkInBio.showEmail ? 'translate-x-6' : ''}`} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LinksEditor;
