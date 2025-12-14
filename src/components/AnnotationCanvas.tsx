import React, { useRef, useState } from 'react';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';
import { Pen, Eraser, Undo, Save, Trash, Loader2 } from 'lucide-react';
import { uploadAnnotation } from '../services/annotationService';

interface AnnotationCanvasProps {
    resumeId: string;
    ownerId: string;
    currentUser?: any;
    onSave?: (url: string) => void;
    width: string;
    height: string;
    initialImage?: string | null;
}

const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
    resumeId,
    ownerId,
    currentUser,
    onSave,
    width,
    height,
    initialImage
}) => {
    const canvasRef = useRef<ReactSketchCanvasRef>(null);
    const [isEraser, setIsEraser] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [strokeColor, setStrokeColor] = useState('#ef4444'); // Default red

    const handleSave = async () => {
        if (!canvasRef.current) return;

        setIsSaving(true);
        try {
            // Step 1: Export current strokes as transparent PNG
            const strokesDataUrl = await canvasRef.current.exportImage('png');

            // Step 2: Create a canvas to merge layers
            const mergeCanvas = document.createElement('canvas');
            mergeCanvas.width = 824; // Match resume width
            mergeCanvas.height = 1165; // Match resume height
            const ctx = mergeCanvas.getContext('2d');

            if (!ctx) throw new Error('Failed to get canvas context');

            // Step 3: Draw background image (previous annotations) if exists
            if (initialImage) {
                const bgImage = new Image();
                bgImage.crossOrigin = 'anonymous';
                await new Promise<void>((resolve, reject) => {
                    bgImage.onload = () => resolve();
                    bgImage.onerror = () => reject(new Error('Failed to load background image'));
                    bgImage.src = initialImage;
                });
                ctx.drawImage(bgImage, 0, 0, mergeCanvas.width, mergeCanvas.height);
            }

            // Step 4: Draw new strokes on top
            const strokesImage = new Image();
            await new Promise<void>((resolve, reject) => {
                strokesImage.onload = () => resolve();
                strokesImage.onerror = () => reject(new Error('Failed to load strokes'));
                strokesImage.src = strokesDataUrl;
            });
            ctx.drawImage(strokesImage, 0, 0, mergeCanvas.width, mergeCanvas.height);

            // Step 5: Export merged canvas as blob
            const blob = await new Promise<Blob>((resolve, reject) => {
                mergeCanvas.toBlob((b) => {
                    if (b) resolve(b);
                    else reject(new Error('Failed to create blob'));
                }, 'image/png');
            });

            // Step 6: Upload merged annotation
            const authorName = currentUser
                ? `${currentUser.displayName || 'User'}`
                : 'Guest Reviewer';

            const downloadUrl = await uploadAnnotation(ownerId, resumeId, blob, authorName);

            if (onSave) onSave(downloadUrl);
            alert("Annotation saved successfully!");
        } catch (error) {
            console.error("Failed to save annotation:", error);
            alert("Failed to save annotation. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="absolute inset-0 z-40 pointer-events-auto">
            {/* Toolbar */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 shadow-lg rounded-full px-4 py-2 flex items-center gap-4 border border-gray-200 dark:border-gray-700 z-50">
                <button
                    onClick={() => { setIsEraser(false); setStrokeColor('#ef4444'); }}
                    className={`p-2 rounded-full transition-colors ${!isEraser && strokeColor === '#ef4444' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    title="Red Pen"
                >
                    <Pen size={18} className="text-red-500" />
                </button>

                <button
                    onClick={() => { setIsEraser(false); setStrokeColor('#3b82f6'); }}
                    className={`p-2 rounded-full transition-colors ${!isEraser && strokeColor === '#3b82f6' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    title="Blue Pen"
                >
                    <Pen size={18} className="text-blue-500" />
                </button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

                <button
                    onClick={() => setIsEraser(true)}
                    className={`p-2 rounded-full transition-colors ${isEraser ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    title="Eraser"
                >
                    <Eraser size={18} />
                </button>

                <button
                    onClick={() => canvasRef.current?.undo()}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Undo"
                >
                    <Undo size={18} />
                </button>

                <button
                    onClick={() => canvasRef.current?.clearCanvas()}
                    className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                    title="Clear All"
                >
                    <Trash size={18} />
                </button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-1.5 rounded-full hover:bg-primary-700 transition-colors disabled:opacity-70"
                >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span className="text-sm font-medium">Save</span>
                </button>
            </div>

            {/* Canvas */}
            <ReactSketchCanvas
                ref={canvasRef}
                strokeWidth={3}
                strokeColor={isEraser ? '#ffffff' : strokeColor}
                canvasColor="transparent"
                backgroundImage={initialImage || undefined}
                width={width}
                height={height}
                style={{ border: 'none' }}
            />
        </div>
    );
};

export default AnnotationCanvas;
