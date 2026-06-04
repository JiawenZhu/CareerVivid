import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PrivacyPreviewCardProps {
  branchName: string;
  candidateName?: string;
  candidateEmail?: string;
  latestScore?: number;
  scoreDelta?: number;
  consentToShare: boolean;
}

const PrivacyPreviewCard: React.FC<PrivacyPreviewCardProps> = ({
  branchName,
  candidateName,
  candidateEmail,
  latestScore,
  scoreDelta,
  consentToShare,
}) => {
  const sharedItems = [
    candidateName ? `Name: ${candidateName}` : 'Your name',
    candidateEmail ? `Email: ${candidateEmail}` : 'Your email',
    typeof latestScore === 'number' ? `Resume score: ${latestScore}` : 'Resume score',
    typeof scoreDelta === 'number' && scoreDelta > 0 ? `Score lift: +${scoreDelta}` : 'Score lift',
    consentToShare ? 'Readiness summary' : 'Readiness summary (only after you share)',
    consentToShare ? 'Viewer-only resume link' : 'Viewer-only resume link (only after you share)',
  ];

  const privateItems = [
    'Full resume content (until you share)',
    'AI Review details and feedback',
    'Recruiter notes about you',
    'Your contact preferences',
    'Your other CareerVivid workspaces',
  ];

  return (
    <section className="rounded-lg border border-[#e4d3bc] bg-[#fffaf1] p-5 shadow-sm shadow-[#8b5a16]/5">
      <header className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8b5a16]">Privacy preview</p>
        <h2 className="mt-1 text-lg font-bold text-[#211b16]">What {branchName} can and can&apos;t see</h2>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
            <Eye size={12} /> Shared with {branchName}
          </p>
          <ul className="space-y-1 text-[13px] text-[#211b16]">
            {sharedItems.map((item) => (
              <li key={item} className="leading-5">• {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-[#e4d3bc] bg-white p-3">
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#6b6358]">
            <EyeOff size={12} /> Stays private
          </p>
          <ul className="space-y-1 text-[13px] text-[#211b16]">
            {privateItems.map((item) => (
              <li key={item} className="leading-5">• {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-3 text-[12px] leading-5 text-[#6b6358]">
        {consentToShare
          ? `You are currently sharing your readiness with ${branchName}. You can stop sharing any time.`
          : `Nothing about your resume is shared with ${branchName} until you click "Share readiness report."`}
      </p>
    </section>
  );
};

export default PrivacyPreviewCard;
