import React from 'react';
import { Briefcase } from 'lucide-react';

const ExtensionTracker: React.FC = () => (
    <div className="p-4 flex flex-col items-center justify-center h-[500px] text-center text-gray-500">
        <Briefcase size={48} className="mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">Job Tracker</h3>
        <p className="text-sm mt-2">Track your applications and interview status.</p>
        <button onClick={() => window.open('https://careervivid.app/job-tracker', '_blank')} className="mt-4 text-primary-600 font-medium">Open Web Tracker</button>
    </div>
);

export default ExtensionTracker;
