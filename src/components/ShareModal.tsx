
import React, { useState, useEffect } from 'react';
import { X, Copy, Globe, Lock, Check, Share2, ExternalLink } from 'lucide-react';
import { ResumeData, ShareConfig, SharePermission } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: ResumeData;
  onUpdate: (id: string, data: Partial<ResumeData>) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, resume, onUpdate }) => {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState<ShareConfig>(resume.shareConfig || {
    enabled: false,
    permission: 'viewer',
  });
  const [copied, setCopied] = useState(false);

  // Construct the share URL. Using a hash router approach for simplicity with existing routing.
  // Format: base/#/shared/<userId>/<resumeId>
  const shareUrl = currentUser 
    ? `${window.location.origin}/#/shared/${currentUser.uid}/${resume.id}`
    : '';

  useEffect(() => {
    if (resume.shareConfig) {
      setConfig(resume.shareConfig);
    }
  }, [resume.shareConfig]);

  useEffect(() => {
    if (!isOpen) {
        setCopied(false);
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">
        
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
        <div className="p-6 space-y-6">
            
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
                            {config.enabled ? 'Anyone with the link can view' : 'Only you can view this resume'}
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
                                <option value="viewer">Viewer (Can view & download)</option>
                                <option value="commenter">Commenter (Can add comments)</option>
                                <option value="editor">Editor (Can make changes)</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {config.permission === 'viewer' && "Viewers can see the resume and download it as PDF."}
                            {config.permission === 'commenter' && "Commenters can view, download, and leave feedback."}
                            {config.permission === 'editor' && "Editors have full access to modify the resume content."}
                        </p>
                    </div>

                    <div className="pt-2">
                        <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">
                            Open public link <ExternalLink size={14} />
                        </a>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
