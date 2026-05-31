import React, { createContext, useContext, useState, useEffect } from 'react';
import { ResumeData } from '../types';
import { callGeminiProxy, DEFAULT_TEXT_MODEL } from '../services/geminiService';
import { parseBulletPoints } from '../utils/resumeScoreUtils';
import { calculateResumeScore } from '../utils/resumeScoreUtils';
import {
  normalizeReviewEmploymentHistory,
  normalizeReviewSkills,
  safeReviewLower,
  safeReviewText,
} from '../utils/aiReviewDataGuards';
import {
  buildResumeWithReviewSuggestions,
  filterScoreRelevantReviewSuggestions,
  normalizeActionableReviewSuggestions,
} from '../utils/aiReviewSuggestions';

export interface AISuggestion {
  id: string;
  category: 'skills' | 'experience' | 'summary' | 'personalDetails' | 'general';
  title: string;
  explanation: string;
  type: 'add' | 'delete' | 'replace';
  fieldId: string; // Path or chunk ID: e.g. "skills", "employmentHistory[0].description#chunk-1"
  originalText: string;
  suggestedText: string;
  tags: string[]; // ["Stay Relevant", "Tailor Resume", "Grammar", "Quantifiable"]
  priority: 'high' | 'medium' | 'low';
}

interface AIReviewContextProps {
  isReviewMode: boolean;
  setIsReviewMode: (val: boolean) => void;
  suggestions: AISuggestion[];
  selectedSuggestionIds: Set<string>;
  hoveredSuggestionId: string | null;
  setHoveredSuggestionId: (id: string | null) => void;
  isScanning: boolean;
  hasScanned: boolean;
  scanResume: (resume: ResumeData, userId: string) => Promise<void>;
  applySelected: (resume: ResumeData, onUpdate: (updates: Partial<ResumeData>) => void) => void;
  ignoreSelected: () => void;
  toggleSuggestion: (id: string) => void;
  toggleAll: (checked: boolean) => void;
  clearSuggestions: () => void;
}

const AIReviewContext = createContext<AIReviewContextProps | undefined>(undefined);

export const useAIReview = () => {
  const context = useContext(AIReviewContext);
  if (!context) {
    throw new Error('useAIReview must be used within an AIReviewProvider');
  }
  return context;
};

const buildScoreGapFallbackSuggestions = (
  resume: ResumeData,
  scoreData: ReturnType<typeof calculateResumeScore>,
): Omit<AISuggestion, 'id'>[] => {
  const fallback: Omit<AISuggestion, 'id'>[] = [];
  const employmentHistory = normalizeReviewEmploymentHistory(resume.employmentHistory);

  scoreData.bulletDensityIssues.forEach((issue) => {
    const jobIdx = employmentHistory.findIndex((job) => job.id === issue.experienceId);
    const job = employmentHistory[jobIdx];
    if (!job) return;

    const existingBullets = parseBulletPoints(job.description || '');
    const role = safeReviewText(job.jobTitle) || 'this role';
    const lowerRole = role.toLowerCase();
    const supportTone = /(support|consultant|developer|engineer|technical)/.test(lowerRole);
    const suggestedBullets = [
      ...existingBullets.slice(0, 4),
      supportTone
        ? `Resolved recurring technical issues by analyzing logs, reproducing defects, and documenting root-cause findings for engineering follow-up.`
        : `Improved team workflows by documenting recurring issues, coordinating stakeholders, and turning feedback into clearer execution steps.`,
      supportTone
        ? `Partnered with product, engineering, and customer-facing teams to triage support requests, clarify requirements, and reduce repeat escalations.`
        : `Translated user and business needs into practical improvements, helping the team deliver clearer outcomes with fewer handoff gaps.`,
    ].slice(0, 5);

    fallback.push({
      category: 'experience',
      title: 'Add Interview-Ready Achievement Bullets',
      explanation: `This role currently has too little detail. Adding 3-5 concrete bullets improves resume length, page usage, and recruiter scanability.`,
      type: 'replace',
      fieldId: `employmentHistory[${jobIdx}].description`,
      originalText: safeReviewText(job.description),
      suggestedText: suggestedBullets.map((bullet) => `- ${bullet}`).join('\n'),
      tags: ['Score Impact', 'Interview Ready'],
      priority: 'high',
    });
  });

  return fallback;
};

export const AIReviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<Set<string>>(new Set());
  const [hoveredSuggestionId, setHoveredSuggestionId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  // Clear suggestions when exiting review mode entirely or creating new
  const clearSuggestions = () => {
    setSuggestions([]);
    setSelectedSuggestionIds(new Set());
    setHoveredSuggestionId(null);
    setHasScanned(false);
  };

  const toggleSuggestion = (id: string) => {
    setSelectedSuggestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedSuggestionIds(new Set(suggestions.map((s) => s.id)));
    } else {
      setSelectedSuggestionIds(new Set());
    }
  };

  const ignoreSelected = () => {
    const remaining = suggestions.filter((s) => !selectedSuggestionIds.has(s.id));
    setSuggestions(remaining);
    setSelectedSuggestionIds(new Set());
  };

  // Perform permanent merge of selected suggested changes
  const applySelected = (resume: ResumeData, onUpdate: (updates: Partial<ResumeData>) => void) => {
    if (selectedSuggestionIds.size === 0) return;

    const updated = buildResumeWithReviewSuggestions(resume, suggestions, selectedSuggestionIds);

    onUpdate(updated);

    // Filter out applied suggestions
    const remaining = suggestions.filter((s) => !selectedSuggestionIds.has(s.id));
    setSuggestions(remaining);
    setSelectedSuggestionIds(new Set());
  };

  const scanResume = async (resume: ResumeData, userId: string) => {
    setIsScanning(true);
    setIsReviewMode(true);
    setHasScanned(false);
    const safeResume = (resume || {}) as ResumeData;

    try {
      const currentScore = calculateResumeScore(safeResume);
      if (currentScore.overallScore >= 100) {
        setSuggestions([]);
        setSelectedSuggestionIds(new Set());
        setHasScanned(true);
        return;
      }

      const personalDetails = safeResume.personalDetails || ({} as ResumeData['personalDetails']);
      const skills = normalizeReviewSkills(safeResume.skills);
      const employmentHistory = normalizeReviewEmploymentHistory(safeResume.employmentHistory);
      const failedScoreChecks = [
        ...currentScore.completionItems,
        ...currentScore.qualityItems,
        ...currentScore.lengthItems,
      ].filter((item) => !item.isOk).map((item) => ({
        id: item.id,
        label: item.label,
        feedback: item.feedback,
        category: item.category,
      }));

      // 1. Prepare resume representation for the AI
      const resumeString = JSON.stringify({
        score: {
          overall: currentScore.overallScore,
          completion: currentScore.completionScore,
          quality: currentScore.qualityScore,
          length: currentScore.lengthScore,
          failedChecks: failedScoreChecks,
        },
        personalDetails: {
          jobTitle: safeReviewText(personalDetails.jobTitle),
          firstName: safeReviewText(personalDetails.firstName),
          lastName: safeReviewText(personalDetails.lastName),
        },
        professionalSummary: safeReviewText(safeResume.professionalSummary),
        skills: skills.map((s) => s.name).filter(Boolean),
        employmentHistory: employmentHistory.map((j, idx) => ({
          index: idx,
          company: j.employer,
          title: j.jobTitle,
          description: j.description,
        })),
      });

      const systemPrompt = `You are an elite, senior resume recruiter and ATS optimization agent.
Analyze the provided resume document and return a list of EXACT, HIGH-IMPACT SUGGESTIONS.
We need three types of suggestions:
1. 'add' (mostly for missing high-value ATS skills or keywords related to their role)
2. 'delete' (for outdated/generic/irrelevant skills or sections that hinder conciseness)
3. 'replace' (for correcting spelling/grammar, injecting metrics into bullet descriptions, or strengthening weak action verbs)

CRITICAL RULES:
- Output valid JSON conforming strictly to the response schema.
- Use the score.failedChecks list as the source of truth. If the score is already 100 or there are no meaningful failed checks, return an empty suggestions array.
- Every suggestion must improve the displayed resume score or reduce one of the failed score checks when applied.
- If "Ideal Bullet Densities" or "Resume Length" is failing, prioritize experience description replacements that add 3-5 interview-ready achievement bullets for the affected role.
- Do not create a different set of stylistic suggestions every time. Only return edits that fix an observable issue in the current resume text.
- Do not suggest a change that has already been incorporated. If originalText no longer exists in the current resume, do not include that suggestion.
- Do not return no-op replacements where suggestedText is the same as originalText after trimming punctuation, bullet markers, and whitespace.
- 'fieldId' matches:
  - "skills" for skills addition/deletion.
  - "personalDetails.jobTitle" for job title improvements.
  - "professionalSummary" for profile summary adjustments.
  - "employmentHistory[INDEX].description#chunk-CHUNKINDEX" for specific work history bullet revisions. Note that descriptions are broken down into bullets/chunks. Specify 'INDEX' as the array index of the job and 'CHUNKINDEX' (0-indexed) for the bullet line index.
- Keep 'originalText' exactly matching the text in the resume.
- Keep suggestions highly realistic, professional, and matching standard recruiter advice.

Response Schema:
{
  "type": "OBJECT",
  "properties": {
    "suggestions": {
      "type": "ARRAY",
      "items": {
        "type": "OBJECT",
        "properties": {
          "category": { "type": "STRING", "enum": ["skills", "experience", "summary", "personalDetails"] },
          "title": { "type": "STRING", "description": "e.g., 'Add Skill: Design Systems', 'Refine Action Verb', 'Spelling Correction'" },
          "explanation": { "type": "STRING", "description": "Recruiter explanation of why this change improves their resume score." },
          "type": { "type": "STRING", "enum": ["add", "delete", "replace"] },
          "fieldId": { "type": "STRING" },
          "originalText": { "type": "STRING", "description": "The exact text currently on the resume to replace or delete. Leave empty for 'add'." },
          "suggestedText": { "type": "STRING", "description": "The new text to insert or replace. Leave empty for 'delete'." },
          "tags": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Exactly 1 or 2 tags like 'Stay Relevant', 'Tailor Resume', 'Quantifiable', 'Grammar'" },
          "priority": { "type": "STRING", "enum": ["high", "medium", "low"] }
        },
        "required": ["category", "title", "explanation", "type", "fieldId", "originalText", "suggestedText", "tags", "priority"]
      }
    }
  },
  "required": ["suggestions"]
};`;

      const prompt = `Inspect this resume content:
---
${resumeString}
---

Generate up to 8 high-fidelity suggested edits conforming to the requested schema. Prioritize fixes that can improve the displayed resume score. Return fewer suggestions or an empty array when the resume is already clean.`;

      const result = await callGeminiProxy({
        modelName: DEFAULT_TEXT_MODEL,
        contents: prompt,
        systemInstruction: systemPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              suggestions: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    category: { type: "STRING" },
                    title: { type: "STRING" },
                    explanation: { type: "STRING" },
                    type: { type: "STRING" },
                    fieldId: { type: "STRING" },
                    originalText: { type: "STRING" },
                    suggestedText: { type: "STRING" },
                    tags: { type: "ARRAY", items: { type: "STRING" } },
                    priority: { type: "STRING" }
                  },
                  required: ["category", "title", "explanation", "type", "fieldId", "originalText", "suggestedText", "tags", "priority"]
                }
              }
            },
            required: ["suggestions"]
          }
        }
      });

      const parsed = JSON.parse(result.text.trim());
      let mapped = filterScoreRelevantReviewSuggestions(
        safeResume,
        normalizeActionableReviewSuggestions(safeResume, parsed.suggestions),
      );
      if (mapped.length === 0) {
        mapped = filterScoreRelevantReviewSuggestions(
          safeResume,
          normalizeActionableReviewSuggestions(safeResume, buildScoreGapFallbackSuggestions(safeResume, currentScore)),
        );
      }

      setSuggestions(mapped);
      // Auto-select all by default
      setSelectedSuggestionIds(new Set(mapped.map((s) => s.id)));
      setHasScanned(true);

    } catch (error) {
      console.error("AI Scan failed, launching high-fidelity local fallback:", error);
      
      // HIGH FIDELITY RECRUITER FALLBACK
      // This analyzes the actual resume details locally and compiles a highly contextual set of improvements
      const fallback: AISuggestion[] = [];
      let suggestId = 1;
      const personalDetails = safeResume.personalDetails || ({} as ResumeData['personalDetails']);
      const skills = normalizeReviewSkills(safeResume.skills);
      const employmentHistory = normalizeReviewEmploymentHistory(safeResume.employmentHistory);

      // 1. Scan for spelling typos or capitalization issues in skills
      const hasSpellIssue = skills.some((skill) => /illustraotr/i.test(skill.name) || /intermedicte/i.test(skill.name));
      skills.forEach((skill, idx) => {
        if (/illustraotr/i.test(skill.name)) {
          fallback.push({
            id: `fallback-${suggestId++}`,
            category: 'skills',
            title: 'Fix Spelling: Illustrator',
            explanation: 'Correct the spelling typo "Illustraotr" to Illustrator to ensure professional quality and match search queries from recruiters.',
            type: 'replace',
            fieldId: `skills[${idx}].name`,
            originalText: skill.name,
            suggestedText: 'Illustrator',
            tags: ['Grammar'],
            priority: 'high'
          });
        }
        if (/intermedicte/i.test(skill.name)) {
          fallback.push({
            id: `fallback-${suggestId++}`,
            category: 'skills',
            title: 'Spelling & Case: Spanish',
            explanation: 'Fix the typo "intermedicte" and capitalize "Spanish" to maintain a polished, highly professional tone.',
            type: 'replace',
            fieldId: `skills[${idx}].name`,
            originalText: skill.name,
            suggestedText: 'Spanish (Intermediate)',
            tags: ['Grammar'],
            priority: 'medium'
          });
        }
      });

      // 2. Scan for specific skills to remove (e.g. Java, CSS, HTML, Juggling for Product Design)
      const isDesigner = /design/i.test(safeReviewText(personalDetails.jobTitle));
      skills.forEach((skill) => {
        const name = safeReviewLower(skill.name);
        if (isDesigner && ['html', 'css', 'java'].includes(name)) {
          fallback.push({
            id: `fallback-${suggestId++}`,
            category: 'skills',
            title: `Remove Generic Skill: ${skill.name}`,
            explanation: `Remove '${skill.name}' from your top skills. As a Senior Product Designer, core software development keywords distract from high-value skills like Design Systems or UX Research.`,
            type: 'delete',
            fieldId: 'skills',
            originalText: skill.name,
            suggestedText: '',
            tags: ['Stay Relevant'],
            priority: 'medium'
          });
        }
        if (name === 'juggling') {
          fallback.push({
            id: `fallback-${suggestId++}`,
            category: 'skills',
            title: 'Remove Hobbies: Juggling',
            explanation: "Remove non-professional hobbies like 'Juggling' to maintain strict professional focus and fit more relevant core design keywords.",
            type: 'delete',
            fieldId: 'skills',
            originalText: skill.name,
            suggestedText: '',
            tags: ['Stay Relevant'],
            priority: 'low'
          });
        }
      });

      // 3. Scan and suggest valuable design keyword additions
      const activeSkillNames = new Set(skills.map((skill) => safeReviewLower(skill.name)).filter(Boolean));
      const recommended = [
        { name: 'Design Systems', tag: 'Stay Relevant' },
        { name: 'Accessibility (WCAG)', tag: 'Tailor Resume' },
        { name: 'Information Architecture', tag: 'Stay Relevant' },
        { name: 'UX Strategy', tag: 'Tailor Resume' },
        { name: 'Cross-Functional Collaboration', tag: 'Stay Relevant' }
      ];
      recommended.forEach((rec) => {
        if (!activeSkillNames.has(rec.name.toLowerCase())) {
          fallback.push({
            id: `fallback-${suggestId++}`,
            category: 'skills',
            title: `Add Skill: ${rec.name}`,
            explanation: `Add '${rec.name}' to showcase critical, high-impact competence in scalable product workflows and modern layout compliance.`,
            type: 'add',
            fieldId: 'skills',
            originalText: '',
            suggestedText: rec.name,
            tags: [rec.tag, 'ATS Match'],
            priority: 'high'
          });
        }
      });

      // 4. Job experience suggestions
      employmentHistory.forEach((job, jobIdx) => {
        const employer = (job.employer || '').toLowerCase();
        if (employer.includes('sustain') || employer.includes('travel') || jobIdx === 0) {
          const bullets = parseBulletPoints(job.description || '');
          bullets.forEach((bullet, bIdx) => {
            if (/hackathon/i.test(bullet) && !bullet.includes('EcoPath')) {
              fallback.push({
                id: `fallback-${suggestId++}`,
                category: 'experience',
                title: 'Professionalize Hackathon Project',
                explanation: 'Strengthen the title and scope of your hackathon project. Giving it a real brand name like "EcoPath" makes it highly memorable.',
                type: 'replace',
                fieldId: `employmentHistory[${jobIdx}].description#chunk-${bIdx}`,
                originalText: bullet,
                suggestedText: 'EcoPath: Sustainable Travel App (Hackathon Project)',
                tags: ['Tailor Resume'],
                priority: 'high'
              });
            }
            if (/won 2nd place/i.test(bullet)) {
              fallback.push({
                id: `fallback-${suggestId++}`,
                category: 'experience',
                title: 'Vary and Quantify achievements',
                explanation: 'Rephrase this sentence with strong action verbs and replace placeholder tokens (<X>) with real teams to demonstrate true scope and leadership.',
                type: 'replace',
                fieldId: `employmentHistory[${jobIdx}].description#chunk-${bIdx}`,
                originalText: bullet,
                suggestedText: 'Led UI/UX design for a sustainable travel mobile app prototype during a 48-hour hackathon. Defined user flows, branding, and high-fidelity screens, culminating in a 2nd-place finish among <X> teams.',
                tags: ['Quantifiable', 'Tailor Resume'],
                priority: 'high'
              });
            }
          });
        }
      });

      let mappedFallback = filterScoreRelevantReviewSuggestions(
        safeResume,
        normalizeActionableReviewSuggestions(safeResume, fallback),
      );
      if (mappedFallback.length === 0) {
        const scoreData = calculateResumeScore(safeResume);
        mappedFallback = filterScoreRelevantReviewSuggestions(
          safeResume,
          normalizeActionableReviewSuggestions(safeResume, buildScoreGapFallbackSuggestions(safeResume, scoreData)),
        );
      }
      setSuggestions(mappedFallback);
      setSelectedSuggestionIds(new Set(mappedFallback.map((s) => s.id)));
      setHasScanned(true);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <AIReviewContext.Provider
      value={{
        isReviewMode,
        setIsReviewMode,
        suggestions,
        selectedSuggestionIds,
        hoveredSuggestionId,
        setHoveredSuggestionId,
        isScanning,
        hasScanned,
        scanResume,
        applySelected,
        ignoreSelected,
        toggleSuggestion,
        toggleAll,
        clearSuggestions,
      }}
    >
      {children}
    </AIReviewContext.Provider>
  );
};
