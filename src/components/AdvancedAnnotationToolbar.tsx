import React from 'react';
import Draggable from 'react-draggable';
import {
    ArrowRight,
    Circle,
    Eraser,
    GripVertical,
    Loader2,
    Minus,
    Pen,
    Redo,
    Save,
    Square,
    Trash,
    Type,
    Undo,
} from 'lucide-react';
import type { LineStyle, Tool } from './AdvancedAnnotationCanvas';

interface AdvancedAnnotationToolbarProps {
    activeTool: Tool;
    strokeColor: string;
    lineStyle: LineStyle;
    historyLength: number;
    redoLength: number;
    isSaving: boolean;
    onToolChange: (tool: Tool) => void;
    onStrokeColorChange: (color: string) => void;
    onLineStyleChange: (style: LineStyle) => void;
    onUndo: () => void;
    onRedo: () => void;
    onClear: () => void;
    onSave: () => void;
}

const toolButtonClass = (isActive: boolean, activeClass: string) =>
    `p-2 rounded-md ${isActive ? activeClass : 'text-gray-600 hover:bg-gray-100'}`;

const AdvancedAnnotationToolbar: React.FC<AdvancedAnnotationToolbarProps> = ({
    activeTool,
    strokeColor,
    lineStyle,
    historyLength,
    redoLength,
    isSaving,
    onToolChange,
    onStrokeColorChange,
    onLineStyleChange,
    onUndo,
    onRedo,
    onClear,
    onSave,
}) => {
    return (
        /* @ts-ignore */
        <Draggable handle=".drag-handle" bounds="parent" defaultPosition={{ x: 0, y: 0 }}>
            <div className="absolute top-4 left-4 z-30 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 p-2 flex items-center gap-2 cursor-auto">
                <div className="drag-handle cursor-move text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 px-1">
                    <GripVertical size={20} />
                </div>

                <div className="border-l dark:border-gray-600 h-8 mx-1" />

                <button onClick={() => onToolChange('pen')} className={toolButtonClass(activeTool === 'pen', 'bg-red-100 text-red-600')} title="Pen">
                    <Pen size={18} />
                </button>
                <button onClick={() => onToolChange('rectangle')} className={toolButtonClass(activeTool === 'rectangle', 'bg-purple-100 text-purple-600')} title="Rectangle">
                    <Square size={18} />
                </button>
                <button onClick={() => onToolChange('circle')} className={toolButtonClass(activeTool === 'circle', 'bg-purple-100 text-purple-600')} title="Circle">
                    <Circle size={18} />
                </button>
                <button onClick={() => onToolChange('line')} className={toolButtonClass(activeTool === 'line', 'bg-purple-100 text-purple-600')} title="Line">
                    <Minus size={18} />
                </button>
                <button onClick={() => onToolChange('arrow')} className={toolButtonClass(activeTool === 'arrow', 'bg-purple-100 text-purple-600')} title="Arrow">
                    <ArrowRight size={18} />
                </button>
                <button onClick={() => onToolChange('text')} className={toolButtonClass(activeTool === 'text', 'bg-green-100 text-green-600')} title="Text">
                    <Type size={18} />
                </button>
                <button onClick={() => onToolChange('eraser')} className={toolButtonClass(activeTool === 'eraser', 'bg-gray-200 text-gray-800')} title="Eraser (Click to delete)">
                    <Eraser size={18} />
                </button>

                <div className="border-l dark:border-gray-600 h-8 mx-1" />

                <input type="color" value={strokeColor} onChange={(e) => onStrokeColorChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                <select value={lineStyle} onChange={(e) => onLineStyleChange(e.target.value as LineStyle)} className="h-8 rounded border-gray-300 text-xs" title="Line Style">
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                </select>

                <div className="border-l dark:border-gray-600 h-8 mx-1" />

                <button onClick={onUndo} disabled={historyLength === 0} className="p-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-30" title="Undo (Cmd+Z)">
                    <Undo size={18} />
                </button>
                <button onClick={onRedo} disabled={redoLength === 0} className="p-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-30" title="Redo (Cmd+Shift+Z)">
                    <Redo size={18} />
                </button>
                <button onClick={onClear} className="p-2 rounded-md text-gray-600 hover:bg-gray-100" title="Clear All">
                    <Trash size={18} />
                </button>
                <button onClick={onSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50" title="Save (Cmd+S)">
                    {isSaving ? <><Loader2 size={18} className="animate-spin" /><span>Saving...</span></> : <><Save size={18} /><span>Save</span></>}
                </button>
            </div>
        </Draggable>
    );
};

export default AdvancedAnnotationToolbar;
