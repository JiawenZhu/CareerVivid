import React from 'react';
import { Info, Monitor } from 'lucide-react';

const DesktopCapabilityBanner: React.FC = () => {
  return (
    <div className="block md:hidden mb-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
        <div className="bg-blue-100 dark:bg-blue-800/40 p-2 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
          <Monitor size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 flex items-center gap-1.5">
            Desktop Capabilities
          </h4>
          <p className="text-xs leading-relaxed text-blue-800/80 dark:text-blue-200/70 font-medium">
            For full workspace capabilities—including Resume Building, Portfolios, and Interview Prep—please visit CareerVivid on your desktop browser.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DesktopCapabilityBanner;
