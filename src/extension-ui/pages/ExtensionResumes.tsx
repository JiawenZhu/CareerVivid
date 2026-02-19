import React from 'react';
import { FileText } from 'lucide-react';

const ExtensionResumes: React.FC = () => (
    <div className="p-4 flex flex-col items-center justify-center h-[500px] text-center text-gray-500">
        <FileText size={48} className="mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">Your Resumes</h3>
        <p className="text-sm mt-2">Manage and edit your resumes directly from the extension.</p>
        <button onClick={() => window.open('https://careervivid.app/resumes', '_blank')} className="mt-4 text-primary-600 font-medium">Open Web Dashboard</button>
    </div>
);

export default ExtensionResumes;
