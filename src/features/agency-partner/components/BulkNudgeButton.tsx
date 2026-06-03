import React, { useState } from 'react';
import { Send, Loader2, Check } from 'lucide-react';
import { sendBulkAgencyReminder } from '../services/agencyRemindersService';

interface BulkNudgeButtonProps {
  branchId: string;
  staleSessionIds: string[];
  demo?: boolean;
  onSuccess?: () => void;
}

const BulkNudgeButton: React.FC<BulkNudgeButtonProps> = ({
  branchId,
  staleSessionIds,
  demo = false,
  onSuccess,
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNudge = async () => {
    if (staleSessionIds.length === 0 || status === 'loading') return;

    setStatus('loading');
    setErrorMsg(null);

    try {
      const result = await sendBulkAgencyReminder({
        branchId,
        sessionIds: staleSessionIds,
        demo,
      });

      setStatus('success');
      onSuccess?.();
      
      // Reset back to idle after 3 seconds so they can nudge again if needed
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      console.error('Failed to send bulk reminder:', err);
      setStatus('error');
      setErrorMsg(err?.message || 'Failed to send reminders.');
    }
  };

  const count = staleSessionIds.length;

  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition">
        <Check size={14} />
        Nudges sent!
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleNudge}
        disabled={status === 'loading' || count === 0}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-sm transition ${
          status === 'loading'
            ? 'bg-amber-600/50 cursor-not-allowed'
            : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
        }`}
      >
        {status === 'loading' ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send size={12} />
            Nudge all {count} candidate{count === 1 ? '' : 's'}
          </>
        )}
      </button>

      {status === 'error' && errorMsg && (
        <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-red-200 bg-red-50 p-2.5 text-left text-[11px] font-medium text-red-700 shadow-lg dark:border-red-950 dark:bg-red-950/90 dark:text-red-300">
          {errorMsg}
        </div>
      )}
    </div>
  );
};

export default BulkNudgeButton;
