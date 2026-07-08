import { useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../../firebase';
import { InterviewAnalysis, PracticeHistoryEntry } from '../../types';
import { getGoogleDriveAccessToken } from '../../utils/googleDriveAuth';
import {
    clampScore,
    deriveDashboardData,
    emptyTranscriptMessage,
    getGoogleExportErrorMessage,
    loadInterviewReportExportHelper,
    resolveTranscript,
    stripMarkdown,
} from './reportShared';

interface UseInterviewReportExportParams {
    currentAnalysis: InterviewAnalysis | null;
    currentUser: FirebaseUser | null | undefined;
    jobHistoryEntry: PracticeHistoryEntry;
}

export const useInterviewReportExport = ({
    currentAnalysis,
    currentUser,
    jobHistoryEntry,
}: UseInterviewReportExportParams) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isExportingDocument, setIsExportingDocument] = useState(false);
    const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

    const buildExportOptions = (analysis: InterviewAnalysis) => {
        const transcriptFallback = resolveTranscript(analysis, jobHistoryEntry);

        return {
            jobTitle: jobHistoryEntry.job.title,
            company: jobHistoryEntry.job.company,
            transcriptEntries: transcriptFallback.entries,
            transcriptSourceLabel: transcriptFallback.sourceLabel,
        };
    };

    const buildGoogleDocsReportData = (analysis: InterviewAnalysis) => {
        const transcriptFallback = resolveTranscript(analysis, jobHistoryEntry);
        const dashboard = deriveDashboardData(analysis);

        return {
            title: jobHistoryEntry.job.title,
            company: jobHistoryEntry.job.company,
            date: new Date(analysis.timestamp).toLocaleString(),
            overallScore: clampScore(analysis.overallScore),
            communicationScore: clampScore(analysis.communicationScore),
            confidenceScore: clampScore(analysis.confidenceScore),
            relevanceScore: clampScore(analysis.relevanceScore),
            summary: dashboard.summary,
            strengths: stripMarkdown(analysis.strengths || '') || 'No strengths summary was generated for this session.',
            practiceNext: stripMarkdown(analysis.areasForImprovement || '') || 'No practice recommendations were generated for this session.',
            transcriptSourceLabel: transcriptFallback.sourceLabel,
            transcript: transcriptFallback.entries.map(entry => ({
                speaker: entry.speaker,
                text: entry.text,
            })),
            emptyTranscriptMessage,
        };
    };

    const buildGoogleDocsHtml = (analysis: InterviewAnalysis) => {
        const reportData = buildGoogleDocsReportData(analysis);
        const escapeHtml = (value: string) => value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        const transcriptHtml = reportData.transcript.length
            ? reportData.transcript.map(entry => `
                <h3>${entry.speaker === 'ai' ? 'Interviewer' : 'You'}</h3>
                <p>${escapeHtml(entry.text).replace(/\n/g, '<br>')}</p>
            `).join('')
            : `<p>${escapeHtml(reportData.emptyTranscriptMessage)}</p>`;

        return `<!doctype html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>Interview Feedback Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; color: #111827; line-height: 1.5; }
                        h1 { font-size: 28px; margin-bottom: 4px; }
                        h2 { font-size: 18px; margin-top: 28px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
                        h3 { font-size: 14px; margin: 16px 0 4px; }
                        p { margin: 6px 0 12px; }
                        .muted { color: #4b5563; }
                        .score { font-size: 22px; font-weight: 700; color: #2563eb; }
                        .metric { margin: 2px 0; }
                    </style>
                </head>
                <body>
                    <h1>Interview Feedback Report</h1>
                    <p class="muted">${escapeHtml(reportData.company ? `${reportData.title} at ${reportData.company}` : reportData.title)}</p>
                    <p class="muted">Date: ${escapeHtml(reportData.date)}</p>
                    <p class="score">Overall Score: ${Math.round(reportData.overallScore)}/100</p>
                    <p class="metric">Communication: ${Math.round(reportData.communicationScore)}%</p>
                    <p class="metric">Confidence: ${Math.round(reportData.confidenceScore)}%</p>
                    <p class="metric">Answer Relevance: ${Math.round(reportData.relevanceScore)}%</p>
                    <h2>Top Summary</h2>
                    <p>${escapeHtml(reportData.summary).replace(/\n/g, '<br>')}</p>
                    <h2>What Went Well</h2>
                    <p>${escapeHtml(reportData.strengths).replace(/\n/g, '<br>')}</p>
                    <h2>Practice Next</h2>
                    <p>${escapeHtml(reportData.practiceNext).replace(/\n/g, '<br>')}</p>
                    <h2>Transcript (${escapeHtml(reportData.transcriptSourceLabel)})</h2>
                    ${transcriptHtml}
                </body>
            </html>`;
    };

    const getGoogleDocExportUrl = (docUrl: string) => {
        const docId = docUrl.match(/\/document\/d\/([^/?#]+)/)?.[1];
        return docId ? `https://docs.google.com/document/d/${docId}/export?format=docx` : '';
    };

    const triggerDownloadUrl = (url: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getCachedGoogleAccessToken = async () => {
        if (!currentUser || !currentUser.email) {
            throw new Error('Please sign in before exporting your report.');
        }

        const cacheKey = `interview_report_gdoc_access_token_${currentUser.uid}`;
        if (googleAccessToken) return googleAccessToken;

        try {
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                const { token, expiresAt } = JSON.parse(cached);
                if (expiresAt > Date.now() + 60000) {
                    setGoogleAccessToken(token);
                    return token;
                }
            }
        } catch (error) {
            console.warn('Failed to read cached Google token:', error);
        }

        const accessToken = await getGoogleDriveAccessToken(currentUser, auth, 'interview-report-export');
        setGoogleAccessToken(accessToken);

        try {
            sessionStorage.setItem(cacheKey, JSON.stringify({
                token: accessToken,
                expiresAt: Date.now() + 3500 * 1000,
            }));
        } catch (error) {
            console.warn('Failed to cache Google token:', error);
        }

        return accessToken;
    };

    const clearCachedGoogleAccessToken = () => {
        setGoogleAccessToken(null);

        if (!currentUser) return;

        try {
            sessionStorage.removeItem(`interview_report_gdoc_access_token_${currentUser.uid}`);
        } catch (error) {
            console.warn('Failed to clear cached Google token:', error);
        }
    };

    const requestGoogleDrive = async (accessToken: string, url: string, init: RequestInit = {}) => {
        let response: Response;

        try {
            response = await fetch(url, {
                ...init,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    ...(init.headers || {}),
                },
            });
        } catch {
            throw new Error('Google Drive export could not reach Google Drive. Please check your connection and try again.');
        }

        if (!response.ok) {
            const bodyText = await response.text().catch(() => '');
            let detail = bodyText;

            try {
                const bodyJson = JSON.parse(bodyText);
                detail = bodyJson?.error?.message || bodyJson?.message || bodyText;
            } catch {
                detail = bodyText;
            }

            if (response.status === 401 || response.status === 403) {
                throw new Error('Google Drive permission was denied or expired. Please try again and approve Drive access.');
            }

            if (response.status === 400) {
                throw new Error(detail || 'Google Drive could not create the report document. Please try again.');
            }

            throw new Error(detail || `Google Drive request failed with status ${response.status}.`);
        }

        return response;
    };

    const getOrCreateInterviewReportFolder = async (accessToken: string) => {
        const query = encodeURIComponent("mimeType='application/vnd.google-apps.folder' and name='CareerVivid Interview Reports' and trashed=false");
        const listResponse = await requestGoogleDrive(
            accessToken,
            `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)&spaces=drive`
        );
        const listData = await listResponse.json();
        const existingFolderId = listData.files?.[0]?.id;
        if (existingFolderId) return existingFolderId as string;

        const createResponse = await requestGoogleDrive(
            accessToken,
            'https://www.googleapis.com/drive/v3/files?fields=id',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'CareerVivid Interview Reports',
                    mimeType: 'application/vnd.google-apps.folder',
                }),
            }
        );
        const createData = await createResponse.json();
        return createData.id as string;
    };

    const uploadInterviewReportGoogleDoc = async (analysis: InterviewAnalysis, accessToken: string) => {
        const folderId = await getOrCreateInterviewReportFolder(accessToken);
        const boundary = `careervivid_report_${Date.now()}`;
        const metadata = {
            name: `Interview Report - ${jobHistoryEntry.job.title}`,
            mimeType: 'application/vnd.google-apps.document',
            parents: [folderId],
        };
        const html = buildGoogleDocsHtml(analysis);
        const body = [
            `--${boundary}`,
            'Content-Type: application/json; charset=UTF-8',
            '',
            JSON.stringify(metadata),
            `--${boundary}`,
            'Content-Type: text/html; charset=UTF-8',
            '',
            html,
            `--${boundary}--`,
        ].join('\r\n');

        const response = await requestGoogleDrive(
            accessToken,
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
            {
                method: 'POST',
                headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
                body,
            }
        );

        const data = await response.json();
        if (!data.webViewLink) throw new Error('Google Drive export finished without a document URL.');
        return data.webViewLink as string;
    };

    const formatAnalysisToText = (analysis: InterviewAnalysis) => {
        const transcriptFallback = resolveTranscript(analysis, jobHistoryEntry);
        const header = `Interview Feedback Report\nTopic: ${jobHistoryEntry.job.title}\nDate: ${new Date(analysis.timestamp).toLocaleString()}\n\n`;
        const scores = `--- OVERALL SCORE: ${Math.round(clampScore(analysis.overallScore))}/100 ---\n- Communication: ${Math.round(clampScore(analysis.communicationScore))}%\n- Confidence: ${Math.round(clampScore(analysis.confidenceScore))}%\n- Answer Relevance: ${Math.round(clampScore(analysis.relevanceScore))}%\n\n`;
        const summary = `TOP SUMMARY:\n${deriveDashboardData(analysis).summary}\n\n`;
        const strengths = `WHAT WENT WELL:\n${stripMarkdown(analysis.strengths || '') || 'No strengths summary was generated for this session.'}\n\n`;
        const improvements = `PRACTICE NEXT:\n${stripMarkdown(analysis.areasForImprovement || '') || 'No practice recommendations were generated for this session.'}\n\n`;

        let transcriptText = `--- TRANSCRIPT (${transcriptFallback.sourceLabel}) ---\n`;
        if (transcriptFallback.entries.length) {
            transcriptFallback.entries.forEach(t => {
                const speaker = t.speaker === 'ai' ? 'Interviewer' : 'You';
                transcriptText += `${speaker}:\n${t.text}\n\n`;
            });
        } else {
            transcriptText += `${emptyTranscriptMessage}\n`;
        }

        return header + scores + summary + strengths + improvements + transcriptText;
    };

    const handleDownloadTxt = async () => {
        if (!currentAnalysis) return;
        const helper = await loadInterviewReportExportHelper();
        const options = buildExportOptions(currentAnalysis);

        if (helper?.downloadInterviewReportTxt) {
            await helper.downloadInterviewReportTxt(currentAnalysis, options);
            return;
        }

        const fileContent = formatAnalysisToText(currentAnalysis);
        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interview_report_${currentAnalysis.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadPdf = async () => {
        if (!currentAnalysis) return;
        setIsDownloading(true);
        try {
            const helper = await loadInterviewReportExportHelper();

            if (!helper?.downloadInterviewReportPdf) {
                throw new Error('Expected ../utils/interviewReportExport to export downloadInterviewReportPdf(analysis, options).');
            }

            await helper.downloadInterviewReportPdf(currentAnalysis, buildExportOptions(currentAnalysis));
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            alert('Sorry, an error occurred while generating the PDF.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadDocx = async () => {
        if (!currentAnalysis) return;
        setIsDownloading(true);
        try {
            const {
                Document,
                Packer,
                Paragraph,
                TextRun,
                HeadingLevel,
                Table,
                TableRow,
                TableCell,
                WidthType,
                BorderStyle,
            } = await import('docx');

            const reportData = buildGoogleDocsReportData(currentAnalysis);

            const doc = new Document({
                sections: [
                    {
                        properties: {},
                        children: [
                            new Paragraph({
                                heading: HeadingLevel.HEADING_1,
                                children: [
                                    new TextRun({
                                        text: 'Interview Feedback Report',
                                        bold: true,
                                        size: 32, // 16pt
                                        color: '111827',
                                    }),
                                ],
                                spacing: { after: 12 },
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: reportData.company ? `${reportData.title} at ${reportData.company}` : reportData.title,
                                        bold: true,
                                        size: 24, // 12pt
                                        color: '4b5563',
                                    }),
                                ],
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `Date: ${reportData.date}`,
                                        size: 20, // 10pt
                                        color: '6b7280',
                                    }),
                                ],
                                spacing: { after: 24 },
                            }),

                            // Table for Overall Score & Sub-scores
                            new Paragraph({
                                heading: HeadingLevel.HEADING_2,
                                children: [
                                    new TextRun({
                                        text: 'Score Breakdown',
                                        bold: true,
                                        size: 28, // 14pt
                                        color: '1f2937',
                                    }),
                                ],
                                spacing: { before: 24, after: 12 },
                            }),
                            new Table({
                                width: {
                                    size: 100,
                                    type: WidthType.PERCENTAGE,
                                },
                                borders: {
                                    top: { style: BorderStyle.SINGLE, size: 4, color: 'e5e7eb' },
                                    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'e5e7eb' },
                                    left: { style: BorderStyle.SINGLE, size: 4, color: 'e5e7eb' },
                                    right: { style: BorderStyle.SINGLE, size: 4, color: 'e5e7eb' },
                                    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'e5e7eb' },
                                    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'e5e7eb' },
                                },
                                rows: [
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                children: [new Paragraph({ children: [new TextRun({ text: 'Overall Score', bold: true })] })],
                                                width: { size: 50, type: WidthType.PERCENTAGE },
                                            }),
                                            new TableCell({
                                                children: [new Paragraph({ children: [new TextRun({ text: `${Math.round(reportData.overallScore)}/100`, bold: true, color: '2563eb' })] })],
                                                width: { size: 50, type: WidthType.PERCENTAGE },
                                            }),
                                        ],
                                    }),
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                children: [new Paragraph({ children: [new TextRun({ text: 'Communication' })] })],
                                            }),
                                            new TableCell({
                                                children: [new Paragraph({ children: [new TextRun({ text: `${Math.round(reportData.communicationScore)}%` })] })],
                                            }),
                                        ],
                                    }),
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                children: [new Paragraph({ children: [new TextRun({ text: 'Confidence' })] })],
                                            }),
                                            new TableCell({
                                                children: [new Paragraph({ children: [new TextRun({ text: `${Math.round(reportData.confidenceScore)}%` })] })],
                                            }),
                                        ],
                                    }),
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                children: [new Paragraph({ children: [new TextRun({ text: 'Answer Relevance' })] })],
                                            }),
                                            new TableCell({
                                                children: [new Paragraph({ children: [new TextRun({ text: `${Math.round(reportData.relevanceScore)}%` })] })],
                                            }),
                                        ],
                                    }),
                                ],
                            }),

                            // Top Summary
                            new Paragraph({
                                heading: HeadingLevel.HEADING_2,
                                children: [
                                    new TextRun({
                                        text: 'Top Summary',
                                        bold: true,
                                        size: 28,
                                        color: '1f2937',
                                    }),
                                ],
                                spacing: { before: 24, after: 12 },
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: reportData.summary,
                                        size: 22,
                                    }),
                                ],
                                spacing: { after: 12 },
                            }),

                            // What Went Well
                            new Paragraph({
                                heading: HeadingLevel.HEADING_2,
                                children: [
                                    new TextRun({
                                        text: 'What Went Well',
                                        bold: true,
                                        size: 28,
                                        color: '1f2937',
                                    }),
                                ],
                                spacing: { before: 24, after: 12 },
                            }),
                            ...reportData.strengths.split('\n').map(para => new Paragraph({
                                children: [
                                    new TextRun({
                                        text: para.trim(),
                                        size: 22,
                                    }),
                                ],
                                spacing: { after: 8 },
                            })),

                            // Practice Next
                            new Paragraph({
                                heading: HeadingLevel.HEADING_2,
                                children: [
                                    new TextRun({
                                        text: 'Practice Next',
                                        bold: true,
                                        size: 28,
                                        color: '1f2937',
                                    }),
                                ],
                                spacing: { before: 24, after: 12 },
                            }),
                            ...reportData.practiceNext.split('\n').map(para => new Paragraph({
                                children: [
                                    new TextRun({
                                        text: para.trim(),
                                        size: 22,
                                    }),
                                ],
                                spacing: { after: 8 },
                            })),

                            // Transcript
                            new Paragraph({
                                heading: HeadingLevel.HEADING_2,
                                children: [
                                    new TextRun({
                                        text: `Transcript (${reportData.transcriptSourceLabel})`,
                                        bold: true,
                                        size: 28,
                                        color: '1f2937',
                                    }),
                                ],
                                spacing: { before: 24, after: 12 },
                            }),
                            ...(reportData.transcript.length
                                ? reportData.transcript.flatMap(entry => [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: entry.speaker === 'ai' ? 'Interviewer' : 'You',
                                                bold: true,
                                                color: entry.speaker === 'ai' ? '4f46e5' : '16a34a',
                                                size: 22,
                                            }),
                                        ],
                                        spacing: { before: 12, after: 4 },
                                    }),
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: entry.text,
                                                size: 22,
                                            }),
                                        ],
                                        spacing: { after: 12 },
                                    }),
                                ])
                                : [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: reportData.emptyTranscriptMessage,
                                                italics: true,
                                                size: 22,
                                                color: '6b7280',
                                            }),
                                        ],
                                    }),
                                ]),
                        ],
                    },
                ],
            });

            const blob = await Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${jobHistoryEntry.job.title.replace(/[^a-zA-Z0-9]/g, '_')}_interview_report.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to generate DOCX:', error);
            alert('Sorry, an error occurred while generating the Word document.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleGoogleDocsExport = async () => {
        if (!currentAnalysis) return;
        setIsExportingDocument(true);
        try {
            const accessToken = await getCachedGoogleAccessToken();
            const docUrl = await uploadInterviewReportGoogleDoc(currentAnalysis, accessToken);
            window.open(docUrl, '_blank', 'noopener,noreferrer');
        } catch (error: any) {
            console.error('Google Docs report export failed:', error);
            if (String(error?.message || '').toLowerCase().includes('permission')) {
                clearCachedGoogleAccessToken();
            }
            const message = getGoogleExportErrorMessage(error);
            if (message) alert(message);
        } finally {
            setIsExportingDocument(false);
        }
    };

    return {
        isDownloading,
        isExportingDocument,
        handleDownloadTxt,
        handleDownloadPdf,
        handleDownloadDocx,
        handleGoogleDocsExport,
    };
};
