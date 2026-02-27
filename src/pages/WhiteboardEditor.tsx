import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Excalidraw, exportToSvg } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ChevronLeft, Save, Loader2, Sparkles, Eye, ExternalLink } from 'lucide-react';
import { navigate } from '../utils/navigation';
import { useWhiteboards } from '../hooks/useWhiteboards';
import { WhiteboardData, ExcalidrawFileData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { generateExcalidrawDiagram } from '../services/geminiService';
import GenerateDiagramModal from '../components/Whiteboard/GenerateDiagramModal';

const SAVE_DELAY_MS = 2000;
const PREFS_STORAGE_KEY = 'excalidraw-user-prefs';

const PERSISTED_PREF_KEYS = [
    'currentItemStrokeColor',
    'currentItemBackgroundColor',
    'currentItemFillStyle',
    'currentItemStrokeWidth',
    'currentItemStrokeStyle',
    'currentItemRoughness',
    'currentItemOpacity',
    'currentItemFontFamily',
    'currentItemFontSize',
    'currentItemTextAlign',
    'currentItemRoundness',
    'currentItemStartArrowhead',
    'currentItemEndArrowhead',
] as const;

interface WhiteboardEditorProps {
    id?: string;
    isReadOnly?: boolean; // <-- New prop for view-only mode
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const serializeElements = (elements: readonly any[]): any[] => {
    try {
        // Filter deleted AND serialize (strips readonly/class instances)
        return JSON.parse(JSON.stringify(elements.filter((el: any) => !el.isDeleted)));
    } catch {
        return [];
    }
};

const buildExcalidrawPayload = (
    elements: readonly any[],
    appState: Record<string, any>
): ExcalidrawFileData => ({
    type: 'excalidraw',
    version: 2,
    source: window.location.origin,
    elements: serializeElements(elements),
    appState: {
        gridSize: appState.gridSize ?? 20,
        gridStep: appState.gridStep ?? 5,
        gridModeEnabled: appState.gridModeEnabled ?? false,
        viewBackgroundColor: appState.viewBackgroundColor ?? '#ffffff',
    },
    files: {},
});

/**
 * Firestore does NOT support nested arrays (e.g. arrow `points: [[0,0],[x,y]]`).
 * We serialize the entire excalidrawData payload to a JSON string and store it
 * as `excalidrawJson` — a plain string field — to bypass this constraint.
 */
const toFirestoreJson = (payload: ExcalidrawFileData): string => {
    return JSON.stringify(payload);
};

const fromFirestoreJson = (json: string | undefined): ExcalidrawFileData | null => {
    if (!json) return null;
    try {
        return JSON.parse(json) as ExcalidrawFileData;
    } catch {
        return null;
    }
};

const generateThumbnailSvg = async (elements: readonly any[], appState: any): Promise<string> => {
    try {
        const filtered = elements.filter((el: any) => !el.isDeleted);
        if (filtered.length === 0) return '';
        const svg = await exportToSvg({
            elements: filtered as any,
            appState: { ...appState, exportWithDarkMode: false, exportBackground: true },
        });
        const str = new XMLSerializer()
            .serializeToString(svg)
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
        return str.length > 500_000 ? '' : str;
    } catch {
        return '';
    }
};

const loadUserPrefs = (): Record<string, any> => {
    try {
        const raw = localStorage.getItem(PREFS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

const saveUserPrefs = (appState: Record<string, any>) => {
    try {
        const prefs: Record<string, any> = {};
        for (const key of PERSISTED_PREF_KEYS) {
            if (appState[key] !== undefined) prefs[key] = appState[key];
        }
        localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch { /* noop */ }
};

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
            const diagramData = await generateExcalidrawDiagram(currentUser.uid, prompt);
            const newElements = diagramData.elements || [];

            if (excalidrawAPIRef.current && newElements.length > 0) {
                const currentElements = excalidrawAPIRef.current.getSceneElements();
                const newCombined = [...currentElements, ...newElements];

                excalidrawAPIRef.current.updateScene({ elements: newCombined });

                // Small delay to ensure render finishes before zooming to content
                setTimeout(() => {
                    excalidrawAPIRef.current?.scrollToContent(newElements, { fitToViewport: true });
                }, 100);

                // Explicitly save so the diagram persists to Firestore immediately.
                const appState = excalidrawAPIRef.current.getAppState?.() ?? latestAppStateRef.current;
                await performSave(newCombined, appState);
            }
        } catch (err) {
            console.error("AI Diagram Generation error:", err);
            throw err;
        }
    };

    // ─── Debounced onChange ──────────────────────────────────────────────────
    const handleChange = useCallback(
        (elements: readonly any[], appState: Record<string, any>) => {
            // Skip save entirely in read-only mode
            if (derivedReadOnly) return;

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
            {/* Top Bar */}
            <header style={{
                height: '56px', minHeight: '56px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '0 16px',
                borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', zIndex: 50,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => navigate(derivedReadOnly ? '/community' : '/')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '4px', padding: '8px',
                            borderRadius: '8px', border: 'none', backgroundColor: 'transparent',
                            cursor: 'pointer', color: '#6b7280', fontSize: '14px', fontWeight: 500,
                        }}
                    >
                        <ChevronLeft size={20} />
                        <span>{derivedReadOnly ? 'Back' : 'Dashboard'}</span>
                    </button>
                    <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb' }} />

                    {derivedReadOnly ? (
                        /* Read-only: static title, no editing */
                        <span style={{ fontWeight: 700, fontSize: '18px', color: '#111827' }}>
                            {title || 'Untitled Whiteboard'}
                        </span>
                    ) : (
                        /* Owner: editable title */
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                            style={{
                                fontWeight: 700, fontSize: '18px', backgroundColor: 'transparent',
                                border: 'none', outline: 'none', color: '#111827', width: '300px',
                            }}
                            placeholder="Untitled Whiteboard"
                        />
                    )}

                    {/* View Only Badge */}
                    {derivedReadOnly && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '4px 10px', borderRadius: '9999px',
                            backgroundColor: '#f3f4f6', color: '#6b7280',
                            fontSize: '12px', fontWeight: 600,
                        }}>
                            <Eye size={14} />
                            View Only
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {derivedReadOnly ? (
                        /* CTA for viewers */
                        <a
                            href="/whiteboard"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 14px', borderRadius: '8px',
                                backgroundColor: '#4f46e5', color: '#ffffff',
                                fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                            }}
                        >
                            Create your own on CareerVivid
                            <ExternalLink size={14} />
                        </a>
                    ) : (
                        /* Save status for owners */
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#9ca3af', fontSize: '13px' }}>
                            {isSaving
                                ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                                : <><Save size={14} /> Saved</>
                            }
                        </span>
                    )}
                </div>
            </header>

            {/* Excalidraw Canvas */}
            <div className="flex-1 relative excalidraw-container-wrapper">
                <Excalidraw
                    initialData={initialData}
                    onChange={derivedReadOnly ? undefined : handleChange}
                    excalidrawAPI={(api: any) => { excalidrawAPIRef.current = api; }}
                    viewModeEnabled={derivedReadOnly}
                />

                {/* AI Generate Button — ONLY for owners */}
                {!derivedReadOnly && (
                    <button
                        onClick={() => setIsDiagramModalOpen(true)}
                        className="absolute top-3 right-28 z-[9999] flex items-center gap-2 bg-gradient-to-r from-primary-500 to-indigo-500 hover:from-primary-600 hover:to-indigo-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-95 text-sm pointer-events-auto"
                    >
                        <Sparkles size={16} />
                        AI Generate
                    </button>
                )}
            </div>

            {!derivedReadOnly && (
                <GenerateDiagramModal
                    isOpen={isDiagramModalOpen}
                    onClose={() => setIsDiagramModalOpen(false)}
                    onGenerate={handleGenerateDiagram}
                />
            )}
        </div>
    );
};

export default WhiteboardEditor;
