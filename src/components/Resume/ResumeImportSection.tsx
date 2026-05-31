import React from 'react';
import { UploadCloud, ChevronUp, ChevronDown, CheckCircle, Loader2, Wand2 } from 'lucide-react';
import ResumeImport from '../ResumeImport';

interface ResumeImportSectionProps {
    t: any;
    isImportExpanded: boolean;
    setIsImportExpanded: (value: boolean) => void;
    importSuccess: boolean;
    importText: string;
    setImportText: (value: string) => void;
    handleImportText: (text: string) => void;
    isParsing: boolean;
    isReadOnly?: boolean;
}

const ResumeImportSection: React.FC<ResumeImportSectionProps> = ({
    t,
    isImportExpanded,
    setIsImportExpanded,
    importSuccess,
    importText,
    setImportText,
    handleImportText,
    isParsing,
    isReadOnly
}) => {
    return (
        <div className="overflow-hidden rounded-xl border border-[#e8dfd3] bg-white shadow-sm transition-all duration-300 dark:border-gray-800 dark:bg-gray-900/70">
            <button
                onClick={() => setIsImportExpanded(!isImportExpanded)}
                className="flex w-full items-center justify-between bg-[#fbf8f3] p-4 transition-colors hover:bg-[#f3eee6] dark:bg-gray-900/80 dark:hover:bg-gray-800/80"
                type="button"
            >
                <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 transition-colors ${isImportExpanded ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-white text-slate-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                        <UploadCloud size={20} />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-black text-slate-900 dark:text-gray-100">{t('resume_form.import_resume')}</h3>
                        {importSuccess ? (
                            <p className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1 animate-in fade-in duration-300">
                                <CheckCircle size={12} /> {t('resume_form.import_success', 'Imported successfully!')}
                            </p>
                        ) : (
                            <p className="text-xs text-slate-500 dark:text-gray-400">{t('resume_form.autofill_desc')}</p>
                        )}
                    </div>
                </div>
                {isImportExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>

            {isImportExpanded && (
                <div className="p-6 animate-fade-in bg-white dark:bg-gray-800">
                    <ResumeImport
                        onFileProcessed={handleImportText}
                        value={importText}
                        onChange={setImportText}
                        isReadOnly={isReadOnly}
                        variant="classic"
                    >
                        <button
                            onClick={() => handleImportText(importText)}
                            disabled={!importText.trim() || isParsing}
                            className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {isParsing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                            {t('resume_form.import_button', 'Import')}
                        </button>
                    </ResumeImport>
                </div>
            )}
        </div>
    );
};

export default ResumeImportSection;
