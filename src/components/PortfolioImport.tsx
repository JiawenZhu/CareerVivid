import React, { useState, useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import TextareaAutosize from 'react-textarea-autosize';
import { UploadCloud, FileCode, Loader2, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { useTranslation } from 'react-i18next';

// Configure PDF.js worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PortfolioImportProps {
    onFileProcessed?: (text: string) => void;
    value?: string;
    onChange?: (text: string) => void;
    placeholder?: string;
    isReadOnly?: boolean;
    className?: string;
    children?: React.ReactNode;
}

const PortfolioImport: React.FC<PortfolioImportProps> = ({
    onFileProcessed,
    value,
    onChange,
    placeholder,
    isReadOnly = false,
    className,
    children
}) => {
    const { t } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

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
            } else {
                // Assume text/code file
                extractedText = await file.text();
            }

            if (!extractedText.trim()) {
                throw new Error("Could not extract text from file.");
            }

            if (onChange) {
                onChange(extractedText);
            } else {
                setInternalValue(extractedText);
            }

            if (onFileProcessed) {
                onFileProcessed(extractedText);
            }

        } catch (err: any) {
            console.error("File processing error:", err);
            setError(err.message || 'Failed to process file.');
        } finally {
            setIsProcessing(false);
        }
    };

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (fileRejections.length > 0) {
            setError('Invalid file type.');
            return;
        }

        if (acceptedFiles.length > 0) {
            processFile(acceptedFiles[0]);
        }
    }, [onChange, onFileProcessed]);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt', '.md', '.markdown'],
            'text/html': ['.html', '.htm'],
            'text/css': ['.css'],
            'text/javascript': ['.js', '.jsx', '.ts', '.tsx'],
            'application/json': ['.json']
        },
        maxFiles: 1,
        disabled: isProcessing || isReadOnly,
        noClick: true,
        onDragEnter: () => setDragActive(true),
        onDragLeave: () => setDragActive(false),
        onDropAccepted: () => setDragActive(false)
    });

    return (
        <div className={`w-full ${className || ''}`}>
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
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/20'
                        : 'border-transparent bg-gray-100 dark:bg-gray-800 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50'
                    }
                    ${isReadOnly ? 'cursor-not-allowed opacity-60' : ''}
                `}
            >
                <input {...getInputProps()} />

                <button
                    type="button"
                    onClick={open}
                    disabled={isProcessing || isReadOnly}
                    className="flex-shrink-0 p-3 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 transition-colors"
                    title="Upload Resume or Code"
                >
                    {isProcessing ? (
                        <Loader2 size={20} className="animate-spin text-indigo-500" />
                    ) : (
                        <UploadCloud size={20} />
                    )}
                </button>

                <div className="flex-grow relative min-h-[46px] flex items-center">
                    <TextareaAutosize
                        minRows={1}
                        maxRows={8}
                        placeholder={isDragActive ? 'Drop file here...' : (placeholder || 'Describe your dream portfolio...')}
                        className="w-full bg-transparent border-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-base resize-none focus:ring-0 focus:outline-none outline-none p-0 m-0 leading-relaxed"
                        value={textValue}
                        onChange={handleTextChange}
                        disabled={isProcessing || isReadOnly}
                    />
                </div>

                {children && (
                    <div className="flex-shrink-0">
                        {children}
                    </div>
                )}
            </div>

            <div className="flex justify-between mt-2 px-1">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                    Supports PDF, DOCX, TXT, HTML, CSS, JS, React, etc.
                </p>
            </div>
        </div>
    );
};

export default PortfolioImport;
