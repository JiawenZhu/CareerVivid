import React, { useState } from 'react';
import { getCompanyLogoUrl } from '../lib/companyLogos';

interface CompanyLogoProps {
    company: string;
    slug: string;
    /** Rendered box size in px (logo image is fetched at 2x for retina). */
    size?: number;
    className?: string;
}

/**
 * Real company logo (favicon service) inside a round tile, falling back to
 * the company's initial letter when the logo can't be loaded. Always round —
 * brand rule.
 */
const CompanyLogo: React.FC<CompanyLogoProps> = ({ company, slug, size = 36, className = '' }) => {
    const [failed, setFailed] = useState(false);
    const initial = (company.trim()[0] || '?').toUpperCase();

    return (
        <span
            className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e4d3bc] bg-white shadow-sm dark:border-[#37332d] dark:bg-[#1f1f1d] ${className}`}
            style={{ width: size, height: size }}
            aria-hidden="true"
        >
            {failed ? (
                <span className="text-sm font-extrabold text-[#8b5a16] dark:text-[#caa26c]">{initial}</span>
            ) : (
                <img
                    src={getCompanyLogoUrl(slug, size > 40 ? 128 : 64)}
                    alt=""
                    loading="lazy"
                    className="h-[70%] w-[70%] rounded-full object-contain"
                    onError={() => setFailed(true)}
                />
            )}
        </span>
    );
};

export default CompanyLogo;
