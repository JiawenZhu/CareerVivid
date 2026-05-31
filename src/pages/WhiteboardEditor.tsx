import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CaptureUpdateAction, Excalidraw, restoreElements } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2 } from 'lucide-react';
import { navigate } from '../utils/navigation';
import { useWhiteboards } from '../hooks/useWhiteboards';
import { WhiteboardData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { generateExcalidrawDiagram } from '../services/geminiService';
import GenerateDiagramModal from '../components/Whiteboard/GenerateDiagramModal';
import BoardOnboarding from '../components/Whiteboard/BoardOnboarding';
import WhiteboardTopBar from './whiteboard/WhiteboardTopBar';
import WhiteboardGenerationControls from './whiteboard/WhiteboardGenerationControls';
import {
    SAVE_DELAY_MS,
    buildComponentRevealStages,
    buildExcalidrawPayload,
    fromFirestoreJson,
    generateThumbnailSvg,
    loadUserPrefs,
    saveUserPrefs,
    serializeElements,
    sleep,
    toFirestoreJson,
} from './whiteboard/whiteboardEditorUtils';

interface WhiteboardEditorProps {
    id?: string;
    isReadOnly?: boolean; // <-- New prop for view-only mode
}

// ─── Component ───────────────────────────────────────────────────────────────

const WhiteboardEditor: React.FC<WhiteboardEditorProps> = ({ id, isReadOnly = false }) => {
    const { fetchWhiteboard, updateWhiteboard } = useWhiteboards();
    const { currentUser } = useAuth();

    const [whiteboard, setWhiteboard] = useState<WhiteboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false);
    const [generationStage, setGenerationStage] = useState<{ current: number; total: number; label: string } | null>(null);

    // Ownership-derived read-only state
    const [derivedReadOnly, setDerivedReadOnly] = useState(isReadOnly);

    const excalidrawAPIRef = useRef<any>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);

    // Refs for synchronous access during unmount
    const latestElementsRef = useRef<readonly any[]>([]);
    const latestAppStateRef = useRef<Record<string, any>>({});
    const hasPendingChanges = useRef(false);
    const titleRef = useRef('');
    // Track last element fingerprint to skip saves when only viewport/selection changed
    const lastSavedElementsHashRef = useRef<string>('');

    useEffect(() => { titleRef.current = title; }, [title]);

    // ─── Fetch ───────────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        const loadBoard = async () => {
            if (!id) { navigate('/'); return; }
            try {
                console.log('[Whiteboard] Fetching whiteboard:', id);
                const data = await fetchWhiteboard(id);
                if (cancelled) return;
                if (data) {
                    console.log('[Whiteboard] Loaded:', {
                        title: data.title,
                        hasExcalidrawData: !!data.excalidrawData,
                        elementCount: data.excalidrawData?.elements?.length ?? 0,
                    });
                    setWhiteboard(data);
                    setTitle(data.title);
                    latestElementsRef.current = data.excalidrawData?.elements ?? [];
                    latestAppStateRef.current = data.excalidrawData?.appState ?? {};
                    // Seed the hash so we don't immediately re-save on open
                    lastSavedElementsHashRef.current = JSON.stringify(
                        (data.excalidrawData?.elements ?? []).map((el: any) => el.id + ':' + el.version)
                    );

                    // Derive read-only from ownership
                    if (!isReadOnly && currentUser && data.userId !== currentUser.uid) {
                        setDerivedReadOnly(true);
                    } else {
                        setDerivedReadOnly(isReadOnly);
                    }
                } else {
                    setError('Whiteboard not found');
                }
            } catch (err: any) {
                if (!cancelled) setError(err.message ?? 'Failed to load whiteboard');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        loadBoard();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // ─── Core Save (fully async, with thumbnail) ─────────────────────────────
    const performSave = useCallback(
        async (elements: readonly any[], appState: Record<string, any>) => {
            if (!id || derivedReadOnly) return; // Block save in read-only mode
            setIsSaving(true);
            try {
                const excalidrawData = buildExcalidrawPayload(elements, appState);
                const excalidrawJson = toFirestoreJson(excalidrawData);
                const thumbnailSvg = await generateThumbnailSvg(elements, appState);

                await updateDoc(doc(db, 'whiteboards', id), {
                    excalidrawJson,
                    thumbnailSvg,
                    title: titleRef.current,
                    updatedAt: Date.now(),
                });

                lastSavedElementsHashRef.current = JSON.stringify(
                    elements.filter((el: any) => !el.isDeleted).map((el: any) => el.id + ':' + el.version)
                );
                hasPendingChanges.current = false;
                saveUserPrefs(appState);
            } catch (err) {
                console.error('[Whiteboard] Save failed:', err);
            } finally {
                setIsSaving(false);
            }
        },
        [id, derivedReadOnly]
    );

    // ─── AI Diagram Generation ───────────────────────────────────────────────
    const handleGenerateDiagram = async (prompt: string) => {
        if (!currentUser) throw new Error("Must be logged in to generate diagrams.");
        if (derivedReadOnly) throw new Error("Cannot generate diagrams in read-only mode.");
        try {
            setGenerationStage({ current: 0, total: 3, label: 'Planning diagram structure' });
            const diagramData = await generateExcalidrawDiagram(currentUser.uid, prompt);
            const newElements = diagramData.elements || [];

            if (excalidrawAPIRef.current && newElements.length > 0) {
                const currentElements = excalidrawAPIRef.current.getSceneElements();
                const restoredElements = restoreElements(
                    serializeElements(newElements),
                    currentElements,
                    { refreshDimensions: true, repairBindings: true }
                );
                const stages = buildComponentRevealStages(restoredElements);
                const revealedElements: any[] = [];

                for (let index = 0; index < stages.length; index += 1) {
                    revealedElements.push(...stages[index]);
                    const stagedScene = [...currentElements, ...revealedElements];

                    setGenerationStage({
                        current: index + 1,
                        total: stages.length,
                        label: index < stages.length - 1 ? 'Adding one component at a time' : 'Finishing connections',
                    });
                    latestElementsRef.current = stagedScene;
                    excalidrawAPIRef.current.updateScene({
                        elements: stagedScene,
                        captureUpdate: CaptureUpdateAction.NEVER,
                    });

                    if (index === 0) {
                        setTimeout(() => {
                            excalidrawAPIRef.current?.scrollToContent(stages[index], { fitToViewport: true });
                        }, 80);
                    }

                    await sleep(index < 2 ? 520 : 380);
                }

                const newCombined = [...currentElements, ...restoredElements];
                latestElementsRef.current = newCombined;
                excalidrawAPIRef.current.updateScene({
                    elements: newCombined,
                    captureUpdate: CaptureUpdateAction.IMMEDIATELY,
                });
                requestAnimationFrame(() => {
                    excalidrawAPIRef.current?.scrollToContent(restoredElements, { fitToViewport: true });
                });

                // Explicitly save so the diagram persists to Firestore immediately.
                const appState = excalidrawAPIRef.current.getAppState?.() ?? latestAppStateRef.current;
                await performSave(newCombined, appState);
                const excalidrawPayload = buildExcalidrawPayload(newCombined, appState);
                setWhiteboard(prev => prev ? {
                    ...prev,
                    excalidrawData: excalidrawPayload,
                    excalidrawJson: toFirestoreJson(excalidrawPayload),
                    updatedAt: Date.now(),
                } as any : prev);
            }
        } catch (err) {
            console.error("AI Diagram Generation error:", err);
            throw err;
        } finally {
            setGenerationStage(null);
        }
    };

    // ─── Debounced onChange ──────────────────────────────────────────────────
    const handleChange = useCallback(
        (elements: readonly any[], appState: Record<string, any>) => {
            // Skip save entirely in read-only mode
            if (derivedReadOnly) return;

            // Force tools to be "sticky" by default
            if (
                appState.activeTool &&
                appState.activeTool.type !== 'selection' &&
                appState.activeTool.type !== 'eraser' &&
                appState.activeTool.type !== 'hand' &&
                appState.activeTool.locked === false
            ) {
                // Defer to avoid synchronous React update warnings
                setTimeout(() => {
                    excalidrawAPIRef.current?.updateScene({
                        appState: {
                            ...appState,
                            viewBackgroundColor: appState.viewBackgroundColor,
                            activeTool: {
                                ...appState.activeTool,
                                locked: true,
                            },
                        },
                    });
                }, 0);
            }

            // Skip the very first fire (Excalidraw fires onChange on hydration)
            if (isFirstRender.current) {
                isFirstRender.current = false;
                return;
            }

            const currentHash = JSON.stringify(
                elements.filter((el: any) => !el.isDeleted).map((el: any) => el.id + ':' + el.version)
            );
            const elementsChanged = currentHash !== lastSavedElementsHashRef.current;

            // Always update refs (for unmount save)
            latestElementsRef.current = elements;
            latestAppStateRef.current = appState;

            if (!elementsChanged) return;

            hasPendingChanges.current = true;
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => performSave(elements, appState), SAVE_DELAY_MS);
        },
        [performSave, derivedReadOnly]
    );

    // ─── Synchronous Unmount Force-Save ─────────────────────────────────────
    const performSaveRef = useRef(performSave);
    useEffect(() => { performSaveRef.current = performSave; }, [performSave]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

            // Force-save on unmount — only if NOT read-only
            if (hasPendingChanges.current && id && !derivedReadOnly) {
                console.log('[Whiteboard] Unmount force-save triggered');
                const payload = buildExcalidrawPayload(latestElementsRef.current, latestAppStateRef.current);
                const excalidrawJson = toFirestoreJson(payload);
                updateDoc(doc(db, 'whiteboards', id), {
                    excalidrawJson,
                    title: titleRef.current,
                    updatedAt: Date.now(),
                }).then(() => {
                    console.log('[Whiteboard] Unmount save succeeded');
                }).catch((err) => {
                    console.error('[Whiteboard] Unmount save failed:', err);
                });
                saveUserPrefs(latestAppStateRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, derivedReadOnly]);

    // ─── Title Editing ───────────────────────────────────────────────────────
    const handleTitleBlur = () => {
        if (!id || title === whiteboard?.title || derivedReadOnly) return;
        updateDoc(doc(db, 'whiteboards', id), { title, updatedAt: Date.now() })
            .catch(err => console.error('Title save failed:', err));
        setWhiteboard(prev => prev ? { ...prev, title } : prev);
    };

    // ─── Loading / Error States ──────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                <p className="mt-4 text-gray-500 dark:text-gray-400">Loading Whiteboard...</p>
            </div>
        );
    }

    if (error || !whiteboard) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
                <p className="text-red-500 mb-4">{error || 'Something went wrong'}</p>
                <button onClick={() => navigate('/')} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    // ─── Merge fetched data + saved user prefs ───────────────────────────────
    const savedPrefs = derivedReadOnly ? {} : loadUserPrefs(); // Don't apply editing prefs in read-only
    const excalidrawData = fromFirestoreJson((whiteboard as any).excalidrawJson) ?? whiteboard.excalidrawData;
    const initialData = {
        elements: serializeElements(excalidrawData?.elements ?? []),
        appState: {
            ...(excalidrawData?.appState ?? {}),
            ...savedPrefs,
        } as any,
    };

    console.log('[Whiteboard] Rendering with', initialData.elements.length, 'elements', derivedReadOnly ? '(READ-ONLY)' : '');

    // ─── Editor ──────────────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
            <WhiteboardTopBar
                title={title}
                isSaving={isSaving}
                derivedReadOnly={derivedReadOnly}
                onTitleChange={setTitle}
                onTitleBlur={handleTitleBlur}
            />

            {/* Excalidraw Canvas */}
            <div className="flex-1 relative excalidraw-container-wrapper">
                <Excalidraw
                    initialData={initialData}
                    onChange={derivedReadOnly ? undefined : handleChange}
                    excalidrawAPI={(api: any) => { excalidrawAPIRef.current = api; }}
                    viewModeEnabled={derivedReadOnly}
                />

                <WhiteboardGenerationControls
                    derivedReadOnly={derivedReadOnly}
                    generationStage={generationStage}
                    onOpenModal={() => setIsDiagramModalOpen(true)}
                />
            </div>

            {!derivedReadOnly && (
                <GenerateDiagramModal
                    isOpen={isDiagramModalOpen}
                    onClose={() => setIsDiagramModalOpen(false)}
                    onGenerate={handleGenerateDiagram}
                />
            )}

            {!derivedReadOnly && <BoardOnboarding />}
        </div>
    );
};

export default WhiteboardEditor;
