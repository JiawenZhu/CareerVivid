import { useState, useCallback } from 'react';
import { removePdfPages } from '../utils/pdfUtils';

interface UsePdfEditorReturn {
  pdfBuffer: Uint8Array | null;
  setPdfBuffer: (buffer: Uint8Array | null) => void;
  removePages: (indices: number[]) => Promise<void>;
  isProcessing: boolean;
  error: string | null;
}

/**
 * Hook to manage PDF state and manipulation.
 */
export function usePdfEditor(initialBuffer: Uint8Array | null = null): UsePdfEditorReturn {
  const [pdfBuffer, setPdfBufferState] = useState<Uint8Array | null>(initialBuffer);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setPdfBuffer = useCallback((buffer: Uint8Array | null) => {
    setPdfBufferState(buffer);
    setError(null);
  }, []);

  const removePages = useCallback(async (indices: number[]) => {
    if (!pdfBuffer) {
      setError('No PDF buffer available to process.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const updatedBuffer = await removePdfPages(pdfBuffer, indices);
      setPdfBufferState(updatedBuffer);
    } catch (err: any) {
      console.error('Failed to remove PDF pages:', err);
      setError(err.message || 'An error occurred while manipulating the PDF.');
    } finally {
      setIsProcessing(false);
    }
  }, [pdfBuffer]);

  return {
    pdfBuffer,
    setPdfBuffer,
    removePages,
    isProcessing,
    error
  };
}
