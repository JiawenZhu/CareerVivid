import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, ExternalLink, Upload, Image as ImageIcon, Tag, Link as LinkIcon, Palette, QrCode } from 'lucide-react';
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

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

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
                {/* Drag Handle - Always Visible and Interactive */}
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
                                {link.icon === 'Wechat' ? <QrCode size={12} /> : <LinkIcon size={12} />}
                                {link.icon === 'Wechat' ? 'QR Code Image' : 'URL'}
                            </label>
                            {link.icon === 'Wechat' ? (
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
                                        <span className="text-xs truncate flex-1 text-gray-500">
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

                        {/* Style & Icon Options */}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            <div>
                                <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
                                    <Palette size={12} /> Style
                                </label>
                                <select
                                    value={link.variant}
                                    onChange={(e) => handleUpdateLink(link.id, { variant: e.target.value as any })}
                                    className={`w-full rounded-lg px-2 py-2.5 text-sm outline-none border focus:border-indigo-500 transition-colors ${themeClasses.inputBg} h-10`}
                                >
                                    <option value="primary">Primary (Filled)</option>
                                    <option value="secondary">Secondary (Muted)</option>
                                    <option value="outline">Outline</option>
                                    <option value="ghost">Ghost (Text Only)</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full border border-current" /> Icon
                                </label>
                                <select
                                    value={link.icon || ''}
                                    onChange={(e) => handleUpdateLink(link.id, { icon: e.target.value })}
                                    className={`w-full rounded-lg px-2 py-2.5 text-sm outline-none border focus:border-indigo-500 transition-colors ${themeClasses.inputBg} h-10`}
                                >
                                    <option value="">No Icon</option>
                                    <option value="Tiktok">TikTok</option>
                                    <option value="Github">GitHub</option>
                                    <option value="Linkedin">LinkedIn</option>
                                    <option value="Twitter">Twitter/X</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="Youtube">YouTube</option>
                                    <option value="Wechat">WeChat</option>
                                    <option value="Weibo">Weibo</option>
                                    <option value="Douyin">Douyin (China)</option>
                                    <option value="Globe">Website</option>
                                    <option value="Mail">Email</option>
                                    <option value="FileText">Resume/Doc</option>
                                </select>
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
