
import React, { useState, useEffect } from 'react';
import { X, Copy, Globe, Lock, Check, Share2, ExternalLink, Users, Loader2, Briefcase } from 'lucide-react';
import { ResumeData, ShareConfig, SharePermission } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { deepStripUndefined } from '../utils/firebaseUtils';
import Toast from './Toast';

interface ShareResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: ResumeData;
  onUpdate: (id: string, data: Partial<ResumeData>) => void;
}

const ShareResumeModal: React.FC<ShareResumeModalProps> = ({ isOpen, onClose, resume, onUpdate }) => {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState<ShareConfig>(resume.shareConfig || {
    enabled: false,
    permission: 'viewer',
  });
  const [copied, setCopied] = useState(false);

  // Community share state
  const [showCommunityCaption, setShowCommunityCaption] = useState(false);
  const [caption, setCaption] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Construct the share URL. Using history router approach.
  // Format: base/shared/<userId>/<resumeId>
  const shareUrl = currentUser
    ? `${window.location.origin}/shared/${currentUser.uid}/${resume.id}`
    : '';

  useEffect(() => {
    if (resume.shareConfig) {
      setConfig(resume.shareConfig);
    }
  }, [resume.shareConfig]);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setShowCommunityCaption(false);
      setCaption('');
      setPublishSuccess(false);
      setError(null);
    } else {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleToggle = (enabled: boolean) => {
    const newConfig = { ...config, enabled };
    setConfig(newConfig);
    onUpdate(resume.id, { shareConfig: newConfig });
  };

  const handlePermissionChange = (permission: SharePermission) => {
    const newConfig = { ...config, permission };
    setConfig(newConfig);
    onUpdate(resume.id, { shareConfig: newConfig });
  };

  const handleReadyToggle = (readyForRecruiters: boolean) => {
    const newConfig = {
      ...config,
      readyForRecruiters,
      readyAt: readyForRecruiters ? new Date().toISOString() : null,
    };
    setConfig(newConfig);
    onUpdate(resume.id, { shareConfig: newConfig });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePublishToCommunity = async () => {
    if (!currentUser) return;
    setIsPublishing(true);
    try {
      const resumeTitle = [resume.personalDetails?.firstName, resume.personalDetails?.lastName].filter(Boolean).join(' ');

      const payload: Record<string, any> = {
        type: 'resume',
        assetId: resume.id,
        assetUrl: shareUrl,
        caption: caption.trim() || '',
        title: resumeTitle ? `${resumeTitle}'s Resume` : 'Shared Resume',
        content: caption.trim() || `Check out my resume!`,
        tags: ['resume', 'showcase'],
        readTime: 1,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        authorAvatar: currentUser.photoURL || '',
        authorRole: (currentUser as any)?.role || '',
        metrics: { likes: 0, comments: 0, views: 0 },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        resumeData: deepStripUndefined(resume), // Deeply strip undefined values
      };

      await addDoc(collection(db, 'community_posts'), payload);
      setPublishSuccess(true);
      setShowCommunityCaption(false);
      setTimeout(() => setPublishSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error publishing resume to community:', err);
      setError(err.message || 'Failed to share to community feed.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">

        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-full text-primary-600 dark:text-primary-400">
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Share Resume</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manage public access</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-81px)] space-y-6 overflow-y-auto p-6">

          {/* Toggle Switch */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {config.enabled ? (
                <Globe className="text-green-500" size={20} />
              ) : (
                <Lock className="text-gray-400" size={20} />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {config.enabled ? 'Public access is on' : 'Public access is off'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {config.enabled ? 'Anyone with the link can view your resume. Recruiters may contact you if your background matches an open role.' : 'Only you can view this resume'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.enabled}
                onChange={(e) => handleToggle(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {config.enabled && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              {/* Link Input */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                  Public Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 p-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 focus:outline-none"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`p-2.5 rounded-lg border transition-all duration-200 flex items-center justify-center gap-2 min-w-[90px] ${copied ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    {copied ? (
                      <><Check size={16} /><span className="text-xs font-bold">Copied</span></>
                    ) : (
                      <><Copy size={16} /><span className="text-xs font-medium">Copy</span></>
                    )}
                  </button>
                </div>
              </div>

              {/* Recruiter readiness signal */}
              <div className={`rounded-lg border p-3 transition-colors ${config.readyForRecruiters
                ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/70 dark:bg-emerald-950/30'
                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50'
                }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-1.5 ${config.readyForRecruiters
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : 'bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                      <Briefcase size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Ready for recruiter review</p>
                      <p className="mt-0.5 text-xs leading-5 text-gray-500 dark:text-gray-400">
                        {config.readyForRecruiters
                          ? 'Recruiters can see this resume is ready and the candidate is open to interview conversations.'
                          : 'Turn this on when the resume is polished and ready for recruiter outreach.'}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex flex-shrink-0 cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={Boolean(config.readyForRecruiters)}
                      onChange={(e) => handleReadyToggle(e.target.checked)}
                    />
                    <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-200 dark:bg-gray-700 dark:peer-focus:ring-emerald-900"></div>
                  </label>
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  This only adds a readiness signal to the public resume. It does not give recruiters edit access.
                </p>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                  General Access
                </label>
                <div className="relative">
                  <select
                    value={config.permission}
                    onChange={(e) => handlePermissionChange(e.target.value as SharePermission)}
                    className="w-full appearance-none p-3 pr-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="viewer">Viewer (Can view &amp; download)</option>
                    <option value="commenter">Commenter (Can add comments)</option>
                    <option value="editor">Editor (Can make changes)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {config.permission === 'viewer' && (
                    <span>
                      <span className="font-semibold">Note:</span> The 'Download PDF' option will only be active if you (the owner) are a Premium user, or if the viewer themselves holds a Premium account.
                    </span>
                  )}
                  {config.permission === 'commenter' && "Allows the viewer to leave text comments and draw annotations directly on your resume for feedback."}
                  {config.permission === 'editor' && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      ⚠️ Grants full write access. Select this only if you trust the viewer to modify or rewrite your resume content.
                    </span>
                  )}
                </p>
              </div>

              <div className="pt-2">
                <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">
                  Open public link <ExternalLink size={14} />
                </a>
              </div>

              {/* ── Community Publish Section ────────────────────────── */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                {publishSuccess ? (
                  <div className="flex items-center gap-2 justify-center text-green-600 dark:text-green-400 font-semibold text-sm py-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <Check size={16} />
                    Published to Community Feed!
                  </div>
                ) : showCommunityCaption ? (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Add a caption <span className="lowercase font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={caption}
                      onChange={e => setCaption(e.target.value)}
                      placeholder="e.g., Check out my updated resume for 2026!"
                      maxLength={200}
                      className="w-full p-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCommunityCaption(false)}
                        className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePublishToCommunity}
                        disabled={isPublishing}
                        className="flex-1 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
                        {isPublishing ? 'Publishing…' : 'Publish'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCommunityCaption(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30 hover:bg-primary-100 dark:hover:bg-primary-950/50 border border-primary-200 dark:border-primary-800 rounded-lg transition-all cursor-pointer"
                  >
                    <Users size={16} />
                    Share to Community Feed
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {error && <Toast message={error} onClose={() => setError(null)} />}
    </div>
  );
};

export default ShareResumeModal;
