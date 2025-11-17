import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Rocket, Wand2 } from 'lucide-react';

// FIX: Added a global declaration for the `chrome` object to resolve type errors
// when the build environment doesn't correctly load the chrome types.
declare const chrome: any;

const CoPilotBar: React.FC = () => {
    const [isHovered, setIsHovered] = useState(false);

    const handleAnalyzeClick = () => {
        // This function is now just a trigger. The logic is handled by the message listener below.
        chrome.runtime.sendMessage({ action: 'showAnalysis' });
        alert('Career Co-Pilot is analyzing this page. Results will be shown in the extension popup.');
    };
    
    // Listen for messages from the popup
    useEffect(() => {
        const messageListener = (request: any, sender: any, sendResponse: any) => {
            if (request.action === 'analyzePage') {
                const jobDetails = {
                    title: document.querySelector('.top-card-layout__title, h1.jobsearch-JobInfoHeader-title')?.textContent?.trim() || 'N/A',
                    company: document.querySelector('.top-card-layout__second-subline a, [data-testid="jobsearch-CompanyInfoContainer-companyLink"]')?.textContent?.trim() || 'N/A',
                    description: document.querySelector('.description__text, #jobDescriptionText, .jobsearch-jobDescriptionText')?.innerHTML || '',
                };

                if (!jobDetails.description) {
                    alert('Could not automatically find job details on this page.');
                    sendResponse({ status: 'error', message: 'Description not found.' });
                    return;
                }

                // Send the details to the background script for processing
                chrome.runtime.sendMessage({ action: 'getJobDetails', data: jobDetails }, (response: any) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error sending message:", chrome.runtime.lastError);
                    } else {
                        console.log("Response from background:", response);
                    }
                });
                sendResponse({ status: 'success', message: 'Analysis started.' });
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);

        return () => {
            chrome.runtime.onMessage.removeListener(messageListener);
        };
    }, []);

    return (
        <div 
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 10000,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button
                onClick={handleAnalyzeClick}
                title="Analyze this job with Career Co-Pilot"
                style={{
                    background: 'linear-gradient(145deg, #5a52d1, #4e46af)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '56px',
                    padding: '0 16px',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 3px 6px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    fontFamily: 'Inter, sans-serif',
                }}
            >
                <Rocket size={24} style={{ transition: 'all 0.3s ease', transform: isHovered ? 'rotate(-15deg)' : 'rotate(0)' }} />
                <span style={{
                    width: isHovered ? '90px' : '0',
                    opacity: isHovered ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'width 0.3s ease, opacity 0.2s 0.1s ease',
                    marginLeft: isHovered ? '12px' : '0',
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                }}>
                    Analyze Job
                </span>
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
}