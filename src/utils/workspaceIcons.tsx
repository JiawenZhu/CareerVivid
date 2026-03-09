import React from 'react';
import {
    Folder,
    FileText,
    Globe,
    PenTool,
    Mic,
    Briefcase,
    File,
    Plus,
    LayoutDashboard,
    MessageSquare
} from 'lucide-react';

export const getIconForNode = (id: string, type: string, size: number = 20) => {
    if (type === 'custom-folder') {
        return <Folder size={size} strokeWidth={1.5} />;
    }

    // System paths
    if (id === '/dashboard') return <LayoutDashboard size={size} strokeWidth={1.5} />;
    if (id === '/my-posts') return <MessageSquare size={size} strokeWidth={1.5} />;
    if (id === 'create-hub') return <Plus size={size} strokeWidth={1.5} />;

    // Feature paths
    if (id === '/newresume' || id.startsWith('resume-')) return <FileText size={size} strokeWidth={1.5} />;
    if (id === '/portfolio' || id.startsWith('portfolio-')) return <Globe size={size} strokeWidth={1.5} />;
    if (id === '/whiteboard' || id.startsWith('whiteboard-')) return <PenTool size={size} strokeWidth={1.5} />;
    if (id === '/interview-studio' || id.startsWith('interview-')) return <Mic size={size} strokeWidth={1.5} />;
    if (id === '/job-tracker' || id.startsWith('job-')) return <Briefcase size={size} strokeWidth={1.5} />;

    return <File size={size} strokeWidth={1.5} />;
};
