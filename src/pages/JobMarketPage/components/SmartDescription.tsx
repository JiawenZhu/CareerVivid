import React from 'react';
import { ExternalLink } from 'lucide-react';
import { HIGHLIGHT_PATTERNS } from '../constants/highlightPatterns';

interface SmartDescriptionProps {
    text: string;
}

export const SmartDescription: React.FC<SmartDescriptionProps> = ({ text }) => {
    const paragraphs = text.split('\n');

    const renderSegment = (segment: string): React.ReactNode => {
        let parts: { text: string, type?: string, className?: string, match?: string }[] = [{ text: segment }];

        HIGHLIGHT_PATTERNS.forEach(pattern => {
            const newParts: typeof parts = [];
            parts.forEach(part => {
                if (part.type) {
                    newParts.push(part);
                    return;
                }

                const regex = new RegExp(pattern.regex);
                let lastIndex = 0;
                let match;
                const partText = part.text;

                regex.lastIndex = 0;

                while ((match = regex.exec(partText)) !== null) {
                    if (match.index === regex.lastIndex) regex.lastIndex++;

                    if (match.index > lastIndex) {
                        newParts.push({ text: partText.substring(lastIndex, match.index) });
                    }

                    newParts.push({
                        text: match[0],
                        type: pattern.type || 'highlight',
                        className: pattern.className,
                        match: match[0]
                    });

                    lastIndex = match.index + match[0].length;
                }

                if (lastIndex < partText.length) {
                    newParts.push({ text: partText.substring(lastIndex) });
                }
            });
            parts = newParts;
        });

        return parts.map((part, i) => {
            if (part.type === 'link') {
                return <a key={i} href={part.text} target="_blank" rel="noopener noreferrer" className={part.className} onClick={e => e.stopPropagation()}>{part.text} <ExternalLink size={10} /></a>;
            }
            if (part.type === 'email') {
                return <a key={i} href={`mailto:${part.text}`} className={part.className} onClick={e => e.stopPropagation()}>{part.text}</a>;
            }
            if (part.type === 'highlight') {
                return <span key={i} className={part.className}>{part.text}</span>;
            }
            return <span key={i}>{part.text}</span>;
        });
    };

    return (
        <div className="space-y-4">
            {paragraphs.map((para, idx) => {
                if (!para.trim()) return <div key={idx} className="h-2" />;
                return (
                    <p key={idx} className="leading-relaxed text-gray-600 dark:text-gray-300">
                        {renderSegment(para)}
                    </p>
                );
            })}
        </div>
    );
};
