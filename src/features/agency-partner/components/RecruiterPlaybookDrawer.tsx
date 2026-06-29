import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, BookOpen, Link2, Tag, FileText, ShieldCheck } from 'lucide-react';

interface RecruiterPlaybookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  inviteLink: string;
}

const RecruiterPlaybookDrawer: React.FC<RecruiterPlaybookDrawerProps> = ({ isOpen, onClose, inviteLink }) => {
  const { t } = useTranslation();
  const tPlaybook = (key: string, options?: Record<string, unknown>) => t(`recruiter_playbook.${key}`, options);
  const [activeTab, setActiveTab] = useState<'flow' | 'privacy'>('flow');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop overlay (makes it incredibly easy to close by clicking left area) */}
      <button
        type="button"
        aria-label={tPlaybook('aria.close_playbook')}
        onClick={onClose}
        className="absolute inset-0 bg-[#211b16]/40 backdrop-blur-[1px]"
      />

      {/* Drawer Panel - Made Extra Wide for Legibility in Demos */}
      <aside
        role="dialog"
        aria-label={tPlaybook('aria.dialog')}
        className="absolute inset-y-0 right-0 flex w-full md:max-w-2xl lg:max-w-4xl xl:max-w-5xl flex-col border-l border-[#e4d3bc] bg-[#fffaf1] shadow-2xl transition-all duration-300 dark:border-[#302e2a] dark:bg-[#1f1f1d]"
      >
        {/* Header */}
        <header className="border-b border-[#e4d3bc] bg-[#fffaf1]/80 px-6 py-6 sm:px-8 dark:border-[#302e2a] dark:bg-[#1f1f1d]/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#8b5a16]/10 p-2.5 text-[#8b5a16] dark:bg-[#caa26c]/10 dark:text-[#caa26c]">
                <BookOpen size={24} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#211b16] dark:text-[#f4f1e9]">
                  {tPlaybook('header.title')}
                </h2>
                <p className="text-xs sm:text-sm font-bold text-[#8b5a16]/80 dark:text-[#caa26c]/80 uppercase tracking-wider mt-0.5">
                  {tPlaybook('header.subtitle')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2.5 text-[#6b6358] transition hover:bg-[#e4d3bc]/35 hover:text-[#211b16] dark:text-[#aaa39a] dark:hover:bg-[#302e2a] dark:hover:text-[#f4f1e9]"
              aria-label={tPlaybook('aria.close_guide')}
            >
              <X size={22} />
            </button>
          </div>

          {/* Navigation Tabs - Scaled Up */}
          <div className="mt-6 flex border-b border-[#e4d3bc]/50 dark:border-[#302e2a]/50">
            {[
              { id: 'flow', label: tPlaybook('tabs.flow') },
              { id: 'privacy', label: tPlaybook('tabs.privacy') },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 pb-3 text-xs sm:text-sm font-extrabold transition border-b-2 ${
                  activeTab === tab.id
                    ? 'border-[#8b5a16] text-[#8b5a16] dark:border-[#caa26c] dark:text-[#caa26c]'
                    : 'border-transparent text-[#6b6358] hover:text-[#211b16] dark:text-[#aaa39a] dark:hover:text-[#f4f1e9]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* Content Body - Beautiful Spacing & High-Contrast Typography */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8 space-y-8">
          {activeTab === 'flow' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <h4 className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={16} /> {tPlaybook('flow.zero_setup_title')}
                </h4>
                <p className="mt-1.5 text-xs sm:text-sm text-emerald-700 leading-relaxed dark:text-emerald-400">
                  {tPlaybook('flow.zero_setup_body')}
                </p>
              </div>

              <div className="space-y-6">
                <h3 className="text-base sm:text-lg font-black text-[#211b16] dark:text-[#f4f1e9]">
                  {tPlaybook('flow.steps_title')}
                </h3>

                {/* Step 1 */}
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8b5a16] text-sm font-black text-white dark:bg-[#caa26c] dark:text-[#1f1f1d]">
                    1
                  </span>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-[#211b16] dark:text-[#f4f1e9] flex items-center gap-1.5">
                      <Link2 size={16} className="text-[#8b5a16] dark:text-[#caa26c]" /> {tPlaybook('flow.step1_title')}
                    </h4>
                    <p className="mt-1 text-xs sm:text-sm text-[#6b6358] leading-relaxed dark:text-[#aaa39a]">
                      {tPlaybook('flow.step1_prefix')} <code className="bg-white border border-[#e4d3bc] px-2 py-0.5 rounded text-[11px] sm:text-xs select-all dark:bg-[#262522] dark:border-[#302e2a] font-bold text-[#8b5a16] dark:text-[#caa26c]">{inviteLink}</code> {tPlaybook('flow.step1_suffix')}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8b5a16] text-sm font-black text-white dark:bg-[#caa26c] dark:text-[#1f1f1d]">
                    2
                  </span>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-[#211b16] dark:text-[#f4f1e9] flex items-center gap-1.5">
                      <Tag size={16} className="text-[#8b5a16] dark:text-[#caa26c]" /> {tPlaybook('flow.step2_title')}
                    </h4>
                    <p className="mt-1 text-xs sm:text-sm text-[#6b6358] leading-relaxed dark:text-[#aaa39a]">
                      {tPlaybook('flow.step2_body')}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8b5a16] text-sm font-black text-white dark:bg-[#caa26c] dark:text-[#1f1f1d]">
                    3
                  </span>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-[#211b16] dark:text-[#f4f1e9] flex items-center gap-1.5">
                      <FileText size={16} className="text-[#8b5a16] dark:text-[#caa26c]" /> {tPlaybook('flow.step3_title')}
                    </h4>
                    <p className="mt-1 text-xs sm:text-sm text-[#6b6358] leading-relaxed dark:text-[#aaa39a]">
                      {tPlaybook('flow.step3_body')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              {/* Security-First Benefit Cards */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-black text-[#211b16] dark:text-[#f4f1e9]">
                  {tPlaybook('privacy.benefits_title')}
                </h3>

                {/* Benefit 1 */}
                <div className="rounded-2xl border border-[#e4d3bc] bg-white p-4.5 shadow-sm dark:border-[#302e2a] dark:bg-[#262522]">
                  <h4 className="text-sm sm:text-base font-black text-[#8b5a16] dark:text-[#caa26c] flex items-center gap-1.5">
                    {tPlaybook('privacy.benefit1_title')}
                  </h4>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#6b6358] leading-relaxed dark:text-[#aaa39a]">
                    {tPlaybook('privacy.benefit1_body')}
                  </p>
                </div>

                {/* Benefit 2 */}
                <div className="rounded-2xl border border-[#e4d3bc] bg-white p-4.5 shadow-sm dark:border-[#302e2a] dark:bg-[#262522]">
                  <h4 className="text-sm sm:text-base font-black text-[#8b5a16] dark:text-[#caa26c] flex items-center gap-1.5">
                    {tPlaybook('privacy.benefit2_title')}
                  </h4>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#6b6358] leading-relaxed dark:text-[#aaa39a]">
                    {tPlaybook('privacy.benefit2_body')}
                  </p>
                </div>

                {/* Benefit 3 */}
                <div className="rounded-2xl border border-[#e4d3bc] bg-white p-4.5 shadow-sm dark:border-[#302e2a] dark:bg-[#262522]">
                  <h4 className="text-sm sm:text-base font-black text-[#8b5a16] dark:text-[#caa26c] flex items-center gap-1.5">
                    {tPlaybook('privacy.benefit3_title')}
                  </h4>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#6b6358] leading-relaxed dark:text-[#aaa39a]">
                    {tPlaybook('privacy.benefit3_body')}
                  </p>
                </div>
              </div>

              {/* Consent-First Pipeline Controls */}
              <div className="border-t border-[#e4d3bc]/50 pt-6 dark:border-[#302e2a]/50 space-y-4">
                <h3 className="text-base sm:text-lg font-black text-[#211b16] dark:text-[#f4f1e9]">
                  {tPlaybook('privacy.controls_title')}
                </h3>

                <div className="rounded-xl border border-dashed border-[#e4d3bc] p-4.5 dark:border-[#302e2a]">
                  <h5 className="text-xs sm:text-sm font-bold text-[#211b16] dark:text-[#f4f1e9] uppercase tracking-wide">
                    {tPlaybook('privacy.phase1_title')}
                  </h5>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#6b6358] leading-relaxed dark:text-[#aaa39a]">
                    {tPlaybook('privacy.phase1_body')}
                  </p>
                </div>

                <div className="rounded-xl border border-dashed border-[#e4d3bc] p-4.5 dark:border-[#302e2a]">
                  <h5 className="text-xs sm:text-sm font-bold text-[#211b16] dark:text-[#f4f1e9] uppercase tracking-wide">
                    {tPlaybook('privacy.phase2_title')}
                  </h5>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#6b6358] leading-relaxed dark:text-[#aaa39a]">
                    {tPlaybook('privacy.phase2_body')}
                  </p>
                </div>

                <div className="rounded-xl border border-dashed border-[#e4d3bc] p-4.5 dark:border-[#302e2a]">
                  <h5 className="text-xs sm:text-sm font-bold text-[#211b16] dark:text-[#f4f1e9] uppercase tracking-wide">
                    {tPlaybook('privacy.revocation_title')}
                  </h5>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#6b6358] leading-relaxed dark:text-[#aaa39a]">
                    {tPlaybook('privacy.revocation_body')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-[#e4d3bc] bg-[#fffaf1] px-8 py-5 text-center dark:border-[#302e2a] dark:bg-[#1f1f1d]">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#6b6358] dark:text-[#aaa39a]">
            {tPlaybook('footer')}
          </p>
        </footer>
      </aside>
    </div>
  );
};

export default RecruiterPlaybookDrawer;
