import React, { useEffect, useState } from 'react';
import ResumePreview from '../components/ResumePreview';
import { ResumeData, TemplateId } from '../types';

type PdfPayload = {
  resumeData: ResumeData;
  templateId: TemplateId;
};

declare global {
  interface Window {
    __PDF_STATUS__?: 'loading' | 'ready' | 'rendered';
    __RENDER_PAYLOAD__?: (payload: PdfPayload) => void;
  }
}

const decodePayloadFromHash = (): PdfPayload | null => {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash || '';
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) return null;

  const params = new URLSearchParams(hash.substring(queryIndex + 1));
  const encoded = params.get('data');
  if (!encoded) return null;

  try {
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded =
      normalized.length % 4 === 0
        ? normalized
        : normalized + '='.repeat(4 - (normalized.length % 4));
    const json = atob(padded);
    return JSON.parse(json);
  } catch (error) {
    console.warn('Failed to decode PDF preview payload', error);
    return null;
  }
};

const PdfPreviewPage: React.FC = () => {
  const [payload, setPayload] = useState<PdfPayload | null>(() => decodePayloadFromHash());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.__PDF_STATUS__ = 'ready';

    window.__RENDER_PAYLOAD__ = (incoming: PdfPayload) => {
      if (incoming?.resumeData && incoming?.templateId) {
        setPayload(incoming);
        setError(null);
      } else {
        setError('Invalid resume payload received');
      }
    };

    const pending = (window as any).__PENDING_PAYLOAD__ as PdfPayload | undefined;
    if (pending) {
      setPayload(pending);
      (window as any).__PENDING_PAYLOAD__ = undefined;
    }

    return () => {
      window.__RENDER_PAYLOAD__ = undefined;
    };
  }, []);

  useEffect(() => {
    const renderContent = async () => {
      if (payload) {
        // 1. Wait for Fonts to Load (Critical for PDF embedding)
        try {
          await document.fonts.ready;
        } catch (e) {
          console.warn('Font loading timeout or error', e);
        }

        // 2. Signal Ready for Capture
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.__PDF_STATUS__ = 'rendered';
          });
        });
      } else {
        window.__PDF_STATUS__ = 'ready';
      }
    };

    renderContent();
  }, [payload]);

  // Helper to force standard fonts for ATS compliance if needed
  const getSimulatedPayload = () => {
    if (!payload) return null;

    // Check if we should force standard fonts (ATS Mode)
    // We can default this to true if the issue is severe, 
    // or pass it via payload.extras.useStandardFonts
    const useStandardFonts = true; // FORCE FIX for LinkedIn Corruption Issue

    if (useStandardFonts) {
      const standardFontMap: Record<string, string> = {
        'Merriweather': 'Times New Roman, serif',
        'Crimson Text': 'Times New Roman, serif',
        'Inter': 'Arial, Helvetica, sans-serif',
        'Roboto': 'Arial, Helvetica, sans-serif',
        // Add other mappings as needed, defaulting to sans-serif
      };

      return {
        ...payload,
        resumeData: {
          ...payload.resumeData,
          bodyFont: standardFontMap[payload.resumeData.bodyFont] || 'Arial, Helvetica, sans-serif',
          titleFont: standardFontMap[payload.resumeData.titleFont] || 'Arial, Helvetica, sans-serif',
        }
      };
    }

    return payload;
  };

  const activePayload = getSimulatedPayload();

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    const prevBodyMargin = body.style.margin;
    const prevBodyBg = body.style.backgroundColor;
    const prevBodyPadding = body.style.padding;
    const prevHtmlMargin = html.style.margin;
    const prevHtmlPadding = html.style.padding;
    const prevHtmlBg = html.style.backgroundColor;

    body.style.margin = '0';
    body.style.padding = '0';
    body.style.backgroundColor = '#e5e7eb';
    html.style.margin = '0';
    html.style.padding = '0';
    html.style.backgroundColor = '#e5e7eb';

    return () => {
      body.style.margin = prevBodyMargin;
      body.style.padding = prevBodyPadding;
      body.style.backgroundColor = prevBodyBg;
      html.style.margin = prevHtmlMargin;
      html.style.padding = prevHtmlPadding;
      html.style.backgroundColor = prevHtmlBg;
    };
  }, []);

  useEffect(() => {
    if (!payload) {
      const decoded = decodePayloadFromHash();
      if (decoded) {
        setPayload(decoded);
        setError(null);
      }
    }
  }, [payload]);

  return (
    <div className="pdf-preview-viewport">
      <style>{`
        @page { size: A4; margin: 0; }
        .pdf-preview-viewport {
          margin: 0;
          padding: 0;
          background: #e5e7eb;
        }
        .pdf-sheet {
          width: 210mm;
          min-height: 297mm;
          background: #ffffff;
          margin: 0 auto;
          overflow: visible;
        }
        .pdf-sheet .shadow-lg,
        .pdf-sheet [class*="shadow-"] {
          box-shadow: none !important;
        }
      `}</style>
      <div className="pdf-sheet" data-pdf-sheet>
        {activePayload ? (
          <ResumePreview resume={activePayload.resumeData} template={activePayload.templateId} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-4">
            <p className="text-lg font-semibold">Waiting for resume data…</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <p className="text-sm max-w-xs">
              This page is used by the PDF renderer. If you're testing manually, append a base64 encoded
              payload to the URL using the <code>?data=</code> query parameter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfPreviewPage;