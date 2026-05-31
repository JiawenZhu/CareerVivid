import React from 'react';
import { FileText, Loader2, Sparkles, Wand2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AddJobPastePanelProps {
    description: string;
    setDescription: React.Dispatch<React.SetStateAction<string>>;
    error: string;
    isLoading: boolean;
    onClose: () => void;
    onSubmit: (event: React.FormEvent) => void;
}

const AddJobPastePanel: React.FC<AddJobPastePanelProps> = ({
    description,
    setDescription,
    error,
    isLoading,
    onClose,
    onSubmit,
}) => {
    const { t } = useTranslation();

    return (
        <>
            <header className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-[#2e2b38]">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                        <Sparkles size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {t('job_tracker.modal.track_new_title')}
                    </h2>
                </div>
                <button onClick={onClose} className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-[#2c2937]">
                    <X size={18} />
                </button>
            </header>

            <form onSubmit={onSubmit} className="p-6">
                <p className="mb-5 text-sm text-gray-600 dark:text-gray-300">
                    {t('job_tracker.modal.paste_desc')}
                </p>
                <div className="group relative">
                    <FileText className="absolute left-3 top-3.5 text-gray-400 transition-colors group-focus-within:text-indigo-500" size={20} />
                    <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder={t('job_tracker.modal.paste_placeholder')}
                        required
                        rows={12}
                        className="w-full resize-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-gray-900 shadow-inner transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-[#2e2b38] dark:bg-[#201e27] dark:text-gray-100"
                    />
                </div>
                {error && (
                    <div className="mt-3 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500 dark:bg-red-500/20">
                        {error}
                    </div>
                )}
                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 font-semibold text-white shadow-lg transition-all hover:bg-indigo-700 hover:shadow-indigo-500/20 active:scale-95 disabled:bg-indigo-400 disabled:scale-100"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                        {isLoading ? t('job_tracker.modal.analyzing') : t('job_tracker.modal.analyze_btn')}
                    </button>
                </div>
            </form>
        </>
    );
};

export default AddJobPastePanel;
