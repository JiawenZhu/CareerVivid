import React, { useRef, useState, useEffect, useMemo, useLayoutEffect } from 'react';
import { ResumeData } from '../../../types';
import ResumePreview from '../../../components/ResumePreview';
import AdvancedAnnotationCanvas from '../../../components/AdvancedAnnotationCanvas';
import { AnnotationObject } from '../../../services/annotationService';
import { Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import {
    A4_HEIGHT_PX,
    A4_WIDTH_PX,
    PAGE_SAFE_PADDING_PX,
    PAGINATION_SPACER_CLASS,
    applyPaginationSpacing,
    collectSpacerPlacements,
    applySpacerPlacements
} from '../../../utils/paginationUtils';

const PAGE_GAP_PX = 40;
const PREVIEW_EDGE_PADDING_PX = 28;
const PREVIEW_RIGHT_RAIL_PX = 96;
const PAGE_LABEL_GAP_PX = 10;
const MIN_ZOOM = 0.55;
const MAX_ZOOM = 1.6;
const ZOOM_STEP = 0.1;

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
    isAnyDropdownOpen?: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const EditorPreview: React.FC<EditorPreviewProps> = ({
    resume, viewMode, scale, currentUserUid,
    showAnnotationOverlay, annotationUrl, annotationObjects, isPreviewBlurred,
    onResumeChange, onFocusField, onDoubleClick, isAnyDropdownOpen = false
}) => {
    const editorPreviewContainerRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const blurOverlayRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState<number>(0);
    const [fitScale, setFitScale] = useState(scale);
    const [zoomOffset, setZoomOffset] = useState(0);

    // Detect overflow
    const hasOverflow = useMemo(() => contentHeight > A4_HEIGHT_PX, [contentHeight]);
    const pageCount = useMemo(() => Math.ceil(contentHeight / A4_HEIGHT_PX) || 1, [contentHeight]);
    const effectiveScale = useMemo(() => clamp(fitScale + zoomOffset, MIN_ZOOM, MAX_ZOOM), [fitScale, zoomOffset]);
    const pageStackHeight = useMemo(
        () => (pageCount * A4_HEIGHT_PX) + (Math.max(0, pageCount - 1) * PAGE_GAP_PX),
        [pageCount]
    );
    const scaledPageWidth = A4_WIDTH_PX * effectiveScale;
    const scaledStackHeight = pageStackHeight * effectiveScale;
    const zoomPercent = Math.round(effectiveScale * 100);
    const isFitZoom = Math.abs(zoomOffset) < 0.005;
    const isActualSize = Math.abs(effectiveScale - 1) < 0.005;

    const setZoomScale = (nextScale: number) => {
        setZoomOffset(clamp(nextScale - fitScale, MIN_ZOOM - fitScale, MAX_ZOOM - fitScale));
    };

    const adjustZoom = (direction: -1 | 1) => {
        setZoomScale(effectiveScale + (direction * ZOOM_STEP));
    };

    useLayoutEffect(() => {
        const calculateFitScale = () => {
            const container = editorPreviewContainerRef.current;
            if (!container) return;

            const availableWidth = container.clientWidth - PREVIEW_RIGHT_RAIL_PX - (PREVIEW_EDGE_PADDING_PX * 2);
            const nextFitScale = clamp(availableWidth / A4_WIDTH_PX, MIN_ZOOM, 1.25);
            setFitScale(nextFitScale);
        };

        calculateFitScale();
        const resizeObserver = new ResizeObserver(calculateFitScale);
        if (editorPreviewContainerRef.current) {
            resizeObserver.observe(editorPreviewContainerRef.current);
        }
        window.addEventListener('resize', calculateFitScale);
        const timeout = setTimeout(calculateFitScale, 300);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', calculateFitScale);
            clearTimeout(timeout);
        };
    }, [viewMode]);

    useLayoutEffect(() => {
        const frame = requestAnimationFrame(() => {
            const roots = Array.from(
                editorPreviewContainerRef.current?.querySelectorAll<HTMLElement>('[data-resume-preview-root="true"]') || []
            );

            const measurementRoot = previewRef.current;
            if (measurementRoot) {
                applyPaginationSpacing(measurementRoot);
                const placements = collectSpacerPlacements(measurementRoot);
                roots
                    .filter((root) => root !== measurementRoot)
                    .forEach((root) => applySpacerPlacements(root, placements));
            }

            if (previewRef.current) {
                setContentHeight(previewRef.current.scrollHeight);
            }
        });

        return () => cancelAnimationFrame(frame);
    }, [resume, contentHeight]);

    // Force recalculation when fonts are loaded to prevent layout shifts
    useEffect(() => {
        if (typeof document !== 'undefined' && document.fonts) {
            document.fonts.ready.then(() => {
                if (previewRef.current) {
                    setContentHeight(previewRef.current.scrollHeight);
                }
            });
        }
    }, []);

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
                overflow-auto custom-scrollbar
            `}
        >
            {/* Overflow Warning Banner */}
            <AnimatePresence>
                {hasOverflow && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`relative z-10 bg-amber-50/95 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 shadow-sm backdrop-blur transition-opacity duration-200 ${isAnyDropdownOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    >
                        <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-xs font-semibold text-amber-800">
                            Preview shows <span className="font-bold">{pageCount} PDF pages</span>. Gray page breaks mark where the exported PDF will split.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div
                className="absolute left-[-9999px] top-0 w-[210mm] opacity-0 pointer-events-none"
                aria-hidden="true"
            >
                <ResumePreview
                    resume={resume}
                    template={resume.templateId}
                    previewId={`resume-preview-${resume.id || 'default'}-measure`}
                    previewRef={previewRef}
                    onUpdate={onResumeChange}
                    onFocus={onFocusField}
                />
            </div>

            <div
                className="min-h-full w-full flex justify-center items-start relative"
                style={{
                    paddingTop: PREVIEW_EDGE_PADDING_PX,
                    paddingBottom: PREVIEW_EDGE_PADDING_PX,
                    paddingLeft: PREVIEW_EDGE_PADDING_PX,
                    paddingRight: PREVIEW_EDGE_PADDING_PX
                }}
            >
                <div
                    className="relative transition-[width,height] duration-300"
                    style={{
                        width: scaledPageWidth + PREVIEW_RIGHT_RAIL_PX,
                        minWidth: scaledPageWidth + PREVIEW_RIGHT_RAIL_PX,
                        height: scaledStackHeight
                    }}
                    onDoubleClick={onDoubleClick}
                    title="Double-click to enter full-screen preview"
                >
                    <div
                        className="absolute left-0 top-0 origin-top-left transition-transform duration-300"
                        style={{
                            width: A4_WIDTH_PX,
                            height: pageStackHeight,
                            transform: `scale(${effectiveScale})`
                        }}
                    >
                        {Array.from({ length: pageCount }, (_, pageIndex) => (
                            <div key={`page-${pageIndex}`} className="relative mb-10 last:mb-0">
                                <div
                                    className="relative overflow-hidden rounded-sm bg-white shadow-2xl ring-1 ring-slate-200"
                                    style={{ height: `${A4_HEIGHT_PX}px`, width: `${A4_WIDTH_PX}px` }}
                                    data-resume-page={pageIndex + 1}
                                    aria-hidden={pageIndex > 0 ? true : undefined}
                                >
                                    <div
                                        className="absolute left-0 top-0 w-full"
                                        style={{ transform: `translateY(-${pageIndex * A4_HEIGHT_PX}px)` }}
                                    >
                                        <ResumePreview
                                            resume={resume}
                                            template={resume.templateId}
                                            previewId={`resume-preview-${resume.id || 'default'}-page-${pageIndex + 1}`}
                                            className="shadow-none"
                                            onUpdate={onResumeChange}
                                            onFocus={onFocusField}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div
                        className="absolute z-20 flex w-[84px] flex-col gap-2"
                        style={{
                            left: scaledPageWidth + PAGE_LABEL_GAP_PX,
                            top: 10
                        }}
                    >
                        <div className="flex overflow-hidden rounded-lg bg-[#2b164f] text-white shadow-xl ring-1 ring-black/10">
                            <button
                                type="button"
                                onClick={() => adjustZoom(-1)}
                                className="flex h-9 flex-1 items-center justify-center border-r border-white/10 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                                disabled={effectiveScale <= MIN_ZOOM}
                                aria-label="Zoom out"
                                title="Zoom out"
                            >
                                <Minus size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => adjustZoom(1)}
                                className="flex h-9 flex-1 items-center justify-center transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                                disabled={effectiveScale >= MAX_ZOOM}
                                aria-label="Zoom in"
                                title="Zoom in"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-600 shadow-md">
                            <button
                                type="button"
                                onClick={() => setZoomOffset(0)}
                                className={`h-7 border-r border-slate-200 transition-colors hover:bg-slate-50 ${isFitZoom ? 'bg-indigo-50 text-indigo-600' : ''}`}
                                aria-label="Fit resume to preview"
                                title="Fit to preview"
                            >
                                Fit
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoomScale(1)}
                                className={`h-7 transition-colors hover:bg-slate-50 ${isActualSize ? 'bg-indigo-50 text-indigo-600' : ''}`}
                                aria-label="Set zoom to 100 percent"
                                title="Set zoom to 100%"
                            >
                                {zoomPercent}%
                            </button>
                        </div>
                    </div>

                    {Array.from({ length: pageCount }, (_, pageIndex) => (
                        <div
                            key={`page-label-${pageIndex}`}
                            className="absolute hidden xl:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500 shadow-sm"
                            style={{
                                left: scaledPageWidth + PAGE_LABEL_GAP_PX,
                                top: (pageIndex * (A4_HEIGHT_PX + PAGE_GAP_PX) * effectiveScale) + 82
                            }}
                        >
                                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                                Page {pageIndex + 1}
                        </div>
                    ))}

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
