import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ResumePreview from '../components/ResumePreview';
import { ResumeData, TemplateId } from '../types';
import {
  A4_HEIGHT_PX,
  A4_WIDTH_PX,
  PaginationSpacerPlacement,
  applyPaginationSpacing,
  applySpacerPlacements,
  collectSpacerPlacements
} from '../utils/paginationUtils';

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
  const [contentHeight, setContentHeight] = useState(0);
  const [spacerPlacements, setSpacerPlacements] = useState<PaginationSpacerPlacement[]>([]);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.__PDF_STATUS__ = 'ready';

    window.__RENDER_PAYLOAD__ = (incoming: PdfPayload) => {
      if (incoming?.resumeData && incoming?.templateId) {
        window.__PDF_STATUS__ = 'loading';
        setContentHeight(0);
        setSpacerPlacements([]);
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

  const activePayload = useMemo(() => getSimulatedPayload(), [payload]);
  const pageCount = useMemo(() => Math.max(1, Math.ceil(contentHeight / A4_HEIGHT_PX)), [contentHeight]);

  useLayoutEffect(() => {
    if (!activePayload) {
      window.__PDF_STATUS__ = 'ready';
      return;
    }

    let cancelled = false;

    const measureContent = async () => {
      try {
        await document.fonts.ready;
      } catch (e) {
        console.warn('Font loading timeout or error', e);
      }

      requestAnimationFrame(() => {
        const sheet = measureRef.current;
        if (!sheet || cancelled) return;

        applyPaginationSpacing(sheet);
        const placements = collectSpacerPlacements(sheet);

        requestAnimationFrame(() => {
          if (cancelled) return;
          setSpacerPlacements(placements);
          setContentHeight(sheet.scrollHeight || A4_HEIGHT_PX);
        });
      });
    };

    measureContent();

    return () => {
      cancelled = true;
    };
  }, [activePayload]);

  useEffect(() => {
    if (!activePayload || !contentHeight) return;

    const frame = requestAnimationFrame(() => {
      window.__PDF_STATUS__ = 'rendered';
    });

    return () => cancelAnimationFrame(frame);
  }, [activePayload, contentHeight, pageCount]);

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
        @page {
          size: A4;
          margin: 0;
        }
        html,
        body,
        #root {
          width: ${A4_WIDTH_PX}px;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
        }
        .pdf-preview-viewport {
          margin: 0;
          padding: 0;
          background: #ffffff;
          width: ${A4_WIDTH_PX}px;
        }
        .pdf-measurement-sheet {
          position: fixed;
          left: 0;
          top: 0;
          width: ${A4_WIDTH_PX}px;
          visibility: hidden;
          pointer-events: none;
          z-index: -1;
        }
        .pdf-export-page {
          width: ${A4_WIDTH_PX}px;
          height: ${A4_HEIGHT_PX}px;
          background: #ffffff;
          margin: 0;
          overflow: hidden;
          position: relative;
          page-break-after: always;
          break-after: page;
        }
        .pdf-export-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        .pdf-page-content {
          position: absolute;
          left: 0;
          top: 0;
          width: ${A4_WIDTH_PX}px;
        }
        .pdf-export-page .shadow-lg,
        .pdf-export-page [class*="shadow-"],
        .pdf-measurement-sheet .shadow-lg,
        .pdf-measurement-sheet [class*="shadow-"] {
          box-shadow: none !important;
        }

      `}</style>
      {activePayload ? (
        <>
          <div className="pdf-measurement-sheet" aria-hidden="true">
            <ResumePreview
              resume={activePayload.resumeData}
              template={activePayload.templateId}
              previewId={`pdf-measure-${activePayload.resumeData.id || 'default'}`}
              previewRef={measureRef}
              className="shadow-none"
            />
          </div>

          {contentHeight > 0 && Array.from({ length: pageCount }, (_, pageIndex) => (
            <div
              key={`pdf-page-${pageIndex}`}
              className="pdf-export-page"
              data-pdf-page={pageIndex + 1}
            >
              <div
                className="pdf-page-content"
                style={{ transform: `translateY(-${pageIndex * A4_HEIGHT_PX}px)` }}
              >
                <PdfPageResumePreview
                  resume={activePayload.resumeData}
                  template={activePayload.templateId}
                  previewId={`pdf-page-${pageIndex + 1}-${activePayload.resumeData.id || 'default'}`}
                  spacerPlacements={spacerPlacements}
                  className="shadow-none"
                />
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="flex h-screen flex-col items-center justify-center space-y-4 text-center text-gray-500">
          <p className="text-lg font-semibold">Waiting for resume data…</p>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <p className="max-w-xs text-sm">
            This page is used by the PDF renderer. If you're testing manually, append a base64 encoded
            payload to the URL using the <code>?data=</code> query parameter.
          </p>
        </div>
      )}
    </div>
  );
};

type PdfPageResumePreviewProps = {
  resume: ResumeData;
  template: TemplateId;
  previewId: string;
  spacerPlacements: PaginationSpacerPlacement[];
  className?: string;
};

const PdfPageResumePreview: React.FC<PdfPageResumePreviewProps> = ({
  resume,
  template,
  previewId,
  spacerPlacements,
  className
}) => {
  const previewRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!previewRef.current) return;
    applySpacerPlacements(previewRef.current, spacerPlacements);
  }, [spacerPlacements, resume, template]);

  return (
    <ResumePreview
      resume={resume}
      template={template}
      previewId={previewId}
      previewRef={previewRef}
      className={className}
    />
  );
};

export default PdfPreviewPage;
