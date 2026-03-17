import React, { useState, useMemo } from 'react';
import { usePdfEditor } from '../hooks/usePdfEditor';
import { Trash2, Download, Check, AlertTriangle, Loader2, FileText } from 'lucide-react';

interface PdfPageEditorProps {
  initialBuffer: Uint8Array;
  fileName: string;
  onClose: () => void;
}

/**
 * A modal-like component to edit PDF pages before download.
 * Similar to ilovepdf.com experience.
 */
export const PdfPageEditor: React.FC<PdfPageEditorProps> = ({
  initialBuffer,
  fileName,
  onClose,
}) => {
  const { pdfBuffer, removePages, isProcessing, error } = usePdfEditor(initialBuffer);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  const pdfUrl = useMemo(() => {
    if (!pdfBuffer) return '';
    // Use the underlying buffer directly to satisfy stricter types
    const blob = new Blob([pdfBuffer.buffer as ArrayBuffer], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  }, [pdfBuffer]);

  const handleTogglePage = (index: number) => {
    setSelectedPages(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleRemoveSelected = async () => {
    if (selectedPages.length === 0) return;
    await removePages(selectedPages);
    setSelectedPages([]);
  };

  const handleDownload = () => {
    if (!pdfBuffer) return;
    const blob = new Blob([pdfBuffer.buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-6xl h-full max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="text-primary-500" />
              PDF Page Editor
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Select and remove unwanted pages (e.g., blank trailing pages) before downloading.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={isProcessing || !pdfBuffer}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/20 active:scale-95 disabled:opacity-50"
            >
              <Download size={18} />
              Download Final PDF
            </button>
          </div>
        </div>

        {/* Info / Error bar */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 px-6 py-3 border-b border-red-100 dark:border-red-900/30 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Main Preview (IFrame fallback if no Viewer) */}
          <div className="flex-1 bg-gray-100 dark:bg-gray-800/50 relative">
            {isProcessing ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-10 backdrop-blur-[2px]">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing PDF...</p>
                </div>
              </div>
            ) : (
              <iframe
                src={`${pdfUrl}#toolbar=0`}
                className="w-full h-full border-none"
                title="PDF Preview"
              />
            )}
          </div>

          {/* Sidebar / Page Selection */}
          <div className="w-80 border-l border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {selectedPages.length} Pages Selected
              </span>
              <button
                onClick={handleRemoveSelected}
                disabled={selectedPages.length === 0 || isProcessing}
                className="text-red-600 hover:text-red-700 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1.5 text-sm font-bold"
              >
                <Trash2 size={16} />
                Remove
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  Tip: Look for the last page. In browser PDF previews, an extra blank page is often added due to height variance.
                </p>
              </div>

              {/* Minimal "Page" List Placeholder */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Document Control</p>
                
                {/* 
                  Note: In a full impl, we would use pdfjs to generate thumbnails for each page here 
                  For now we provide a functional page index list
                */}
                {[1, 2, 3].map((num, i) => (
                  <button
                    key={i}
                    onClick={() => handleTogglePage(i)}
                    className={`
                      group p-3 rounded-xl border flex items-center justify-between transition-all
                      ${selectedPages.includes(i)
                        ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30'
                        : 'bg-white border-gray-100 hover:border-primary-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-primary-900/30'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                        ${selectedPages.includes(i) ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}
                      `}>
                        {num}
                      </div>
                      <span className={`text-sm font-medium ${selectedPages.includes(i) ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        Page {num}
                      </span>
                    </div>
                    {selectedPages.includes(i) ? (
                      <Trash2 size={16} className="text-red-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-gray-200 dark:border-gray-600 group-hover:border-primary-400" />
                    )}
                  </button>
                ))}
                
                <p className="text-[10px] text-gray-400 text-center mt-2 italic px-4">
                  Note: Clicking 'Remove' permanently deletes the page from your current download buffer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
