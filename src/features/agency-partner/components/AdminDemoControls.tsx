import React, { useState } from 'react';
import { Loader2, RefreshCw, Workflow } from 'lucide-react';
import type { AgencyBranchProfile } from '../types';
import { resetDemoBranch } from '../services/agencyDemoService';

interface AdminDemoControlsProps {
  branches: AgencyBranchProfile[];
  selectedBranchId: string | null;
  onSelectBranch: (branchId: string) => void;
}

const DEMO_BRANCH_ID = 'demo-champaign-agency-2026';

const AdminDemoControls: React.FC<AdminDemoControlsProps> = ({ branches, selectedBranchId, onSelectBranch }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'err'; message: string } | null>(null);

  const handleReset = async () => {
    if (!window.confirm('Reset the demo branch? All demo sessions, notes, events, and invites will be wiped and re-seeded.')) return;
    setIsResetting(true);
    setFeedback(null);
    try {
      const result = await resetDemoBranch();
      setFeedback({ tone: 'ok', message: `Reseeded ${result.candidates} demo candidates.` });
      onSelectBranch(DEMO_BRANCH_ID);
    } catch (err: any) {
      console.error('Failed to reset demo branch:', err);
      setFeedback({ tone: 'err', message: err?.message || 'Could not reset demo branch.' });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <label className="text-xs font-bold text-[#8b5a16] dark:text-[#caa26c]">
          Switch branch
          <select
            value={selectedBranchId || ''}
            onChange={(e) => onSelectBranch(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[#e4d3bc] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#211b16] focus:border-[#8b5a16] focus:outline-none focus:ring-1 focus:ring-[#8b5a16] dark:border-[#302e2a] dark:bg-[#262522] dark:text-[#f4f1e9] md:w-72"
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.id === DEMO_BRANCH_ID ? '★ ' : ''}{branch.branchName}
              </option>
            ))}
          </select>
        </label>
        <span className="hidden text-xs text-[#6b6358] dark:text-[#aaa39a] md:inline-flex md:items-center md:gap-1">
          <Workflow size={12} /> {branches.length} branch{branches.length === 1 ? '' : 'es'}
        </span>
      </div>
      <div className="flex flex-col items-stretch gap-2 md:items-end">
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#caa26c] bg-[#fdf5e8] px-3 py-2 text-xs font-bold text-[#8b5a16] transition hover:bg-[#fbe7c8] disabled:cursor-not-allowed disabled:bg-[#f1ece2] dark:border-[#5a4a36] dark:bg-[#3a2f26] dark:text-[#caa26c] dark:hover:bg-[#4a3d30]"
        >
          {isResetting ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {isResetting ? 'Resetting…' : 'Reset demo branch'}
        </button>
        {feedback ? (
          <p
            className={`text-[11px] font-semibold ${
              feedback.tone === 'ok' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
            }`}
          >
            {feedback.message}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default AdminDemoControls;
