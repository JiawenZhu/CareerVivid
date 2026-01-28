import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ResumeData } from '../../../types';
import ResumePreview from '../../../components/ResumePreview';
import AdvancedAnnotationCanvas from '../../../components/AdvancedAnnotationCanvas';
import PageBreakGuides from './PageBreakGuides';
import { AnnotationObject } from '../../../services/annotationService';
import { motion, AnimatePresence } from 'framer-motion';

// A4 height at 96 DPI
const A4_HEIGHT_PX = 1123;

interface EditorPreviewProps {
    resume: ResumeData;
    viewMode: 'edit' | 'preview';
    scale: number;
    currentUserUid: string;
    showAnnotationOverlay: boolean;
    annotationUrl: string | null;
    annotationObjects: AnnotationObject[];
    isPreviewBlurred: boolean;
    onResumeChange: (updates: Partial<ResumeData>) => void;
    onFocusField: (fieldId: string) => void;
    onDoubleClick: () => void;
}

const EditorPreview: React.FC<EditorPreviewProps> = ({
    resume, viewMode, scale, currentUserUid,
    showAnnotationOverlay, annotationUrl, annotationObjects, isPreviewBlurred,
    onResumeChange, onFocusField, onDoubleClick
}) => {
    const editorPreviewContainerRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const blurOverlayRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState<number>(0);

    // Detect overflow
    const hasOverflow = useMemo(() => contentHeight > A4_HEIGHT_PX, [contentHeight]);
    const pageCount = useMemo(() => Math.ceil(contentHeight / A4_HEIGHT_PX) || 1, [contentHeight]);

    // Track content height changes for page break guides
    useEffect(() => {
        const element = previewRef.current;
        if (!element) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                // Use scrollHeight to get total content height including overflow
                setContentHeight(entry.target.scrollHeight);
            }
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, [resume]); // Re-attach if resume changes drastically, though Ref should be stable

    return (
        <div
            ref={editorPreviewContainerRef}
            className={`
                flex-1 h-full bg-gray-100 dark:bg-gray-900/50 relative
                ${viewMode === 'preview' ? 'block' : 'hidden md:block'}
                overflow-y-auto custom-scrollbar
            `}
        >
            {/* Overflow Warning Banner */}
            <AnimatePresence>
                {hasOverflow && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="sticky top-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-center gap-3 shadow-sm"
                    >
                        <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm text-amber-800 font-medium">
                            Your resume is <span className="font-bold">{pageCount} pages</span>. Content below the red line will appear on page {pageCount}.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="min-h-full w-full flex justify-center items-start p-4 md:p-8 lg:p-12 relative">
                <div
                    className="bg-white shadow-2xl rounded-sm origin-top transition-transform duration-300 relative"
                    style={{
                        width: '210mm', // Fixed A4 width
                        minHeight: '297mm', // Fixed A4 height ratio aspect
                        transform: `scale(${scale})`,
                        marginBottom: `-${(1 - scale) * (Math.max(contentHeight, 1122))}px`
                    }}
                    onDoubleClick={onDoubleClick}
                    title="Double-click to enter full-screen preview"
                >
                    <ResumePreview
                        resume={resume}
                        template={resume.templateId}
                        previewRef={previewRef}
                        onUpdate={onResumeChange}
                        onFocus={onFocusField}
                    />

                    {/* Dynamic Page Break Guides */}
                    <PageBreakGuides contentHeight={contentHeight} scale={scale} />

                    {/* Annotation Overlay for Review Feedback */}
                    {showAnnotationOverlay && annotationUrl && (
                        <AdvancedAnnotationCanvas
                            resumeId={resume.id!}
                            ownerId={currentUserUid}
                            width={794} // 210mm @ 96dpi approx
                            height={1123} // 297mm @ 96dpi approx
                            initialImage={annotationUrl}
                            initialObjects={annotationObjects}
                            isReadOnly={true}
                        />
                    )}

                    {/* Anti-Screenshot Blur Overlay */}
                    <div
                        ref={blurOverlayRef}
                        className="absolute inset-0 backdrop-blur-3xl bg-white/40 dark:bg-gray-900/40 z-50 items-center justify-center rounded-sm overflow-hidden"
                        style={{ display: isPreviewBlurred ? 'flex' : 'none' }}
                    >
                        <div className="text-center max-w-md mx-auto px-6 py-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
                            <div className="mb-4">
                                <svg className="w-16 h-16 mx-auto text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                Content Protected
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                                Screenshots are disabled to protect your resume content. Please use the Download button to save your resume as a PDF.
                            </p>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <kbd className="px-2 py-1 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded shadow-sm">
                                    ESC
                                </kbd>
                                <span className="text-sm text-gray-600 dark:text-gray-400">to dismiss</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorPreview;
