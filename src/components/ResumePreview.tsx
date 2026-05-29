
import React from 'react';
import { ResumeData, TemplateId, DEFAULT_FORMATTING_SETTINGS } from '../types';
import { SydneyTemplate } from './templates/SydneyTemplate';
import { ModernTemplate } from './templates/ModernTemplate';
import { CreativeTemplate } from './templates/CreativeTemplate';
import { ProfessionalTemplate } from './templates/ProfessionalTemplate';
import { ExecutiveTemplate } from './templates/ExecutiveTemplate';
import { MinimalistTemplate } from './templates/MinimalistTemplate';
import { ElegantTemplate } from './templates/ElegantTemplate';
import { CorporateTemplate } from './templates/CorporateTemplate';
import { TechnicalTemplate } from './templates/TechnicalTemplate';
import { ArtisticTemplate } from './templates/ArtisticTemplate';
import { VibrantTemplate } from './templates/VibrantTemplate';
import { SlateTemplate } from './templates/SlateTemplate';
import { AcademicTemplate } from './templates/AcademicTemplate';
import { ApexTemplate } from './templates/ApexTemplate';
import { BoldTemplate } from './templates/BoldTemplate';
import { CascadeTemplate } from './templates/CascadeTemplate';
import { ChicagoTemplate } from './templates/ChicagoTemplate';
import { ClassicTemplate } from './templates/ClassicTemplate';
import { CompactTemplate } from './templates/CompactTemplate';
import { CrispTemplate } from './templates/CrispTemplate';
import { DynamicTemplate } from './templates/DynamicTemplate';
import { GeometricTemplate } from './templates/GeometricTemplate';
import { HarvardTemplate } from './templates/HarvardTemplate';
import { InfographicTemplate } from './templates/InfographicTemplate';
import { MonochromeTemplate } from './templates/MonochromeTemplate';
import { OrionTemplate } from './templates/OrionTemplate';
import { PinnacleTemplate } from './templates/PinnacleTemplate';
import { QuantumTemplate } from './templates/QuantumTemplate';
import { SerifTemplate } from './templates/SerifTemplate';
import { SimpleTemplate } from './templates/SimpleTemplate';
import { SpaciousTemplate } from './templates/SpaciousTemplate';
import { SwissTemplate } from './templates/SwissTemplate';
import { TimelineTemplate } from './templates/TimelineTemplate';
import { VertexTemplate } from './templates/VertexTemplate';
import { WaveTemplate } from './templates/WaveTemplate';
import { ZenithTemplate } from './templates/ZenithTemplate';


interface ResumePreviewProps {
  resume: ResumeData;
  template: TemplateId;
  previewId?: string;
  className?: string;
  previewRef?: React.RefObject<HTMLDivElement>;
  onUpdate?: (data: Partial<ResumeData>) => void;
  onFocus?: (fieldId: string) => void;
}

const escapeCssIdentifier = (value: string) => {
  if (typeof window !== 'undefined' && window.CSS?.escape) {
    return window.CSS.escape(value);
  }

  return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
};

// Wrapped in React.memo to prevent unnecessary re-renders when props haven't changed.
// This is crucial for performance as the resume preview can be expensive to render.
const ResumePreview: React.FC<ResumePreviewProps> = React.memo(({ resume, template, previewId: previewIdOverride, className, previewRef, onUpdate, onFocus }) => {
  const renderTemplate = () => {
    const props = { resume, themeColor: resume.themeColor, titleFont: resume.titleFont, bodyFont: resume.bodyFont, onUpdate, onFocus };
    switch (template) {
      case 'Sydney': return <SydneyTemplate {...props} />;
      case 'Creative': return <CreativeTemplate {...props} />;
      case 'Professional': return <ProfessionalTemplate {...props} />;
      case 'Executive': return <ExecutiveTemplate {...props} />;
      case 'Minimalist': return <MinimalistTemplate {...props} />;
      case 'Elegant': return <ElegantTemplate {...props} />;
      case 'Corporate': return <CorporateTemplate {...props} />;
      case 'Technical': return <TechnicalTemplate {...props} />;
      case 'Artistic': return <ArtisticTemplate {...props} />;
      case 'Vibrant': return <VibrantTemplate {...props} />;
      case 'Slate': return <SlateTemplate {...props} />;
      case 'Academic': return <AcademicTemplate {...props} />;
      case 'Apex': return <ApexTemplate {...props} />;
      case 'Bold': return <BoldTemplate {...props} />;
      case 'Cascade': return <CascadeTemplate {...props} />;
      case 'Chicago': return <ChicagoTemplate {...props} />;
      case 'Classic': return <ClassicTemplate {...props} />;
      case 'Compact': return <CompactTemplate {...props} />;
      case 'Crisp': return <CrispTemplate {...props} />;
      case 'Dynamic': return <DynamicTemplate {...props} />;
      case 'Geometric': return <GeometricTemplate {...props} />;
      case 'Harvard': return <HarvardTemplate {...props} />;
      case 'Infographic': return <InfographicTemplate {...props} />;
      case 'Monochrome': return <MonochromeTemplate {...props} />;
      case 'Orion': return <OrionTemplate {...props} />;
      case 'Pinnacle': return <PinnacleTemplate {...props} />;
      case 'Quantum': return <QuantumTemplate {...props} />;
      case 'Serif': return <SerifTemplate {...props} />;
      case 'Simple': return <SimpleTemplate {...props} />;
      case 'Spacious': return <SpaciousTemplate {...props} />;
      case 'Swiss': return <SwissTemplate {...props} />;
      case 'Timeline': return <TimelineTemplate {...props} />;
      case 'Vertex': return <VertexTemplate {...props} />;
      case 'Wave': return <WaveTemplate {...props} />;
      case 'Zenith': return <ZenithTemplate {...props} />;
      case 'Modern':
      default:
        return <ModernTemplate {...props} />;
    }
  };

  // Get formatting settings with defaults
  const fmt = {
    ...DEFAULT_FORMATTING_SETTINGS,
    ...(resume.formattingSettings || {}),
  };

  // CSS variables for real-time formatting
  const formattingStyles: React.CSSProperties = {
    '--body-scale': fmt.bodyScale,
    '--line-height': fmt.lineHeight,
    '--section-gap': `${fmt.sectionGap}rem`,
    '--paragraph-gap': `${fmt.paragraphGap}rem`,
    '--page-margin': `${fmt.pageMargin}rem`,
  } as React.CSSProperties;

  const previewId = previewIdOverride || `resume-preview-${resume.id || 'default'}`;
  const previewSelector = `#${escapeCssIdentifier(previewId)}`;
  const formattingCss = `
    ${previewSelector} .cv-format-surface {
      font-size: calc(16px * var(--body-scale, 1));
      line-height: var(--line-height, 1.4);
    }
    ${previewSelector} .cv-format-surface :where(div, p, span, a, li) {
      line-height: var(--line-height, 1.4) !important;
    }
    ${previewSelector} .cv-format-surface :where(.text-xs) {
      font-size: calc(0.75rem * var(--body-scale, 1)) !important;
    }
    ${previewSelector} .cv-format-surface :where(.text-sm) {
      font-size: calc(0.875rem * var(--body-scale, 1)) !important;
    }
    ${previewSelector} .cv-format-surface :where(.text-base) {
      font-size: calc(1rem * var(--body-scale, 1)) !important;
    }
    ${previewSelector} .cv-format-surface :where(.text-md) {
      font-size: calc(1rem * var(--body-scale, 1)) !important;
    }
    ${previewSelector} .cv-format-surface :where(.text-lg) {
      font-size: calc(1.125rem * var(--body-scale, 1)) !important;
    }
    ${previewSelector} .cv-format-surface :where(.text-xl) {
      font-size: calc(1.25rem * var(--body-scale, 1)) !important;
    }
    ${previewSelector} .cv-format-surface :where(.text-2xl) {
      font-size: calc(1.5rem * var(--body-scale, 1)) !important;
    }
    ${previewSelector} .cv-format-surface :where(.text-3xl) {
      font-size: calc(1.875rem * var(--body-scale, 1)) !important;
    }
    ${previewSelector} .cv-format-surface :where(.text-4xl) {
      font-size: calc(2.25rem * var(--body-scale, 1)) !important;
    }
    ${previewSelector} .cv-format-surface :where(.text-5xl) {
      font-size: calc(3rem * var(--body-scale, 1)) !important;
    }
    ${previewSelector} .cv-format-surface :where(section) {
      margin-bottom: var(--section-gap, 1.5rem) !important;
    }
    ${previewSelector} .cv-format-surface :where(p, ul, ol, [data-field-id$=".description"], [data-field-id="professionalSummary"]) {
      margin-bottom: var(--paragraph-gap, 0.5rem) !important;
    }
    ${previewSelector} .cv-format-surface > :first-child:not(.flex) {
      padding: var(--page-margin, 2rem) !important;
    }
    ${previewSelector} .cv-format-surface > .flex > aside {
      padding: var(--page-margin, 2rem) !important;
    }
    ${previewSelector} .cv-format-surface > .flex > main {
      padding: calc(var(--page-margin, 2rem) * 1.25) var(--page-margin, 2rem) !important;
    }
  `;

  return (
    <div
      id={previewId}
      data-resume-preview-root="true"
      className={`w-full min-h-[297mm] max-w-full bg-white shadow-lg relative ${className || ''}`}
      ref={previewRef}
      style={formattingStyles}
    >
      {/* Scoped custom CSS injection — AI Code Customizer writes here */}
      <style>{formattingCss}</style>
      {resume.customCss && (
        <style>{`#${previewId} { ${resume.customCss} }`}</style>
      )}
      <div className="cv-format-surface">
        {renderTemplate()}
      </div>
    </div>
  );
});

export default ResumePreview;
