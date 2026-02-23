import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as fabric from 'fabric';
import Draggable from 'react-draggable';
import { Pen, Square, Circle, Type, Undo, Trash, Save, Loader2, Eraser, Redo, GripVertical, Minus, ArrowRight } from 'lucide-react';
import { uploadAnnotation, AnnotationObject } from '../services/annotationService';

interface AdvancedAnnotationCanvasProps {
    resumeId: string;
    ownerId: string;
    currentUser?: any;
    width: number;
    height: number;
    onSave?: (url: string, objects: AnnotationObject[]) => void;
    initialObjects?: AnnotationObject[];
    initialImage?: string | null;
    isReadOnly?: boolean;
}

type Tool = 'pen' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'text' | 'eraser' | 'select';
type LineStyle = 'solid' | 'dashed' | 'dotted';

const AdvancedAnnotationCanvas: React.FC<AdvancedAnnotationCanvasProps> = ({
    resumeId, ownerId, currentUser, width, height, onSave, initialObjects, initialImage, isReadOnly = false
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

    const [activeTool, setActiveTool] = useState<Tool>(isReadOnly ? 'select' : 'pen');
    const [strokeColor, setStrokeColor] = useState('#ef4444');
    const [lineStyle, setLineStyle] = useState<LineStyle>('solid');
    const [isSaving, setIsSaving] = useState(false);

    // Two-Stack History Management
    const [history, setHistory] = useState<string[]>([]);
    const [redoStack, setRedoStack] = useState<string[]>([]);
    const isHistoryAction = useRef(false);

    // Save current state to history
    const saveHistory = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || isHistoryAction.current) return;

        const json = JSON.stringify(canvas.toJSON());
        setHistory(prev => [...prev, json]);
        setRedoStack([]); // Clear redo stack on new action
    }, []);

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width,
            height,
            backgroundColor: 'transparent',
            isDrawingMode: !isReadOnly,
            selection: !isReadOnly
        });

        fabricCanvasRef.current = canvas;

        // Configure Brush
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = strokeColor;
        canvas.freeDrawingBrush.width = 3;

        // Load Background Image (Robust Persistence)
        if (initialImage) {
            const options = { crossOrigin: 'anonymous' } as any;
            fabric.Image.fromURL(initialImage, options).then((img) => {
                img.set({
                    left: 0,
                    top: 0,
                    scaleX: width / (img.width || 1),
                    scaleY: height / (img.height || 1),
                    selectable: false,
                    evented: false,
                });
                canvas.backgroundImage = img;
                canvas.requestRenderAll();
            }).catch(console.error);
        }

        // Load Initial Objects
        if (initialObjects && initialObjects.length > 0) {
            const fabricObjects = initialObjects
                .filter(obj => obj.fabricData)
                .map(obj => {
                    try {
                        // Parse JSON string back to object
                        return typeof obj.fabricData === 'string'
                            ? JSON.parse(obj.fabricData)
                            : obj.fabricData;
                    } catch (e) {
                        console.error('Failed to parse fabricData:', e);
                        return null;
                    }
                })
                .filter(obj => obj !== null);

            fabric.util.enlivenObjects(fabricObjects).then((objects) => {
                objects.forEach((obj: fabric.Object) => {
                    if (isReadOnly) {
                        obj.selectable = false;
                        obj.evented = false;
                    }
                    canvas.add(obj);
                });
                canvas.requestRenderAll();
                saveHistory(); // Save initial state
            });
        } else {
            saveHistory(); // Save empty state
        }

        // Event Listeners for History
        canvas.on('object:added', () => !isHistoryAction.current && saveHistory());
        canvas.on('object:modified', () => !isHistoryAction.current && saveHistory());
        canvas.on('object:removed', () => !isHistoryAction.current && saveHistory());

        return () => {
            canvas.dispose();
        };
    }, [width, height, initialImage, isReadOnly, saveHistory]);

    // Update Tool Settings
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || isReadOnly) return;

        canvas.isDrawingMode = activeTool === 'pen';

        if (activeTool === 'pen') {
            canvas.freeDrawingBrush.color = strokeColor;
            canvas.freeDrawingBrush.width = 3;
            canvas.forEachObject(obj => obj.selectable = false);
        } else {
            canvas.forEachObject(obj => obj.selectable = true);
        }
    }, [activeTool, strokeColor, isReadOnly]);

    // Handle Mouse Events
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || isReadOnly) return;

        const handleMouseDown = (opt: any) => { // Use 'any' to bypass strict v6 vs v7 event type mismatch for now
            if (activeTool === 'pen' || activeTool === 'select') return;

            // v7 getPointer replacement logic or try getting from event
            // In v6+, getPointer might be on the canvas instance but typescript definitions vary.
            // Using a safe fallback or any cast.
            const pointer = (canvas as any).getPointer ? (canvas as any).getPointer(opt.e) : { x: 0, y: 0 };

            // Eraser: Select and delete on click
            if (activeTool === 'eraser') {
                const target = opt.target;
                if (target && target !== canvas.backgroundImage) {
                    canvas.remove(target);
                    canvas.requestRenderAll();
                }
                return;
            }

            if (activeTool === 'rectangle') {
                const rect = new fabric.Rect({
                    left: pointer.x, top: pointer.y, width: 100, height: 60,
                    fill: 'transparent', stroke: strokeColor, strokeWidth: 3,
                    strokeDashArray: lineStyle === 'dashed' ? [10, 5] : lineStyle === 'dotted' ? [3, 3] : undefined
                });
                canvas.add(rect);
                canvas.setActiveObject(rect);
                setActiveTool('select');
            } else if (activeTool === 'circle') {
                const circle = new fabric.Circle({
                    left: pointer.x, top: pointer.y, radius: 40,
                    fill: 'transparent', stroke: strokeColor, strokeWidth: 3,
                    strokeDashArray: lineStyle === 'dashed' ? [10, 5] : lineStyle === 'dotted' ? [3, 3] : undefined
                });
                canvas.add(circle);
                canvas.setActiveObject(circle);
                setActiveTool('select');
            } else if (activeTool === 'line') {
                const line = new fabric.Line([pointer.x, pointer.y, pointer.x + 100, pointer.y], {
                    stroke: strokeColor, strokeWidth: 3,
                    strokeDashArray: lineStyle === 'dashed' ? [10, 5] : lineStyle === 'dotted' ? [3, 3] : undefined
                });
                canvas.add(line);
                canvas.setActiveObject(line);
                setActiveTool('select');
            } else if (activeTool === 'arrow') {
                // Simple arrow implementation using a group of line and triangle
                const line = new fabric.Line([pointer.x, pointer.y, pointer.x + 80, pointer.y], {
                    stroke: strokeColor, strokeWidth: 3,
                    strokeDashArray: lineStyle === 'dashed' ? [10, 5] : lineStyle === 'dotted' ? [3, 3] : undefined,
                    originX: 'center', originY: 'center'
                });

                const head = new fabric.Triangle({
                    width: 15, height: 15, fill: strokeColor, left: pointer.x + 80, top: pointer.y,
                    angle: 90, originX: 'center', originY: 'center'
                });

                const group = new fabric.Group([line, head], {
                    left: pointer.x, top: pointer.y
                });

                canvas.add(group);
                canvas.setActiveObject(group);
                setActiveTool('select');
            } else if (activeTool === 'text') {
                const text = new fabric.IText('Type here', {
                    left: pointer.x, top: pointer.y, fontSize: 20,
                    fill: strokeColor, fontFamily: 'Arial'
                });
                canvas.add(text);
                canvas.setActiveObject(text);
                text.enterEditing();
                setActiveTool('select');
            }
        };

        canvas.on('mouse:down', handleMouseDown);

        return () => {
            canvas.off('mouse:down', handleMouseDown);
        };
    }, [activeTool, strokeColor, isReadOnly]);

    // Undo Logic
    const handleUndo = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || history.length === 0) return;

        isHistoryAction.current = true;

        // Save current state to redo stack
        const currentState = JSON.stringify(canvas.toJSON());
        setRedoStack(prev => [...prev, currentState]);

        // Pop last state from history
        const prevState = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));

        canvas.loadFromJSON(prevState, () => {
            canvas.requestRenderAll();

            // Re-apply background image if lost
            if (initialImage && !canvas.backgroundImage) {
                const options = { crossOrigin: 'anonymous' } as any;
                fabric.Image.fromURL(initialImage, options).then((img) => {
                    img.set({
                        left: 0, top: 0,
                        scaleX: width / (img.width || 1),
                        scaleY: height / (img.height || 1),
                        selectable: false, evented: false
                    });
                    canvas.backgroundImage = img;
                    canvas.requestRenderAll();
                });
            }

            isHistoryAction.current = false;
        });
    }, [history, initialImage, width, height]);

    // Redo Logic
    const handleRedo = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || redoStack.length === 0) return;

        isHistoryAction.current = true;

        // Save current state to history
        const currentState = JSON.stringify(canvas.toJSON());
        setHistory(prev => [...prev, currentState]);

        // Pop from redo stack
        const nextState = redoStack[redoStack.length - 1];
        setRedoStack(prev => prev.slice(0, -1));

        canvas.loadFromJSON(nextState, () => {
            canvas.requestRenderAll();

            // Re-apply background image if needed
            if (initialImage && !canvas.backgroundImage) {
                const options = { crossOrigin: 'anonymous' } as any;
                fabric.Image.fromURL(initialImage, options).then((img) => {
                    img.set({
                        left: 0, top: 0,
                        scaleX: width / (img.width || 1),
                        scaleY: height / (img.height || 1),
                        selectable: false, evented: false
                    });
                    canvas.backgroundImage = img;
                    canvas.requestRenderAll();
                });
            }

            isHistoryAction.current = false;
        });
    }, [redoStack, initialImage, width, height]);

    const handleSave = useCallback(async () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        setIsSaving(true);
        try {
            // 1. Export Image (Additive: Background + New Strokes)
            const dataUrl = canvas.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: 2, // Retina scaling
                enableRetinaScaling: true
            });

            // 2. Export Objects
            const objects: AnnotationObject[] = canvas.getObjects().map((obj, idx) => ({
                id: `obj-${Date.now()}-${idx}`,
                type: obj.type as any,
                left: obj.left || 0, top: obj.top || 0,
                width: obj.width, height: obj.height,
                fill: obj.fill as string, stroke: obj.stroke as string,
                fabricData: JSON.stringify(obj.toJSON()) // Serialize as JSON string to avoid Firestore nested array errors
            }));

            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const authorName = currentUser ? `${currentUser.displayName || 'User'}` : 'Guest Reviewer';

            const downloadUrl = await uploadAnnotation(ownerId, resumeId, blob, authorName, objects);

            if (onSave) onSave(downloadUrl, objects);
            alert("Annotation saved successfully!");
        } catch (error) {
            console.error("Failed to save annotation:", error);
            alert("Failed to save annotation. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }, [currentUser, ownerId, resumeId, onSave]);

    const handleDelete = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObj = canvas.getActiveObject();
        if (!activeObj) return;

        // CRITICAL: Check if text is being edited
        if (activeObj.type === 'i-text' || activeObj.type === 'text') {
            const textObj = activeObj as fabric.IText;
            if (textObj.isEditing) {
                // Do NOT delete - let default text editing handle it
                return;
            }
        }

        // Delete the object
        canvas.remove(activeObj);
        canvas.discardActiveObject();
        canvas.requestRenderAll();
    }, []);

    // Keyboard Shortcuts
    useEffect(() => {
        if (isReadOnly) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Undo: Cmd+Z / Ctrl+Z
            if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
            }
            // Redo: Cmd+Shift+Z / Ctrl+Y
            if (((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') ||
                ((e.metaKey || e.ctrlKey) && e.key === 'y')) {
                e.preventDefault();
                handleRedo();
            }
            // Save: Cmd+S / Ctrl+S
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
            // Delete: Backspace / Delete
            if (e.key === 'Backspace' || e.key === 'Delete') {
                const canvas = fabricCanvasRef.current;
                if (!canvas) return;

                const activeObj = canvas.getActiveObject();
                if (!activeObj) return;

                // CRITICAL FIX: Don't delete text object if it's being edited
                if (activeObj.type === 'i-text' || activeObj.type === 'text') {
                    const textObj = activeObj as fabric.IText;
                    if (textObj.isEditing) {
                        // Allow default text editing behavior
                        return;
                    }
                }

                // Otherwise delete the object
                e.preventDefault();
                handleDelete();
            }
            // Esc: Cancel/Deselect
            if (e.key === 'Escape') {
                const canvas = fabricCanvasRef.current;
                if (canvas) {
                    canvas.discardActiveObject();
                    canvas.requestRenderAll();
                    setActiveTool('select');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo, handleSave, handleDelete, isReadOnly]);

    const handleClear = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !confirm('Clear all annotations?')) return;
        canvas.clear();
        canvas.backgroundColor = 'transparent';
        // Restore background
        if (initialImage) {
            const options = { crossOrigin: 'anonymous' } as any;
            fabric.Image.fromURL(initialImage, options).then((img) => {
                img.set({
                    left: 0, top: 0,
                    scaleX: width / (img.width || 1),
                    scaleY: height / (img.height || 1),
                    selectable: false, evented: false
                });
                canvas.backgroundImage = img;
                canvas.requestRenderAll();
            });
        }
        saveHistory();
    };

    if (isReadOnly) {
        return (
            <div className="absolute inset-0 z-50 pointer-events-none">
                <canvas ref={canvasRef} />
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-20 pointer-events-auto overflow-hidden">
            {/* @ts-ignore */}
            <Draggable handle=".drag-handle" bounds="parent" defaultPosition={{ x: 0, y: 0 }}>
                <div className="absolute top-4 left-4 z-30 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 p-2 flex items-center gap-2 cursor-auto">
                    {/* Drag Handle */}
                    <div className="drag-handle cursor-move text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 px-1">
                        <GripVertical size={20} />
                    </div>

                    <div className="border-l dark:border-gray-600 h-8 mx-1" />

                    <button onClick={() => setActiveTool('pen')}
                        className={`p-2 rounded-md ${activeTool === 'pen' ? 'bg-red-100 text-red-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Pen">
                        <Pen size={18} />
                    </button>
                    <button onClick={() => setActiveTool('rectangle')}
                        className={`p-2 rounded-md ${activeTool === 'rectangle' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Rectangle">
                        <Square size={18} />
                    </button>
                    <button onClick={() => setActiveTool('circle')}
                        className={`p-2 rounded-md ${activeTool === 'circle' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Circle">
                        <Circle size={18} />
                    </button>
                    <button onClick={() => setActiveTool('line')}
                        className={`p-2 rounded-md ${activeTool === 'line' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Line">
                        <Minus size={18} />
                    </button>
                    <button onClick={() => setActiveTool('arrow')}
                        className={`p-2 rounded-md ${activeTool === 'arrow' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Arrow">
                        <ArrowRight size={18} />
                    </button>
                    <button onClick={() => setActiveTool('text')}
                        className={`p-2 rounded-md ${activeTool === 'text' ? 'bg-green-100 text-green-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Text">
                        <Type size={18} />
                    </button>
                    <button onClick={() => setActiveTool('eraser')}
                        className={`p-2 rounded-md ${activeTool === 'eraser' ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Eraser (Click to delete)">
                        <Eraser size={18} />
                    </button>

                    <div className="border-l dark:border-gray-600 h-8 mx-1" />

                    <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer" />

                    <select
                        value={lineStyle}
                        onChange={(e) => setLineStyle(e.target.value as LineStyle)}
                        className="h-8 rounded border-gray-300 text-xs"
                        title="Line Style"
                    >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                    </select>

                    <div className="border-l dark:border-gray-600 h-8 mx-1" />

                    <button onClick={handleUndo} disabled={history.length === 0}
                        className="p-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                        title="Undo (Cmd+Z)">
                        <Undo size={18} />
                    </button>
                    <button onClick={handleRedo} disabled={redoStack.length === 0}
                        className="p-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                        title="Redo (Cmd+Shift+Z)">
                        <Redo size={18} />
                    </button>
                    <button onClick={handleClear} className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
                        title="Clear All">
                        <Trash size={18} />
                    </button>
                    <button onClick={handleSave} disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        title="Save (Cmd+S)">
                        {isSaving ? <><Loader2 size={18} className="animate-spin" /><span>Saving...</span></>
                            : <><Save size={18} /><span>Save</span></>}
                    </button>
                </div>
            </Draggable>
            <canvas ref={canvasRef} className="absolute inset-0" />
        </div>
    );
};

export default AdvancedAnnotationCanvas;
