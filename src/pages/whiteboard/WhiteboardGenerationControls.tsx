import React from 'react';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';

interface GenerationStage {
    current: number;
    total: number;
    label: string;
}

interface WhiteboardGenerationControlsProps {
    derivedReadOnly: boolean;
    generationStage: GenerationStage | null;
    onOpenModal: () => void;
}

const WhiteboardGenerationControls: React.FC<WhiteboardGenerationControlsProps> = ({
    derivedReadOnly,
    generationStage,
    onOpenModal
}) => {
    if (derivedReadOnly) return null;

    return (
        <>
            <button
                onClick={onOpenModal}
                disabled={!!generationStage}
                className="absolute top-3 right-[100px] sm:right-28 z-[9999] flex h-10 items-center justify-center gap-2 rounded-xl border border-primary-100 bg-white/95 px-3 text-sm font-extrabold text-gray-900 shadow-[0_10px_30px_rgba(79,70,229,0.16)] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50 hover:shadow-[0_14px_34px_rgba(79,70,229,0.22)] active:scale-95 disabled:cursor-wait disabled:opacity-70 dark:border-primary-500/20 dark:bg-gray-900/95 dark:text-gray-100 dark:hover:bg-primary-950/30 md:px-4 pointer-events-auto"
            >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
                    {generationStage ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
                </span>
                <span className="hidden md:inline">{generationStage ? 'Building...' : 'AI Generate'}</span>
            </button>

            {generationStage && (
                <div className="pointer-events-none absolute right-4 top-16 z-[9998] w-[280px] rounded-2xl border border-primary-100 bg-white/95 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur dark:border-primary-500/20 dark:bg-gray-900/95">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
                            <Sparkles size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-extrabold text-gray-950 dark:text-white">Drawing step by step</p>
                            <p className="mt-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">{generationStage.label}</p>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                <div
                                    className="h-full rounded-full bg-primary-600 transition-all duration-300"
                                    style={{ width: `${Math.max(8, (generationStage.current / generationStage.total) * 100)}%` }}
                                />
                            </div>
                            <p className="mt-2 text-[11px] font-bold text-primary-700 dark:text-primary-300">
                                Step {Math.max(1, generationStage.current)} of {generationStage.total}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default WhiteboardGenerationControls;
