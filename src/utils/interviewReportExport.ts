import type { InterviewAnalysis, TranscriptEntry } from '../types';

export interface InterviewReportExportOptions {
  jobTitle?: string;
  company?: string;
  transcriptEntries?: TranscriptEntry[];
  transcriptSourceLabel?: string;
  locale?: string;
  timeZone?: string;
}

export interface ResolvedInterviewReportTranscript {
  entries: TranscriptEntry[];
  sourceLabel: string;
}

const emptyTranscriptMessage = 'No transcript was captured for this session.';
const defaultStrengthsMessage = 'No strengths summary was generated for this session.';
const defaultPracticeMessage = 'No practice recommendations were generated for this session.';
const defaultSummaryMessage = 'Review the score breakdown and transcript to identify your strongest answers and next practice focus.';

const stripMarkdown = (text = '') => text.replace(/\*\*/g, '').trim();

const clampScore = (score: number) => {
  if (typeof score !== 'number' || Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, score));
};

const firstSentence = (text = '') => {
  const cleanText = stripMarkdown(text).replace(/\s+/g, ' ');
  if (!cleanText) return '';
  const match = cleanText.match(/^(.+?[.!?])(\s|$)/);
  return match?.[1] || cleanText;
};

const resolveSummary = (analysis: InterviewAnalysis) => {
  const summarySource = firstSentence(analysis.strengths) || firstSentence(analysis.areasForImprovement);
  return summarySource || defaultSummaryMessage;
};

const formatDateTime = (timestamp: number, options: InterviewReportExportOptions = {}) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  return date.toLocaleString(options.locale, {
    timeZone: options.timeZone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const resolveInterviewReportTranscript = (
  analysis: InterviewAnalysis,
  options: InterviewReportExportOptions = {}
): ResolvedInterviewReportTranscript => {
  if (analysis.transcript?.length) {
    return {
      entries: analysis.transcript,
      sourceLabel: 'Saved with this analysis',
    };
  }

  if (options.transcriptEntries?.length) {
    return {
      entries: options.transcriptEntries,
      sourceLabel: options.transcriptSourceLabel || 'Recovered from the practice session',
    };
  }

  return {
    entries: [],
    sourceLabel: options.transcriptSourceLabel || 'Transcript unavailable',
  };
};

export const getInterviewReportFileBaseName = (analysis: InterviewAnalysis) => {
  const id = analysis.id || String(analysis.timestamp || Date.now());
  return `interview_report_${id}`.replace(/[^a-zA-Z0-9_-]/g, '_');
};

export const generateInterviewReportTxtContent = (
  analysis: InterviewAnalysis,
  options: InterviewReportExportOptions = {}
) => {
  const transcript = resolveInterviewReportTranscript(analysis, options);
  const topic = options.company ? `${options.jobTitle || 'Interview'} at ${options.company}` : options.jobTitle || 'Interview';
  const header = `Interview Feedback Report\nTopic: ${topic}\nDate: ${formatDateTime(analysis.timestamp, options)}\n\n`;
  const scores = `--- OVERALL SCORE: ${Math.round(clampScore(analysis.overallScore))}/100 ---\n- Communication: ${Math.round(clampScore(analysis.communicationScore))}%\n- Confidence: ${Math.round(clampScore(analysis.confidenceScore))}%\n- Answer Relevance: ${Math.round(clampScore(analysis.relevanceScore))}%\n\n`;
  const summary = `TOP SUMMARY:\n${resolveSummary(analysis)}\n\n`;
  const strengths = `WHAT WENT WELL:\n${stripMarkdown(analysis.strengths || '') || defaultStrengthsMessage}\n\n`;
  const improvements = `PRACTICE NEXT:\n${stripMarkdown(analysis.areasForImprovement || '') || defaultPracticeMessage}\n\n`;

  let transcriptText = `--- TRANSCRIPT (${transcript.sourceLabel}) ---\n`;
  if (transcript.entries.length) {
    transcript.entries.forEach(entry => {
      const speaker = entry.speaker === 'ai' ? 'Interviewer' : 'You';
      transcriptText += `${speaker}:\n${entry.text}\n\n`;
    });
  } else {
    transcriptText += `${emptyTranscriptMessage}\n`;
  }

  return header + scores + summary + strengths + improvements + transcriptText;
};

const addPageIfNeeded = (pdf: any, cursorY: number, requiredHeight: number, pageHeight: number, marginTop: number, marginBottom: number) => {
  if (cursorY + requiredHeight <= pageHeight - marginBottom) return cursorY;
  pdf.addPage();
  return marginTop;
};

const addWrappedText = (pdf: any, text: string, x: number, y: number, width: number, lineHeight: number, page: { height: number; marginTop: number; marginBottom: number }) => {
  const lines = pdf.splitTextToSize(text || '', width) as string[];
  let cursorY = y;

  lines.forEach(line => {
    cursorY = addPageIfNeeded(pdf, cursorY, lineHeight, page.height, page.marginTop, page.marginBottom);
    pdf.text(line, x, cursorY);
    cursorY += lineHeight;
  });

  return cursorY;
};

export const generateInterviewReportPdf = async (
  analysis: InterviewAnalysis,
  options: InterviewReportExportOptions = {}
) => {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 18;
  const marginTop = 18;
  const marginBottom = 18;
  const contentWidth = pageWidth - marginX * 2;
  const page = { height: pageHeight, marginTop, marginBottom };
  const transcript = resolveInterviewReportTranscript(analysis, options);
  const topic = options.company ? `${options.jobTitle || 'Interview'} at ${options.company}` : options.jobTitle || 'Interview';
  let cursorY = marginTop;

  const sectionTitle = (title: string) => {
    cursorY += 4;
    cursorY = addPageIfNeeded(pdf, cursorY, 10, pageHeight, marginTop, marginBottom);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(31, 41, 55);
    pdf.text(title.toUpperCase(), marginX, cursorY);
    cursorY += 7;
  };

  const paragraph = (text: string) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10.5);
    pdf.setTextColor(55, 65, 81);
    cursorY = addWrappedText(pdf, text, marginX, cursorY, contentWidth, 5.5, page);
    cursorY += 2;
  };

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(17, 24, 39);
  pdf.text('Interview Feedback Report', marginX, cursorY);
  cursorY += 9;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10.5);
  pdf.setTextColor(75, 85, 99);
  pdf.text(`Topic: ${topic}`, marginX, cursorY);
  cursorY += 5.5;
  pdf.text(`Date: ${formatDateTime(analysis.timestamp, options)}`, marginX, cursorY);
  cursorY += 10;

  cursorY = addPageIfNeeded(pdf, cursorY, 28, pageHeight, marginTop, marginBottom);
  pdf.setFillColor(249, 250, 251);
  pdf.setDrawColor(229, 231, 235);
  pdf.roundedRect(marginX, cursorY, contentWidth, 24, 2, 2, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(30);
  pdf.setTextColor(37, 99, 235);
  pdf.text(String(Math.round(clampScore(analysis.overallScore))), marginX + 8, cursorY + 15);
  pdf.setFontSize(11);
  pdf.setTextColor(31, 41, 55);
  pdf.text('Overall Score', marginX + 30, cursorY + 10);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(75, 85, 99);
  pdf.text('Generated from CareerVivid interview analysis data.', marginX + 30, cursorY + 16);
  cursorY += 32;

  [
    ['Communication', analysis.communicationScore],
    ['Confidence', analysis.confidenceScore],
    ['Answer Relevance', analysis.relevanceScore],
  ].forEach(([label, score]) => {
    const normalizedScore = clampScore(score as number);
    cursorY = addPageIfNeeded(pdf, cursorY, 13, pageHeight, marginTop, marginBottom);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    pdf.text(label as string, marginX, cursorY);
    pdf.text(`${Math.round(normalizedScore)}%`, pageWidth - marginX, cursorY, { align: 'right' });
    cursorY += 3.5;
    pdf.setFillColor(229, 231, 235);
    pdf.roundedRect(marginX, cursorY, contentWidth, 3, 1.5, 1.5, 'F');
    pdf.setFillColor(37, 99, 235);
    pdf.roundedRect(marginX, cursorY, contentWidth * (normalizedScore / 100), 3, 1.5, 1.5, 'F');
    cursorY += 8;
  });

  sectionTitle('Top Summary');
  paragraph(resolveSummary(analysis));

  sectionTitle('What Went Well');
  paragraph(stripMarkdown(analysis.strengths || '') || defaultStrengthsMessage);

  sectionTitle('Practice Next');
  paragraph(stripMarkdown(analysis.areasForImprovement || '') || defaultPracticeMessage);

  sectionTitle(`Transcript (${transcript.sourceLabel})`);
  if (!transcript.entries.length) {
    paragraph(emptyTranscriptMessage);
  } else {
    transcript.entries.forEach(entry => {
      cursorY = addPageIfNeeded(pdf, cursorY, 12, pageHeight, marginTop, marginBottom);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(entry.speaker === 'ai' ? 79 : 22, entry.speaker === 'ai' ? 70 : 101, entry.speaker === 'ai' ? 229 : 52);
      pdf.text(entry.speaker === 'ai' ? 'Interviewer' : 'You', marginX, cursorY);
      cursorY += 5;
      paragraph(entry.text);
      cursorY += 1.5;
    });
  }

  const pageCount = pdf.getNumberOfPages();
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    pdf.setPage(pageNumber);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(107, 114, 128);
    pdf.text(`CareerVivid Interview Report | Page ${pageNumber} of ${pageCount}`, marginX, pageHeight - 8);
  }

  return pdf;
};

export const downloadInterviewReportTxt = (
  analysis: InterviewAnalysis,
  options: InterviewReportExportOptions = {}
) => {
  const blob = new Blob([generateInterviewReportTxtContent(analysis, options)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${getInterviewReportFileBaseName(analysis)}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadInterviewReportPdf = async (
  analysis: InterviewAnalysis,
  options: InterviewReportExportOptions = {}
) => {
  const pdf = await generateInterviewReportPdf(analysis, options);
  pdf.save(`${getInterviewReportFileBaseName(analysis)}.pdf`);
};
