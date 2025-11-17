import React from 'react';
import { createRoot } from 'react-dom/client';
import { Wand2 } from 'lucide-react';

// FIX: Added a global declaration for the `chrome` object to resolve type errors
// when the build environment doesn't correctly load the chrome types.
declare const chrome: any;

const CoPilotBar: React.FC = () => {
    const handleAnalyzeClick = () => {
        const jobDetails = {
            title: document.querySelector('.top-card-layout__title, h1.jobsearch-JobInfoHeader-title')?.textContent?.trim() || '',
            company: document.querySelector('.top-card-layout__second-subline a, [data-testid="jobsearch-CompanyInfoContainer-companyLink"]')?.textContent?.trim() || '',
            description: document.querySelector('.description__text, #jobDescriptionText, .jobsearch-jobDescriptionText')?.innerHTML || '',
        };

        if (!jobDetails.description) {
            alert('Could not automatically find job description. The Co-Pilot works best on standard job view pages.');
            return;
        }

        chrome.runtime.sendMessage({ action: 'getJobDetails', data: jobDetails });
        alert('Job details sent to Co-Pilot for analysis!');
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 10000,
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            padding: '12px',
            fontFamily: 'Inter, sans-serif',
            color: '#111827'
        }}>
            <img src="https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/logo.png?alt=media&token=3d2f7db5-96db-4dce-ba00-43d8976da3a1" alt="Logo" style={{ height: '32px', width: '32px', marginRight: '12px' }} />
            <div>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>Career Co-Pilot</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Ready to assist!</p>
            </div>
            <button
                onClick={handleAnalyzeClick}
                title="Analyze this job with Career Co-Pilot"
                style={{
                    marginLeft: '16px',
                    background: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Wand2 size={20} />
            </button>
        </div>
    );
};

// Avoid injecting multiple times
const containerId = 'career-co-pilot-container';
if (!document.getElementById(containerId)) {
    const rootElement = document.createElement('div');
    rootElement.id = containerId;
    document.body.appendChild(rootElement);
    const root = createRoot(rootElement);
    root.render(<CoPilotBar />);
    console.log("Career Co-Pilot content script injected and UI rendered.");
}