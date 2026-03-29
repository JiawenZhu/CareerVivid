/// <reference types="chrome" />
import React, { useEffect, useState } from 'react';
import { FileText, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useResumes } from '../../hooks/useResumes';

const ExtensionResumes: React.FC = () => {
    const { currentUser } = useAuth();
    const { resumes, isLoading } = useResumes();
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [syncedId, setSyncedId] = useState<string | null>(null);

    // Load current selection from storage
    useEffect(() => {
        chrome.storage.local.get(['selectedResumeId'], (result) => {
            setSelectedResumeId((result.selectedResumeId as string | undefined) || null);
            setSyncedId((result.selectedResumeId as string | undefined) || null);
        });
    }, []);

    const handleSelectResume = async (resumeId: string) => {
        if (!currentUser || syncingId) return;
        setSyncingId(resumeId);

        chrome.runtime.sendMessage({
            type: 'SYNC_PROFILE',
            userId: currentUser.uid,
            resumeId,
        }, (res) => {
            setSyncingId(null);
            if (res?.success) {
                setSelectedResumeId(resumeId);
                setSyncedId(resumeId);
            }
        });
    };

    return (
        <div className="min-h-[360px] w-[380px] bg-gray-50 font-sans text-gray-900">
            <div className="px-5 py-4 bg-white border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">Select Resume for Autofill</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                    The selected resume's data will be used to fill job applications.
                </p>
            </div>

            <div className="p-4 space-y-2">
                {isLoading && (
                    <div className="flex justify-center py-8">
                        <Loader2 size={20} className="animate-spin text-indigo-500" />
                    </div>
                )}

                {!isLoading && resumes.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-400">No resumes found.</p>
                        <button
                            onClick={() => window.open('https://careervivid.app/newresume', '_blank')}
                            className="mt-3 text-sm font-semibold text-indigo-600 hover:underline"
                        >
                            Create your first resume →
                        </button>
                    </div>
                )}

                {resumes.map((resume) => {
                    const isSelected = selectedResumeId === resume.id;
                    const isSyncing = syncingId === resume.id;
                    const isSynced = syncedId === resume.id;

                    return (
                        <button
                            key={resume.id}
                            onClick={() => handleSelectResume(resume.id!)}
                            disabled={isSyncing}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                                isSelected
                                    ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                                    : 'border-gray-100 bg-white hover:border-indigo-200 hover:bg-gray-50'
                            }`}
                        >
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-50 text-gray-400'
                            }`}>
                                <FileText size={16} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-gray-900 truncate">
                                    {resume.title || 'Untitled Resume'}
                                </div>
                                {isSelected && (
                                    <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                                        ✓ Active for autofill
                                    </div>
                                )}
                            </div>

                            <div className="flex-shrink-0">
                                {isSyncing ? (
                                    <Loader2 size={16} className="animate-spin text-indigo-500" />
                                ) : isSelected ? (
                                    <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center">
                                        <Check size={11} className="text-white" />
                                    </div>
                                ) : (
                                    <div className="h-5 w-5 rounded-full border-2 border-gray-200" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {syncedId && (
                <div className="px-5 py-3 bg-green-50 border-t border-green-100 text-center">
                    <p className="text-xs text-green-700 font-medium">
                        ✓ Profile synced — ready to autofill applications
                    </p>
                </div>
            )}
        </div>
    );
};

export default ExtensionResumes;
