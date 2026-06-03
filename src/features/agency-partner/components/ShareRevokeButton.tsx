import React, { useState } from 'react';
import { Loader2, ShieldOff } from 'lucide-react';
import { revokeAgencyShare } from '../services/agencyShareRevokeService';

interface ShareRevokeButtonProps {
  sessionId: string;
  branchName: string;
  onRevoked?: () => void;
}

const ShareRevokeButton: React.FC<ShareRevokeButtonProps> = ({ sessionId, branchName, onRevoked }) => {
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRevoke = async () => {
    const confirmed = window.confirm(
      `Stop sharing your readiness with ${branchName}? Your public resume link stays as you set it — adjust it from the resume share modal if you want to hide it everywhere.`
    );
    if (!confirmed) return;

    setIsWorking(true);
    setError(null);
    try {
      await revokeAgencyShare(sessionId);
      onRevoked?.();
    } catch (err: any) {
      console.error('Failed to revoke agency share:', err);
      setError(err?.message || 'Could not revoke just yet. Try again.');
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleRevoke}
        disabled={isWorking}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#e4d3bc] bg-white px-4 py-2.5 text-sm font-bold text-[#8a3a1a] transition hover:border-[#caa26c] hover:bg-[#fdf5e8] disabled:cursor-not-allowed disabled:bg-[#f1ece2]"
      >
        {isWorking ? <Loader2 size={16} className="animate-spin" /> : <ShieldOff size={16} />}
        Stop sharing with {branchName}
      </button>
      <p className="mt-2 text-[11px] leading-5 text-[#6b6358]">
        Your public resume link stays as you set it. Adjust it from the resume share modal to hide everywhere.
      </p>
      {error ? <p className="mt-1.5 text-xs text-rose-700">{error}</p> : null}
    </div>
  );
};

export default ShareRevokeButton;
