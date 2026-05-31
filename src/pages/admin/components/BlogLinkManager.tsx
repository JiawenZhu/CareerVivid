import React, { useEffect, useMemo, useState } from 'react';
import { Check, Edit2, ExternalLink, Link as LinkIcon, Trash2, Unlink, X } from 'lucide-react';

const LinkManagerCard = ({ link, onUpdate, onUnlink, onRemove }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(link.text);
    const [url, setUrl] = useState(link.url);

    useEffect(() => {
        if (!isEditing) {
            setText(link.text);
            setUrl(link.url);
        }
    }, [link, isEditing]);

    const handleSave = () => {
        onUpdate(text, url);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setText(link.text);
        setUrl(link.url);
        setIsEditing(false);
    };

    return (
        <div className="p-3 mb-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
            {isEditing ? (
                <div className="space-y-2">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Text</label>
                        <input className="w-full p-1 text-sm border rounded dark:bg-gray-600 dark:border-gray-500" value={text} onChange={event => setText(event.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">URL</label>
                        <input className="w-full p-1 text-sm border rounded dark:bg-gray-600 dark:border-gray-500" value={url} onChange={event => setUrl(event.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={handleCancel} className="p-1 text-gray-500 hover:text-gray-700"><X size={14} /></button>
                        <button onClick={handleSave} className="p-1 text-green-500 hover:text-green-700"><Check size={14} /></button>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm text-primary-600 dark:text-primary-400 truncate pr-2" title={link.text}>{link.text}</span>
                        <div className="flex gap-1 shrink-0">
                            <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-blue-500" title="Edit"><Edit2 size={12} /></button>
                            <button onClick={onUnlink} className="p-1 text-gray-400 hover:text-orange-500" title="Unlink"><Unlink size={12} /></button>
                            <button onClick={onRemove} className="p-1 text-gray-400 hover:text-red-500" title="Delete"><Trash2 size={12} /></button>
                        </div>
                    </div>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 hover:underline truncate">
                        <ExternalLink size={10} /> {link.url}
                    </a>
                </div>
            )}
        </div>
    );
};

const BlogLinkManager = ({ content, onUpdateContent }: { content: string; onUpdateContent: (content: string) => void }) => {
    const links = useMemo(() => {
        const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const results = [];
        let match;
        while ((match = regex.exec(content)) !== null) {
            results.push({ index: match.index, fullMatch: match[0], text: match[1], url: match[2] });
        }
        return results;
    }, [content]);

    const updateLink = (index: number, newText: string, newUrl: string) => {
        const link = links[index];
        const before = content.substring(0, link.index);
        const after = content.substring(link.index + link.fullMatch.length);
        onUpdateContent(`${before}[${newText}](${newUrl})${after}`);
    };

    const unlink = (index: number) => {
        const link = links[index];
        const before = content.substring(0, link.index);
        const after = content.substring(link.index + link.fullMatch.length);
        onUpdateContent(`${before}${link.text}${after}`);
    };

    const removeLink = (index: number) => {
        const link = links[index];
        const before = content.substring(0, link.index);
        const after = content.substring(link.index + link.fullMatch.length);
        onUpdateContent(`${before}${after}`);
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 border-l dark:border-gray-700 h-full flex flex-col">
            <div className="p-4 border-b dark:border-gray-700">
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <LinkIcon size={16} /> Link Inspector <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs">{links.length}</span>
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {links.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center italic mt-4">No links found in content.</p>
                ) : (
                    links.map((link, index) => (
                        <LinkManagerCard
                            key={`${link.index}-${link.text}`}
                            link={link}
                            onUpdate={(text: string, url: string) => updateLink(index, text, url)}
                            onUnlink={() => unlink(index)}
                            onRemove={() => removeLink(index)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default BlogLinkManager;
