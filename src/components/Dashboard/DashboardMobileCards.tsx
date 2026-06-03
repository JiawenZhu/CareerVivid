import React, { useState } from 'react';
import {
    BarChart3,
    Copy,
    Edit3,
    ExternalLink,
    Eye,
    FileText,
    Globe2,
    Heart,
    MessageSquare,
    PenTool,
    Share2,
    Sparkles,
    Trash2
} from 'lucide-react';
import { CommunityPost } from '../../hooks/useCommunity';
import { PortfolioData } from '../../features/portfolio/types/portfolio';
import { PracticeHistoryEntry, ResumeData, WhiteboardData } from '../../types';
import { navigate } from '../../utils/navigation';
import ConfirmationModal from '../ConfirmationModal';
import ResumePreview from '../ResumePreview';

const cleanLabel = (value?: string) =>
    (value || '').replace(/\s*<[^>]+>\s*$/g, '').trim();

const toDate = (value: any): Date | null => {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate();
    if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value: any) => {
    const date = toDate(value);
    if (!date) return 'N/A';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

interface MobileInterviewHistoryCardProps {
    entry: PracticeHistoryEntry;
    onShowReport: (entry: PracticeHistoryEntry) => void;
    onDelete: (id: string) => void;
}

export const MobileInterviewHistoryCard: React.FC<MobileInterviewHistoryCardProps> = ({
    entry,
    onShowReport,
    onDelete
}) => {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const title = cleanLabel(entry.job.title);
    const practiceCount = entry.interviewHistory?.length || 0;

    const handlePracticeAgain = () => {
        sessionStorage.setItem('practiceJob', JSON.stringify(entry));
        navigate('/interview-studio');
    };

    return (
        <article className="rounded-lg border border-slate-200/80 bg-white/70 p-3 shadow-sm dark:border-slate-800/80 dark:bg-gray-900/50">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 dark:text-gray-100">
                            {title}
                        </h3>
                        {entry.job.url && (
                            <a
                                href={entry.job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Open ${title}`}
                                className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-300"
                            >
                                <ExternalLink size={14} />
                            </a>
                        )}
                    </div>
                    <p className="mt-1 truncate text-xs font-medium text-gray-500 dark:text-gray-400">
                        {cleanLabel(entry.job.company) || 'Custom Practice'}
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        Last activity: {formatDate(entry.timestamp)}
                    </p>
                </div>
                {practiceCount > 0 && (
                    <span className="shrink-0 rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300">
                        {practiceCount}x
                    </span>
                )}
            </div>

            <div className="mt-3 flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setIsDeleteOpen(true)}
                    aria-label={`Delete ${title}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                >
                    <Trash2 size={16} />
                </button>
                <button
                    type="button"
                    onClick={handlePracticeAgain}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-3 text-xs font-bold text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                    <Sparkles size={15} /> Practice
                </button>
                <button
                    type="button"
                    onClick={() => onShowReport(entry)}
                    disabled={!practiceCount}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-50 px-3 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70"
                >
                    <BarChart3 size={15} /> Report
                </button>
            </div>

            <ConfirmationModal
                isOpen={isDeleteOpen}
                title="Delete Interview Entry"
                message={`Are you sure you want to delete the interview history for "${title}"? This cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                onConfirm={() => {
                    onDelete(entry.id);
                    setIsDeleteOpen(false);
                }}
                onCancel={() => setIsDeleteOpen(false)}
            />
        </article>
    );
};

interface MobileResumeCardProps {
    resume: ResumeData;
    onUpdate: (id: string, data: Partial<ResumeData>) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
    onShare: (resume: ResumeData) => void;
}

export const MobileResumeCard: React.FC<MobileResumeCardProps> = ({
    resume,
    onDuplicate,
    onDelete,
    onShare
}) => {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const title = cleanLabel(resume.title);
    const thumbWidth = 74;
    const previewScale = thumbWidth / 824;

    return (
        <article className="rounded-lg border border-slate-200/80 bg-white/70 shadow-sm dark:border-slate-800/80 dark:bg-gray-900/50">
            <button
                type="button"
                onClick={() => navigate(`/edit/${resume.id}`)}
                className="flex w-full items-start gap-3 p-3 text-left"
            >
                <div className="relative h-[105px] w-[74px] shrink-0 overflow-hidden rounded-md bg-white shadow-inner ring-1 ring-slate-200/80 dark:bg-gray-800 dark:ring-slate-700/80">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute left-0 top-0 select-none"
                        style={{
                            width: '824px',
                            height: '1165px',
                            transform: `scale(${previewScale})`,
                            transformOrigin: 'top left'
                        }}
                    >
                        <ResumePreview
                            resume={resume}
                            template={resume.templateId}
                            previewId={`dashboard-mobile-resume-preview-${resume.id}`}
                            className="shadow-none select-none"
                        />
                    </div>
                </div>
                <div className="min-w-0 flex-1 pt-1">
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 dark:text-gray-100">
                        {title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Updated {formatDate(resume.updatedAt)}
                    </p>
                </div>
            </button>

            <div className="flex items-center justify-end gap-1 border-t border-slate-200/60 px-2 py-1.5 dark:border-slate-800/70">
                <button type="button" onClick={() => navigate(`/edit/${resume.id}`)} title="Edit Resume" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100">
                    <Edit3 size={16} />
                </button>
                <button type="button" onClick={() => onDuplicate(resume.id)} title="Duplicate Resume" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100">
                    <Copy size={16} />
                </button>
                <button type="button" onClick={() => setIsDeleteOpen(true)} title="Delete Resume" className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-300">
                    <Trash2 size={16} />
                </button>
                <button type="button" onClick={() => onShare(resume)} title="Share Resume" className="rounded-lg p-2 text-gray-500 hover:bg-primary-50 hover:text-primary-600 dark:text-gray-400 dark:hover:bg-primary-500/10 dark:hover:text-primary-300">
                    <Share2 size={16} />
                </button>
            </div>

            <ConfirmationModal
                isOpen={isDeleteOpen}
                title="Delete Resume"
                message={`Are you sure you want to delete "${title}"? This will remove it from your workspace and any folders.`}
                confirmText="Delete"
                variant="danger"
                onConfirm={() => {
                    onDelete(resume.id);
                    setIsDeleteOpen(false);
                }}
                onCancel={() => setIsDeleteOpen(false)}
            />
        </article>
    );
};

interface MobileWhiteboardCardProps {
    whiteboard: WhiteboardData;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
    onShare?: (whiteboard: WhiteboardData) => void;
}

export const MobileWhiteboardCard: React.FC<MobileWhiteboardCardProps> = ({
    whiteboard,
    onDuplicate,
    onDelete,
    onShare
}) => {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const title = cleanLabel(whiteboard.title);
    const hasThumbnail = !!whiteboard.thumbnailSvg;

    return (
        <article className="rounded-lg border border-slate-200/80 bg-white/70 shadow-sm dark:border-slate-800/80 dark:bg-gray-900/50">
            <button
                type="button"
                onClick={() => navigate(`/whiteboard/${whiteboard.id}`)}
                className="flex w-full items-start gap-3 p-3 text-left"
            >
                <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-gray-800">
                    {hasThumbnail ? (
                        <img
                            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(whiteboard.thumbnailSvg!)}`}
                            alt=""
                            className="h-full w-full object-contain"
                        />
                    ) : (
                        <PenTool size={22} className="text-gray-400 dark:text-gray-500" />
                    )}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 dark:text-gray-100">
                        {title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Updated {formatDate(whiteboard.updatedAt)}
                    </p>
                </div>
            </button>

            <div className="flex items-center justify-end gap-1 border-t border-slate-200/60 px-2 py-1.5 dark:border-slate-800/70">
                <button type="button" onClick={() => navigate(`/whiteboard/${whiteboard.id}`)} title="Edit Whiteboard" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100">
                    <Edit3 size={16} />
                </button>
                <button type="button" onClick={() => onDuplicate(whiteboard.id)} title="Duplicate Whiteboard" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100">
                    <Copy size={16} />
                </button>
                <button type="button" onClick={() => setIsDeleteOpen(true)} title="Delete Whiteboard" className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-300">
                    <Trash2 size={16} />
                </button>
                {onShare && (
                    <button type="button" onClick={() => onShare(whiteboard)} title="Share Whiteboard" className="rounded-lg p-2 text-gray-500 hover:bg-primary-50 hover:text-primary-600 dark:text-gray-400 dark:hover:bg-primary-500/10 dark:hover:text-primary-300">
                        <Share2 size={16} />
                    </button>
                )}
            </div>

            <ConfirmationModal
                isOpen={isDeleteOpen}
                title="Delete Whiteboard"
                message={`Are you sure you want to delete "${title}"? This will remove it from your workspace and any folders.`}
                confirmText="Delete"
                variant="danger"
                onConfirm={() => {
                    onDelete(whiteboard.id);
                    setIsDeleteOpen(false);
                }}
                onCancel={() => setIsDeleteOpen(false)}
            />
        </article>
    );
};

interface MobilePortfolioCardProps {
    portfolio: PortfolioData;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
    onShare: (portfolio: PortfolioData) => void;
}

export const MobilePortfolioCard: React.FC<MobilePortfolioCardProps> = ({
    portfolio,
    onDuplicate,
    onDelete,
    onShare
}) => {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const title = cleanLabel(portfolio.title);
    const modeLabel = portfolio.mode === 'linkinbio' ? 'Bio link' : 'Portfolio';

    return (
        <article className="rounded-lg border border-slate-200/80 bg-white/70 shadow-sm dark:border-slate-800/80 dark:bg-gray-900/50">
            <button
                type="button"
                onClick={() => navigate(`/portfolio/edit/${portfolio.id}`)}
                className="flex w-full items-center gap-3 p-3 text-left"
            >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/50">
                    <Globe2 size={22} />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 dark:text-gray-100">
                        {title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {modeLabel} - Updated {formatDate(portfolio.updatedAt)}
                    </p>
                </div>
            </button>

            <div className="flex items-center justify-end gap-1 border-t border-slate-200/60 px-2 py-1.5 dark:border-slate-800/70">
                <button type="button" onClick={() => navigate(`/portfolio/edit/${portfolio.id}`)} title="Edit Portfolio" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100">
                    <Edit3 size={16} />
                </button>
                <button type="button" onClick={() => onDuplicate(portfolio.id)} title="Duplicate Portfolio" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100">
                    <Copy size={16} />
                </button>
                <button type="button" onClick={() => setIsDeleteOpen(true)} title="Delete Portfolio" className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-300">
                    <Trash2 size={16} />
                </button>
                <button type="button" onClick={() => onShare(portfolio)} title="Share Portfolio" className="rounded-lg p-2 text-gray-500 hover:bg-primary-50 hover:text-primary-600 dark:text-gray-400 dark:hover:bg-primary-500/10 dark:hover:text-primary-300">
                    <Share2 size={16} />
                </button>
            </div>

            <ConfirmationModal
                isOpen={isDeleteOpen}
                title="Delete Portfolio"
                message={`Are you sure you want to delete "${title}"? This will remove it from your workspace and any folders.`}
                confirmText="Delete"
                variant="danger"
                onConfirm={() => {
                    onDelete(portfolio.id);
                    setIsDeleteOpen(false);
                }}
                onCancel={() => setIsDeleteOpen(false)}
            />
        </article>
    );
};

interface MobilePostCardProps {
    post: CommunityPost;
    onDelete: (id: string, coverImage?: string) => void;
}

export const MobilePostCard: React.FC<MobilePostCardProps> = ({ post, onDelete }) => {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const title = cleanLabel(post.title);

    return (
        <article className="rounded-lg border border-slate-200/80 bg-white/70 shadow-sm dark:border-slate-800/80 dark:bg-gray-900/50">
            <button
                type="button"
                onClick={() => navigate(`/community/post/${post.id}`, { from: window.location.pathname })}
                className="flex w-full items-start gap-3 p-3 text-left"
            >
                <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                    {post.coverImage ? (
                        <img src={post.coverImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <FileText size={22} className="text-slate-400 dark:text-slate-500" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 dark:text-gray-100">
                        {title}
                    </h3>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1"><Heart size={13} /> {post.metrics?.likes || 0}</span>
                        <span className="inline-flex items-center gap-1"><MessageSquare size={13} /> {post.metrics?.comments || 0}</span>
                        <span className="inline-flex items-center gap-1"><Eye size={13} /> {post.metrics?.views || 0}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(post.createdAt)}
                    </p>
                </div>
            </button>

            <div className="flex items-center justify-end gap-1 border-t border-slate-200/60 px-2 py-1.5 dark:border-slate-800/70">
                <button type="button" onClick={() => navigate(`/community/edit/${post.id}`, { from: window.location.pathname })} title="Edit Post" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100">
                    <Edit3 size={16} />
                </button>
                <button type="button" onClick={() => setIsDeleteOpen(true)} title="Delete Post" className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-300">
                    <Trash2 size={16} />
                </button>
            </div>

            <ConfirmationModal
                isOpen={isDeleteOpen}
                title="Delete Post"
                message={`Are you sure you want to delete "${title}"? This will remove it from the community feed.`}
                confirmText="Delete"
                variant="danger"
                onConfirm={() => {
                    onDelete(post.id, post.coverImage);
                    setIsDeleteOpen(false);
                }}
                onCancel={() => setIsDeleteOpen(false)}
            />
        </article>
    );
};
