export interface LocalMatchAuditItem {
  term: string;
  category: 'technical' | 'requirement' | 'domain';
  evidence?: string;
}

export interface LocalMatchAuditResult {
  score: number;
  coverageLabel: string;
  signalCount: number;
  matchedSkills: LocalMatchAuditItem[];
  missingKeywords: LocalMatchAuditItem[];
  recommendations: string[];
}

const MIN_JOB_SIGNAL_COUNT = 8;

const KEYWORD_BANK: Array<{
  label: string;
  category: LocalMatchAuditItem['category'];
  patterns: string[];
}> = [
  { label: 'React', category: 'technical', patterns: ['react', 'react.js', 'reactjs'] },
  { label: 'Next.js', category: 'technical', patterns: ['next.js', 'nextjs', 'next js'] },
  { label: 'TypeScript', category: 'technical', patterns: ['typescript', 'ts'] },
  { label: 'JavaScript', category: 'technical', patterns: ['javascript', 'modern javascript'] },
  { label: 'HTML5', category: 'technical', patterns: ['html5', 'html'] },
  { label: 'CSS', category: 'technical', patterns: ['css', 'css3'] },
  { label: 'Tailwind', category: 'technical', patterns: ['tailwind', 'tailwind css'] },
  { label: 'Node.js', category: 'technical', patterns: ['node.js', 'nodejs', 'node js'] },
  { label: 'REST APIs', category: 'technical', patterns: ['rest api', 'restful api', 'restful apis'] },
  { label: 'GraphQL', category: 'technical', patterns: ['graphql'] },
  { label: 'Firebase', category: 'technical', patterns: ['firebase', 'firestore'] },
  { label: 'Google Cloud', category: 'technical', patterns: ['google cloud', 'gcp'] },
  { label: 'AWS', category: 'technical', patterns: ['aws', 'amazon web services'] },
  { label: 'SQL', category: 'technical', patterns: ['sql', 'postgres', 'mysql'] },
  { label: 'Python', category: 'technical', patterns: ['python'] },
  { label: 'UI/UX', category: 'domain', patterns: ['ui/ux', 'ux', 'user experience', 'visual design'] },
  { label: 'Accessibility', category: 'requirement', patterns: ['accessibility', 'accessible', 'a11y'] },
  { label: 'Responsive UI', category: 'requirement', patterns: ['responsive', 'responsive web', 'mobile-first'] },
  { label: 'Performance tuning', category: 'requirement', patterns: ['performance tuning', 'optimize', 'optimization', 'scalability'] },
  { label: 'Cross-browser compatibility', category: 'requirement', patterns: ['cross-browser', 'browser compatibility'] },
  { label: 'Debugging', category: 'requirement', patterns: ['debugging', 'debug'] },
  { label: 'Testing', category: 'requirement', patterns: ['testing', 'unit test', 'unit testing', 'e2e', 'integration test'] },
  { label: 'Code review', category: 'requirement', patterns: ['code review', 'code reviews'] },
  { label: 'Documentation', category: 'domain', patterns: ['documentation', 'documented code', 'content strategy'] },
  { label: 'Information Architecture', category: 'domain', patterns: ['information architecture'] },
  { label: 'Design Systems', category: 'domain', patterns: ['design system', 'design systems'] },
  { label: 'Product collaboration', category: 'requirement', patterns: ['product managers', 'product manager', 'stakeholder', 'collaborate'] },
  { label: 'Project management', category: 'requirement', patterns: ['project management', 'manage projects'] },
  { label: 'Quality assurance', category: 'requirement', patterns: ['quality assurance', 'qa', 'quality improvement'] },
  { label: 'Process improvement', category: 'requirement', patterns: ['process improvement', 'process improvements', 'continuous improvement'] },
  { label: 'Troubleshooting', category: 'requirement', patterns: ['troubleshooting', 'troubleshoot'] },
  { label: 'System integration', category: 'technical', patterns: ['system integration', 'systems integration'] },
  { label: 'Nursing', category: 'domain', patterns: ['nursing', 'nurse'] },
  { label: 'RN License', category: 'requirement', patterns: ['rn license', 'registered nurse license', 'registered nurse', 'illinois license'] },
  { label: 'Associate Degree in Nursing', category: 'requirement', patterns: ['associate degree in nursing', 'aa/as degree in nursing', 'degree in nursing'] },
  { label: 'Patient care', category: 'domain', patterns: ['patient care', 'resident care', 'healthcare to patients'] },
  { label: 'Medical assessment', category: 'domain', patterns: ['medical assessment', 'health assessment', 'triage assessments', 'assessment of prospective residents'] },
  { label: 'Case management', category: 'domain', patterns: ['case management', 'care management'] },
  { label: 'Medication administration', category: 'requirement', patterns: ['medication administration', 'psychotropic medication', 'medication issues'] },
  { label: 'Behavioral health', category: 'domain', patterns: ['behavioral health', 'mental health', 'behavior disorders'] },
  { label: 'Youth services', category: 'domain', patterns: ['working with youth', 'youth services', 'youth with behavior'] },
  { label: 'CPR / First Aid', category: 'requirement', patterns: ['cpr and first aid', 'cpr', 'first aid'] },
  { label: 'Clinical records', category: 'requirement', patterns: ['maintains records of treatment', 'billing documentation', 'clinical records'] },
  { label: 'Microsoft Office', category: 'technical', patterns: ['microsoft windows', 'microsoft office'] },
];

const normalize = (value: string): string => value.toLowerCase().replace(/\s+/g, ' ').trim();

const containsPattern = (text: string, patterns: string[]): boolean => {
  return patterns.some(pattern => {
    const safePattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\ /g, '\\s+');
    return new RegExp(`(^|[^a-z0-9])${safePattern}([^a-z0-9]|$)`, 'i').test(text);
  });
};

const findEvidence = (text: string, patterns: string[]): string | undefined => {
  const sentences = text
    .split(/(?<=[.!?])\s+|\n|•|·|●/)
    .map(sentence => sentence.replace(/\s+/g, ' ').trim())
    .filter(sentence => sentence.length > 18);

  return sentences.find(sentence => containsPattern(sentence, patterns))?.slice(0, 150);
};

const getCoverageLabel = (score: number): string => {
  if (score >= 78) return 'Strong local fit';
  if (score >= 55) return 'Good base fit';
  if (score >= 35) return 'Needs tailoring';
  return 'Large gap';
};

const buildRecommendations = (
  missing: LocalMatchAuditItem[],
  matched: LocalMatchAuditItem[],
  detectedSignalCount: number
): string[] => {
  if (detectedSignalCount < MIN_JOB_SIGNAL_COUNT) {
    return [
      `Only ${detectedSignalCount} explicit job signal${detectedSignalCount === 1 ? '' : 's'} were detected, so the score is capped by a minimum signal floor.`,
      'Review the full posting before treating this as a complete fit assessment.',
      matched.length > 0
        ? `Use the matched ${matched.slice(0, 2).map(item => item.term).join(' and ')} evidence only where it directly supports the role.`
        : 'Start by adding truthful evidence for the job title, required tools, and core responsibilities.',
    ];
  }

  if (missing.length === 0) {
    return [
      'Keep the strongest matched terms visible in your summary and most recent experience.',
      'Use the job title language in one resume headline or opening bullet before applying.',
      'Save this role and tailor proof points around the listed responsibilities.',
    ];
  }

  const topMissing = missing.slice(0, 4).map(item => item.term);
  const strongest = matched.slice(0, 2).map(item => item.term);

  return [
    `Add evidence for ${topMissing.slice(0, 2).join(' and ')} in the most relevant project or experience bullet.`,
    strongest.length > 0
      ? `Connect your existing ${strongest.join(' and ')} proof to the job's stated responsibilities.`
      : `Start with one bullet that directly mirrors the job's primary tools and responsibilities.`,
    `Use the exact missing keyword language where it is truthful, then quantify impact with scope, speed, users, or quality.`,
    topMissing[2]
      ? `If ${topMissing[2]} is adjacent to your work, mention the transferable project context instead of forcing a weak claim.`
      : `Keep the resume concise by replacing generic wording with job-specific tool and domain terms.`,
  ].filter(Boolean);
};

export const buildLocalMatchAudit = (
  resumeText: string,
  jobDescription: string
): LocalMatchAuditResult => {
  const normalizedResume = normalize(resumeText || '');
  const normalizedJob = normalize(jobDescription || '');

  if (!normalizedJob || normalizedJob.length < 40) {
    return {
      score: 0,
      coverageLabel: 'Scanning',
      signalCount: 0,
      matchedSkills: [],
      missingKeywords: [],
      recommendations: ['Wait for the job description to finish loading, then run the audit again.'],
    };
  }

  const jobTerms = KEYWORD_BANK.filter(item => containsPattern(normalizedJob, item.patterns));
  const matchedSkills = jobTerms
    .filter(item => containsPattern(normalizedResume, item.patterns))
    .map(item => ({
      term: item.label,
      category: item.category,
      evidence: findEvidence(resumeText, item.patterns),
    }));
  const missingKeywords = jobTerms
    .filter(item => !containsPattern(normalizedResume, item.patterns))
    .map(item => ({
      term: item.label,
      category: item.category,
      evidence: findEvidence(jobDescription, item.patterns),
    }));

  const denominator = Math.max(jobTerms.length, MIN_JOB_SIGNAL_COUNT);
  const score = Math.round((matchedSkills.length / denominator) * 100);

  return {
    score,
    coverageLabel: getCoverageLabel(score),
    signalCount: denominator,
    matchedSkills,
    missingKeywords,
    recommendations: buildRecommendations(missingKeywords, matchedSkills, jobTerms.length),
  };
};
