import type { ResumeData } from '../types';
import { getJobLocationFit, type JobRecommendationPreferences } from './jobRecommendationPreferences';

export type MatchConfidence = 'High confidence' | 'Medium confidence' | 'Low confidence';
export type ComprehensiveMatchLabel = 'Strong match' | 'Good match' | 'Partial match' | 'Low match';

export type JobMatchFactor = {
    key: 'role' | 'skills' | 'experience' | 'education' | 'location' | 'work' | 'compensation';
    label: string;
    score: number;
    maxScore: number;
    evidence: string;
};

export type ComprehensiveJobMatch = {
    score: number;
    label: ComprehensiveMatchLabel;
    confidence: MatchConfidence;
    factors: JobMatchFactor[];
    matchedSkills: string[];
    missingSkills: string[];
    strengths: string[];
    gaps: string[];
};

type MatchableJob = {
    title: string;
    description: string;
    location: string;
    workModel: string;
    salary: string;
    jobType: string;
    seniority: string;
    jobFunction?: string;
    signals?: string[];
};

type SavedApplicationPreferences = {
    compensation?: {
        targetSalary?: string;
        minimumSalary?: string;
        preferenceType?: 'annual' | 'hourly';
    };
    availability?: {
        workSchedule?: string;
    };
};

export type JobMatchProfile = {
    resumeText: string;
    roleTerms: string[];
    roleTokens: string[];
    profileFunction: string;
    explicitSkills: string[];
    experienceYears: number | null;
    profileSeniority: number;
    educationLevel: number;
    educationLabel: string;
    locationPreferences: JobRecommendationPreferences;
    workSchedule: string;
    minimumSalary: number | null;
    targetSalary: number | null;
};

type SkillDefinition = { label: string; aliases?: string[] };

const SKILL_CATALOG: SkillDefinition[] = [
    { label: 'JavaScript', aliases: ['javascript', 'ecmascript'] },
    { label: 'TypeScript' },
    { label: 'React', aliases: ['react', 'react.js', 'reactjs'] },
    { label: 'Next.js', aliases: ['next.js', 'nextjs'] },
    { label: 'Node.js', aliases: ['node.js', 'nodejs'] },
    { label: 'Python' },
    { label: 'Java' },
    { label: 'C++', aliases: ['c++', 'cpp'] },
    { label: 'C#', aliases: ['c#', 'csharp'] },
    { label: 'Go', aliases: ['golang'] },
    { label: 'Ruby' },
    { label: 'Swift' },
    { label: 'Kotlin' },
    { label: 'SQL' },
    { label: 'PostgreSQL', aliases: ['postgresql', 'postgres'] },
    { label: 'MySQL' },
    { label: 'MongoDB' },
    { label: 'Redis' },
    { label: 'GraphQL' },
    { label: 'REST APIs', aliases: ['rest api', 'restful api', 'rest'] },
    { label: 'AWS', aliases: ['aws', 'amazon web services'] },
    { label: 'Azure' },
    { label: 'Google Cloud', aliases: ['google cloud', 'gcp'] },
    { label: 'Docker' },
    { label: 'Kubernetes' },
    { label: 'Terraform' },
    { label: 'CI/CD', aliases: ['ci/cd', 'continuous integration', 'continuous deployment'] },
    { label: 'Git' },
    { label: 'Linux' },
    { label: 'System design', aliases: ['system design', 'distributed systems', 'architecture'] },
    { label: 'Machine learning', aliases: ['machine learning', 'ml'] },
    { label: 'Artificial intelligence', aliases: ['artificial intelligence', 'ai'] },
    { label: 'LLMs', aliases: ['llm', 'large language model', 'generative ai'] },
    { label: 'Data analysis', aliases: ['data analysis', 'analytics'] },
    { label: 'Data engineering' },
    { label: 'ETL' },
    { label: 'Tableau' },
    { label: 'Power BI', aliases: ['power bi', 'powerbi'] },
    { label: 'Excel' },
    { label: 'Figma' },
    { label: 'UX research', aliases: ['ux research', 'user research'] },
    { label: 'UX design', aliases: ['ux design', 'user experience'] },
    { label: 'UI design', aliases: ['ui design', 'user interface'] },
    { label: 'Prototyping' },
    { label: 'Design systems', aliases: ['design system', 'design systems'] },
    { label: 'Accessibility', aliases: ['accessibility', 'wcag', 'a11y'] },
    { label: 'Product management' },
    { label: 'Roadmapping', aliases: ['roadmap', 'roadmapping'] },
    { label: 'Agile' },
    { label: 'Scrum' },
    { label: 'Project management' },
    { label: 'Program management' },
    { label: 'SEO', aliases: ['seo', 'search engine optimization'] },
    { label: 'SEM', aliases: ['sem', 'search engine marketing'] },
    { label: 'Content marketing' },
    { label: 'Lifecycle marketing' },
    { label: 'Email marketing' },
    { label: 'Demand generation', aliases: ['demand generation', 'demand gen'] },
    { label: 'Social media' },
    { label: 'Google Analytics' },
    { label: 'HubSpot' },
    { label: 'Salesforce' },
    { label: 'CRM', aliases: ['crm', 'customer relationship management'] },
    { label: 'SaaS' },
    { label: 'Business development' },
    { label: 'Account management' },
    { label: 'Customer success' },
    { label: 'Customer support' },
    { label: 'Technical support' },
    { label: 'Recruiting', aliases: ['recruiting', 'talent acquisition'] },
    { label: 'Human resources', aliases: ['human resources', 'hr'] },
    { label: 'People operations', aliases: ['people operations', 'people ops'] },
    { label: 'Financial analysis' },
    { label: 'Accounting' },
    { label: 'GAAP' },
    { label: 'Compliance' },
    { label: 'Operations' },
    { label: 'Supply chain' },
    { label: 'Procurement' },
    { label: 'Teaching' },
    { label: 'Curriculum development' },
    { label: 'Clinical care' },
    { label: 'Nursing' },
];

const ROLE_STOP_WORDS = new Set([
    'and', 'the', 'for', 'of', 'at', 'in', 'to', 'with', 'resume', 'senior', 'sr', 'junior', 'jr',
    'lead', 'principal', 'staff', 'manager', 'head', 'director', 'associate', 'specialist', 'level',
]);

const normalize = (value: string): string => value
    .toLowerCase()
    .replace(/c\+\+/g, 'cpp')
    .replace(/c#/g, 'csharp')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const includesTerm = (text: string, term: string): boolean => {
    const normalizedTerm = normalize(term);
    return Boolean(normalizedTerm) && ` ${text} `.includes(` ${normalizedTerm} `);
};

const unique = (values: string[]): string[] => Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const tokenizeRole = (value: string): string[] => normalize(value)
    .split(' ')
    .filter((token) => token.length > 1 && !ROLE_STOP_WORDS.has(token));

const detectJobFunction = (value: string): string => {
    const text = normalize(value);
    if (/\b(data|analytics|machine learning|artificial intelligence|research scientist)\b/.test(text)) return 'Data & AI';
    if (/\b(sales|account executive|business development|partnership|revenue)\b/.test(text)) return 'Sales & Partnerships';
    if (/\b(customer success|customer support|technical support|implementation|solutions consultant)\b/.test(text)) return 'Customer Success';
    if (/\b(engineer|developer|software|devops|security|infrastructure|site reliability)\b/.test(text)) return 'Engineering';
    if (/\b(product manager|product management|product owner)\b/.test(text)) return 'Product';
    if (/\b(design|ux|ui|creative|researcher)\b/.test(text)) return 'Design';
    if (/\b(marketing|brand|content|communications|public relations|growth)\b/.test(text)) return 'Marketing';
    if (/\b(recruit|talent|people|human resources|hr)\b/.test(text)) return 'People & Recruiting';
    if (/\b(finance|accounting|legal|counsel|compliance|tax|audit)\b/.test(text)) return 'Finance & Legal';
    if (/\b(operations|program manager|project manager|workplace|supply chain|procurement)\b/.test(text)) return 'Operations';
    return 'Other';
};

const relatedFunctions = (left: string, right: string): boolean => {
    const pairs = [
        ['Engineering', 'Data & AI'],
        ['Product', 'Design'],
        ['Product', 'Marketing'],
        ['Sales & Partnerships', 'Customer Success'],
        ['Operations', 'Finance & Legal'],
        ['Operations', 'People & Recruiting'],
    ];
    return pairs.some(([a, b]) => (left === a && right === b) || (left === b && right === a));
};

const parseEmploymentDate = (value: string, endDate: boolean): number | null => {
    const normalized = value.trim().toLowerCase();
    if (!normalized || /present|current|now/.test(normalized)) return endDate ? Date.now() : null;
    const parsed = Date.parse(normalized.length === 4 ? `${normalized}-01-01` : normalized);
    return Number.isNaN(parsed) ? null : parsed;
};

const calculateExperienceYears = (resume: Partial<ResumeData>): number | null => {
    const intervals = (resume.employmentHistory || [])
        .map((role) => {
            const start = parseEmploymentDate(role.startDate || '', false);
            const end = parseEmploymentDate(role.endDate || '', true);
            return start && end && end >= start ? [start, end] as [number, number] : null;
        })
        .filter((interval): interval is [number, number] => Boolean(interval))
        .sort((a, b) => a[0] - b[0]);
    if (!intervals.length) return null;

    const merged: Array<[number, number]> = [];
    intervals.forEach(([start, end]) => {
        const previous = merged[merged.length - 1];
        if (!previous || start > previous[1]) merged.push([start, end]);
        else previous[1] = Math.max(previous[1], end);
    });
    const totalMs = merged.reduce((sum, [start, end]) => sum + (end - start), 0);
    return Math.round((totalMs / (365.25 * 24 * 60 * 60 * 1000)) * 10) / 10;
};

const parseMoney = (value: string | undefined): number | null => {
    if (!value) return null;
    const compact = value.toLowerCase().replace(/,/g, '');
    const match = compact.match(/(\d+(?:\.\d+)?)\s*k?/);
    if (!match) return null;
    let amount = Number(match[1]);
    if (/\d(?:\.\d+)?\s*k\b/.test(compact)) amount *= 1000;
    return amount;
};

const parseSalaryRange = (value: string): { min: number; max: number } | null => {
    const compact = value.toLowerCase().replace(/,/g, '');
    const values = Array.from(compact.matchAll(/\d+(?:\.\d+)?\s*k?/g))
        .map((match) => {
            let amount = Number(match[0].replace(/k/g, '').trim());
            if (/k/.test(match[0])) amount *= 1000;
            if (/hour|hourly|\/hr/.test(compact) && amount < 1000) amount *= 2080;
            return amount;
        })
        .filter((amount) => amount >= 10000);
    if (!values.length) return null;
    return { min: Math.min(...values), max: Math.max(...values) };
};

const educationLevel = (value: string): number => {
    const text = normalize(value);
    if (/\b(phd|doctorate|doctoral)\b/.test(text)) return 4;
    if (/\b(master|mba|ms|ma|msc)\b/.test(text)) return 3;
    if (/\b(bachelor|bs|ba|bsc)\b/.test(text)) return 2;
    if (/\b(associate|diploma|certificate)\b/.test(text)) return 1;
    return 0;
};

const educationLabel = (level: number): string => ['Not listed', 'Associate/certificate', "Bachelor's", "Master's", 'Doctorate'][level] || 'Not listed';

const seniorityLevel = (value: string, years: number | null): number => {
    const text = normalize(value);
    if (/\b(principal|staff|head|director|lead)\b/.test(text)) return 4;
    if (/\b(senior|sr)\b/.test(text)) return 3;
    if (/\b(entry|junior|jr|intern)\b/.test(text)) return 1;
    if (years !== null) return years >= 8 ? 4 : years >= 5 ? 3 : years >= 2 ? 2 : 1;
    return 2;
};

export const buildJobMatchProfile = (
    resume: Partial<ResumeData> | null,
    applicationProfile: SavedApplicationPreferences | null,
    locationPreferences: JobRecommendationPreferences
): JobMatchProfile => {
    const roles = unique([
        resume?.personalDetails?.jobTitle || '',
        resume?.title || '',
        ...(resume?.employmentHistory || []).map((role) => role.jobTitle || ''),
    ]);
    const explicitSkills = unique((resume?.skills || []).map((skill) => skill.name || ''));
    const resumeText = normalize([
        ...roles,
        resume?.professionalSummary || '',
        ...explicitSkills,
        ...(resume?.employmentHistory || []).flatMap((role) => [role.jobTitle, role.description]),
        ...(resume?.education || []).flatMap((education) => [education.degree, education.description]),
    ].join(' '));
    const experienceYears = resume ? calculateExperienceYears(resume) : null;
    const highestEducationLevel = Math.max(0, ...(resume?.education || []).map((education) => educationLevel(education.degree || '')));
    const salaryMultiplier = applicationProfile?.compensation?.preferenceType === 'hourly' ? 2080 : 1;
    const minimumSalary = parseMoney(applicationProfile?.compensation?.minimumSalary);
    const targetSalary = parseMoney(applicationProfile?.compensation?.targetSalary);

    return {
        resumeText,
        roleTerms: roles,
        roleTokens: unique(roles.flatMap(tokenizeRole)),
        profileFunction: detectJobFunction(roles.join(' ')),
        explicitSkills,
        experienceYears,
        profileSeniority: seniorityLevel(roles.join(' '), experienceYears),
        educationLevel: highestEducationLevel,
        educationLabel: educationLabel(highestEducationLevel),
        locationPreferences,
        workSchedule: applicationProfile?.availability?.workSchedule?.trim() || '',
        minimumSalary: minimumSalary === null ? null : minimumSalary * salaryMultiplier,
        targetSalary: targetSalary === null ? null : targetSalary * salaryMultiplier,
    };
};

const skillDefinitionsForJob = (jobText: string, titleText: string, profile: JobMatchProfile) => {
    const definitions = [...SKILL_CATALOG];
    profile.explicitSkills.forEach((skill) => {
        if (!definitions.some((definition) => normalize(definition.label) === normalize(skill))) {
            definitions.push({ label: skill });
        }
    });

    return definitions
        .map((definition) => {
            const aliases = unique([definition.label, ...(definition.aliases || [])]);
            const inDescription = aliases.some((alias) => includesTerm(jobText, alias));
            const inTitle = aliases.some((alias) => includesTerm(titleText, alias));
            return inDescription || inTitle ? { ...definition, aliases, weight: inTitle ? 2 : 1 } : null;
        })
        .filter((definition): definition is SkillDefinition & { aliases: string[]; weight: number } => Boolean(definition));
};

const factor = (key: JobMatchFactor['key'], label: string, score: number, maxScore: number, evidence: string): JobMatchFactor => ({
    key,
    label,
    score: Math.max(0, Math.min(maxScore, Math.round(score))),
    maxScore,
    evidence,
});

export const assessJobMatch = (job: MatchableJob, profile: JobMatchProfile): ComprehensiveJobMatch => {
    const jobText = normalize(`${job.title} ${job.description} ${(job.signals || []).join(' ')}`);
    const titleText = normalize(job.title);

    const jobRoleTokens = unique(tokenizeRole(job.title));
    const overlappingRoleTokens = jobRoleTokens.filter((token) => profile.roleTokens.includes(token));
    const titleCoverage = jobRoleTokens.length ? overlappingRoleTokens.length / jobRoleTokens.length : 0;
    const inferredTitleFunction = detectJobFunction(job.title);
    const jobFunction = inferredTitleFunction !== 'Other'
        ? inferredTitleFunction
        : job.jobFunction || detectJobFunction(`${job.title} ${(job.signals || []).join(' ')}`);
    const functionPoints = profile.profileFunction === jobFunction ? 10 : relatedFunctions(profile.profileFunction, jobFunction) ? 5 : 0;
    const rolePoints = Math.round(titleCoverage * 20) + functionPoints;
    const roleEvidence = profile.roleTerms.length
        ? `${overlappingRoleTokens.length}/${jobRoleTokens.length || 0} title terms align; ${profile.profileFunction} compared with ${jobFunction}.`
        : 'No target role is available in the selected resume.';

    const requiredSkills = skillDefinitionsForJob(jobText, titleText, profile);
    const matchedDefinitions = requiredSkills.filter((definition) => definition.aliases.some((alias) => includesTerm(profile.resumeText, alias)));
    const totalSkillWeight = requiredSkills.reduce((sum, definition) => sum + definition.weight, 0);
    const matchedSkillWeight = matchedDefinitions.reduce((sum, definition) => sum + definition.weight, 0);
    const skillPoints = totalSkillWeight ? (matchedSkillWeight / totalSkillWeight) * 30 : 15;
    const matchedSkills = matchedDefinitions.map((definition) => definition.label);
    const missingSkills = requiredSkills.filter((definition) => !matchedDefinitions.includes(definition)).map((definition) => definition.label);
    const skillEvidence = totalSkillWeight
        ? `${matchedSkills.length}/${requiredSkills.length} detected job skills appear in the resume${missingSkills.length ? `; missing ${missingSkills.slice(0, 3).join(', ')}` : ''}.`
        : 'The listing does not expose enough specific skill requirements; this factor is neutral.';

    const requiredYears = Math.max(0, ...Array.from(jobText.matchAll(/\b(\d{1,2})\+?\s*(?:years?|yrs?)\b/g)).map((match) => Number(match[1])).filter((years) => years <= 20));
    const jobSeniority = seniorityLevel(`${job.seniority} ${job.title}`, null);
    let experiencePoints = 0;
    let experienceEvidence = '';
    if (requiredYears > 0 && profile.experienceYears !== null) {
        experiencePoints = Math.min(15, (profile.experienceYears / requiredYears) * 15);
        experienceEvidence = `${profile.experienceYears} years documented; listing asks for ${requiredYears}+ years.`;
    } else if (requiredYears > 0) {
        experiencePoints = 5;
        experienceEvidence = `Listing asks for ${requiredYears}+ years, but resume dates are incomplete.`;
    } else {
        const levelGap = jobSeniority - profile.profileSeniority;
        experiencePoints = levelGap <= 0 ? 15 : levelGap === 1 ? 10 : levelGap === 2 ? 5 : 2;
        experienceEvidence = `${profile.experienceYears ?? 'Unspecified'} years documented; compared with the listing's ${job.seniority || 'mid-level'} seniority.`;
    }

    const requiredEducation = /\b(phd|doctorate|doctoral)\b/.test(jobText) ? 4
        : /\b(master'?s?|mba|msc)\b/.test(jobText) ? 3
            : /\b(bachelor'?s?|four year degree|undergraduate degree)\b/.test(jobText) ? 2
                : 0;
    const educationPoints = requiredEducation === 0 ? 5 : profile.educationLevel >= requiredEducation ? 5 : profile.educationLevel === requiredEducation - 1 ? 2 : 0;
    const educationEvidence = requiredEducation === 0
        ? 'No degree requirement was detected in the listing.'
        : `${educationLabel(requiredEducation)} requested; resume shows ${profile.educationLabel}.`;

    const hasLocationPreference = Boolean(profile.locationPreferences.country || profile.locationPreferences.locations.length);
    const locationFit = getJobLocationFit(job, profile.locationPreferences);
    const locationPoints = !hasLocationPreference ? 10
        : locationFit.score >= 34 ? 10
            : locationFit.score >= 22 ? 8
                : locationFit.score >= 18 ? 7
                    : locationFit.score >= 12 ? 6
                        : locationFit.score >= 8 ? 5
                            : 1;
    const locationEvidence = !hasLocationPreference
        ? 'No country or location restriction is saved.'
        : locationFit.label
            ? `${job.location} aligns with ${locationFit.label}.`
            : `${job.location} does not match the saved location priorities.`;

    const workPreference = profile.locationPreferences.workModelPreference;
    const desiredWorkModel = workPreference === 'onsite' ? 'On-site' : workPreference === 'hybrid' ? 'Hybrid' : workPreference === 'remote' ? 'Remote' : '';
    const hasKnownWorkModel = ['Remote', 'Hybrid', 'On-site'].includes(job.workModel);
    const workModelPoints = !desiredWorkModel ? 3 : !hasKnownWorkModel ? 2 : job.workModel === desiredWorkModel ? 3 : 0;
    const schedule = normalize(profile.workSchedule);
    const jobType = normalize(job.jobType);
    const hasKnownSchedule = Boolean(jobType) && !/not listed|unknown|tracked/.test(jobType);
    const schedulePoints = !schedule ? 2 : !hasKnownSchedule ? 1 : jobType.includes(schedule) || schedule.includes(jobType) ? 2 : 0;
    const workPoints = workModelPoints + schedulePoints;
    const workEvidence = `${desiredWorkModel || 'Flexible'} work model and ${profile.workSchedule || 'any schedule'} compared with ${job.workModel || 'work model not listed'}, ${hasKnownSchedule ? job.jobType : 'schedule not listed'}.`;

    const salaryRange = parseSalaryRange(job.salary);
    const salaryFloor = profile.minimumSalary || profile.targetSalary;
    let compensationPoints = 5;
    let compensationEvidence = 'No salary floor is saved, so compensation does not reduce fit.';
    if (salaryFloor && salaryRange) {
        compensationPoints = Math.min(5, (salaryRange.max / salaryFloor) * 5);
        compensationEvidence = `Listed maximum ${Math.round(salaryRange.max).toLocaleString()} compared with saved floor ${Math.round(salaryFloor).toLocaleString()}.`;
    } else if (salaryFloor) {
        compensationPoints = 3;
        compensationEvidence = 'The listing does not publish compensation; this factor is neutral.';
    }

    const factors = [
        factor('role', 'Role alignment', rolePoints, 30, roleEvidence),
        factor('skills', 'Required skills', skillPoints, 30, skillEvidence),
        factor('experience', 'Experience and seniority', experiencePoints, 15, experienceEvidence),
        factor('education', 'Education', educationPoints, 5, educationEvidence),
        factor('location', 'Location eligibility', locationPoints, 10, locationEvidence),
        factor('work', 'Work arrangement', workPoints, 5, workEvidence),
        factor('compensation', 'Compensation', compensationPoints, 5, compensationEvidence),
    ];
    const score = factors.reduce((sum, item) => sum + item.score, 0);

    let evidenceWeight = 30;
    if (totalSkillWeight) evidenceWeight += 30;
    if (requiredYears > 0 || profile.experienceYears !== null) evidenceWeight += 15;
    if (requiredEducation > 0 || profile.educationLevel > 0) evidenceWeight += 5;
    if (hasLocationPreference) evidenceWeight += 10;
    if (desiredWorkModel || profile.workSchedule) evidenceWeight += 5;
    if (salaryFloor && salaryRange) evidenceWeight += 5;
    const confidence: MatchConfidence = evidenceWeight >= 75 ? 'High confidence' : evidenceWeight >= 50 ? 'Medium confidence' : 'Low confidence';
    const label: ComprehensiveMatchLabel = score >= 85 ? 'Strong match' : score >= 70 ? 'Good match' : score >= 55 ? 'Partial match' : 'Low match';
    const strengths = factors
        .filter((item) => item.score / item.maxScore >= 0.8)
        .sort((a, b) => (b.score / b.maxScore) - (a.score / a.maxScore))
        .map((item) => item.evidence)
        .slice(0, 3);
    const gaps = factors
        .filter((item) => item.score / item.maxScore < 0.65)
        .sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore))
        .map((item) => item.evidence)
        .slice(0, 4);

    return {
        score,
        label,
        confidence,
        factors,
        matchedSkills,
        missingSkills,
        strengths,
        gaps,
    };
};
