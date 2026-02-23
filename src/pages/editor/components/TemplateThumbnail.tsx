import React, { useRef, useState, useLayoutEffect } from 'react';
import { ResumeData, TemplateInfo } from '../../../types';
import ResumePreview from '../../../components/ResumePreview';

interface TemplateThumbnailProps {
    resume: ResumeData;
    template: TemplateInfo;
}

const TemplateThumbnail: React.FC<TemplateThumbnailProps> = React.memo(({ resume, template }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.2);

    useLayoutEffect(() => {
        const calculateScale = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const a4Width = 794; // approx 210mm @ 96dpi
                setScale(containerWidth / a4Width);
            }
        };

        calculateScale();
        const resizeObserver = new ResizeObserver(calculateScale);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        return () => resizeObserver.disconnect();
    }, []);

    // Create a version of the resume with this specific template ID for preview
    const resumeForThumbnail = { ...resume, templateId: template.id };

    return (
        <div className="w-full aspect-[210/297] bg-white relative overflow-hidden shadow-sm group-hover:shadow-md transition-shadow" ref={containerRef}>
            <div className="absolute top-0 left-0 origin-top-left" style={{
                width: '794px',
                height: '1123px', // approx 297mm
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
            }}>
                <ResumePreview resume={resumeForThumbnail} template={template.id} />
            </div>
        </div>
    );
});

export default TemplateThumbnail;
