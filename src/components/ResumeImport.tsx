import React, { useState, useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import TextareaAutosize from 'react-textarea-autosize';
import { UploadCloud, FileText, Loader2, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { useTranslation } from 'react-i18next';

// Configure PDF.js worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface ResumeImportProps {
    onImport?: (text: string) => Promise<void>; // Kept for backward compatibility if needed, or we can deprecate
    onFileProcessed?: (text: string) => void;
    value?: string;
    onChange?: (text: string) => void;
    placeholder?: string;
    isReadOnly?: boolean;
    className?: string; // Allow passing custom classes for styling flexibility
    children?: React.ReactNode;
    variant?: 'classic' | 'modern';
}

const ResumeImport: React.FC<ResumeImportProps> = ({
    onImport,
    onFileProcessed,
    value,
    onChange,
    placeholder,
    isReadOnly = false,
    className,
    children,
    variant = 'modern'
}) => {
    const { t } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    // Internal state for uncontrolled mode if value/onChange are not provided
    const [internalValue, setInternalValue] = useState('');

    const textValue = value !== undefined ? value : internalValue;

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        if (onChange) {
            onChange(newValue);
        } else {
            setInternalValue(newValue);
        }
    };

    const extractTextFromPdf = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n\n';
        }

        return fullText;
    };

    const extractTextFromDocx = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    };

    const processFile = async (file: File) => {
        setIsProcessing(true);
        setError(null);
        let extractedText = '';

        try {
            if (file.type === 'application/pdf') {
                extractedText = await extractTextFromPdf(file);
            } else if (
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.name.endsWith('.docx')
            ) {
                extractedText = await extractTextFromDocx(file);
            } else if (file.type === 'text/plain' || file.type === 'text/markdown' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
                extractedText = await file.text();
            } else {
                throw new Error(t('resume_form.unsupported_file_type', 'Unsupported file type. Please upload PDF, DOCX, or TXT.'));
            }

            if (!extractedText.trim()) {
                throw new Error(t('resume_form.empty_file', 'Could not extract text from file.'));
            }

            // Update text area
            if (onChange) {
                onChange(extractedText);
            } else {
                setInternalValue(extractedText);
            }

            // Notify parent about file processing completion
            if (onFileProcessed) {
                onFileProcessed(extractedText);
            }

            // Legacy/Direct import handler
            if (onImport) {
                await onImport(extractedText);
            }

        } catch (err: any) {
            console.error("File processing error:", err);
            setError(err.message || t('resume_form.import_error', 'Failed to process file.'));
        } finally {
            setIsProcessing(false);
        }
    };

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (fileRejections.length > 0) {
            setError(t('resume_form.invalid_file', 'Invalid file type. Please upload PDF, DOCX, or TXT.'));
            return;
        }

        if (acceptedFiles.length > 0) {
            processFile(acceptedFiles[0]);
        }
    }, [t, onChange, onFileProcessed, onImport]);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt', '.md', '.markdown']
        },
        maxFiles: 1,
        disabled: isProcessing || isReadOnly,
        noClick: variant === 'modern', // Classic: Click anywhere on box. Modern: Click button only.
        onDragEnter: () => setDragActive(true),
        onDragLeave: () => setDragActive(false),
        onDropAccepted: () => setDragActive(false)
    });

    const renderModern = () => (
        <div className={`w-full ${className || ''}`}>
            {/* Error Message */}
            {error && (
                <div className="mb-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-start animate-in slide-in-from-top-2">
                    <AlertCircle size={16} className="mt-0.5 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div
                {...getRootProps()}
                className={`
                    relative flex items-end gap-2 p-2 rounded-xl border transition-all duration-300
                    ${isDragActive || dragActive
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/20'
                        : 'border-transparent bg-gray-100 dark:bg-gray-800 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500/50'
                    }
                    ${isReadOnly ? 'cursor-not-allowed opacity-60' : ''}
                `}
            >
                <input {...getInputProps()} />

                {/* Left: File Upload Action */}
                <button
                    type="button"
                    onClick={open}
                    disabled={isProcessing || isReadOnly}
                    className="flex-shrink-0 p-3 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 transition-colors"
                >
                    {isProcessing ? (
                        <Loader2 size={20} className="animate-spin text-primary-500" />
                    ) : (
                        <UploadCloud size={20} />
                    )}
                </button>

                {/* Center: Input Area */}
                <div className="flex-grow relative min-h-[46px] flex items-center">
                    <TextareaAutosize
                        minRows={1}
                        maxRows={8}
                        placeholder={isDragActive ? t('resume_form.drop_file_here', 'Drop file here...') : (placeholder || t('resume_form.paste_placeholder', 'Paste your resume content here...'))}
                        className="w-full bg-transparent border-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-base resize-none focus:ring-0 focus:outline-none outline-none p-0 m-0 leading-relaxed"
                        value={textValue}
                        onChange={handleTextChange}
                        disabled={isProcessing || isReadOnly}
                        onPaste={(e) => { }}
                    />
                </div>

                {/* Right: Custom Action (Submit Button) */}
                {children && (
                    <div className="flex-shrink-0">
                        {children}
                    </div>
                )}
            </div>

            <div className="flex justify-between mt-2 px-1">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                    {t('resume_form.supports_formats', 'Supports PDF, DOCX, TXT')}
                </p>
            </div>
        </div>
    );

    const renderClassic = () => (
        <div className={`w-full ${className || ''}`}>
            <div
                {...getRootProps()}
                className={`
                    relative group border-2 border-dashed rounded-xl p-6 transition-all duration-300
                    flex flex-col items-center justify-center text-center min-h-[160px]
                    ${isDragActive || dragActive
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-900/30 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-white dark:hover:bg-gray-800'
                    }
                    ${isReadOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                `}
            >
                <input {...getInputProps()} />

                {isProcessing ? (
                    <div className="flex flex-col items-center animate-in fade-in duration-300">
                        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-3" />
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('resume_form.analyzing_document', 'Analyzing document...')}</p>
                    </div>
                ) : (
                    <>
                        <div className={`
                            p-3 rounded-full mb-3 transition-colors duration-300
                            ${isDragActive
                                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 group-hover:bg-primary-100 group-hover:text-primary-600 dark:group-hover:bg-primary-900/50 dark:group-hover:text-primary-400'
                            }
                        `}>
                            <UploadCloud size={24} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1">
                            {isDragActive ? t('resume_form.drop_file_here', 'Drop file here') : t('resume_form.click_upload_drag', 'Click to Upload or Drag & Drop')}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                            {t('resume_form.supports_formats', 'Supports PDF, DOCX, TXT')}
                        </p>
                    </>
                )}

                {/* Manual Text Divider */}
                {!isProcessing && (
                    <div className="w-full flex items-center gap-4 my-2 px-8 opacity-60">
                        <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('resume_form.or_paste_text', 'OR PASTE TEXT')}</span>
                        <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-start animate-in slide-in-from-top-2">
                    <AlertCircle size={16} className="mt-0.5 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Auto-expanding Textarea */}
            <div className="mt-4 relative">
                <TextareaAutosize
                    minRows={3}
                    maxRows={20}
                    placeholder={placeholder || t('resume_form.paste_placeholder', 'Paste your resume content here...')}
                    className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm resize-none"
                    value={textValue}
                    onChange={handleTextChange}
                    disabled={isProcessing || isReadOnly}
                />
                <div className="absolute bottom-2 right-2 pointer-events-none">
                    <FileText size={14} className="text-gray-300 dark:text-gray-600" />
                </div>
            </div>

            {/* Children (Buttons) for Classic Layout */}
            {children && (
                <div className="mt-4 flex justify-end">
                    {children}
                </div>
            )}
        </div>
    );

    return variant === 'modern' ? renderModern() : renderClassic();
};

export default ResumeImport;
