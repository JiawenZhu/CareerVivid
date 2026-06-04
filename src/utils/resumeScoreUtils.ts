import { ResumeData } from '../types';
import {
    normalizeReviewEmploymentHistory,
    normalizeReviewSkills,
    safeReviewArray,
    safeReviewText,
} from './aiReviewDataGuards';

export interface ScoreItem {
    id: string;
    label: string;
    isOk: boolean;
    category: 'personal' | 'experience' | 'education' | 'summary' | 'skills' | 'quality' | 'length';
    feedback: string;
}

export interface RepeatedVerbOccurrence {
    verb: string;
    count: number;
}

export interface NonQuantifiableBullet {
    experienceId: string;
    company: string;
    jobTitle: string;
    bulletIndex: number;
    text: string;
}

export interface SimilarBulletPair {
    experienceIdA: string;
    companyA: string;
    jobTitleA: string;
    bulletIndexA: number;
    textA: string;
    
    experienceIdB: string;
    companyB: string;
    jobTitleB: string;
    bulletIndexB: number;
    textB: string;
    
    similarity: number; // 0 to 1
}

export interface BulletDensityIssue {
    experienceId: string;
    company: string;
    jobTitle: string;
    count: number;
    text: string;
    issueType: 'too_few' | 'too_many' | 'paragraph';
}

export interface ScoreBreakdown {
    overallScore: number;
    
    completionScore: number;
    completionItems: ScoreItem[];
    
    qualityScore: number;
    qualityItems: ScoreItem[];
    
    lengthScore: number;
    lengthItems: ScoreItem[];

    // Expanded AI features
    repeatedVerbs: RepeatedVerbOccurrence[];
    nonQuantifiableBullets: NonQuantifiableBullet[];
    similarBulletPairs: SimilarBulletPair[];
    bulletDensityIssues: BulletDensityIssue[];
}

const ACTION_VERBS = [
    'led', 'developed', 'managed', 'optimized', 'created', 'designed', 'built', 
    'implemented', 'supervised', 'directed', 'coordinated', 'structured', 'established', 
    'initiated', 'improved', 'increased', 'decreased', 'resolved', 'analyzed', 
    'engineered', 'launched', 'delivered', 'conducted', 'formulated', 'spearheaded',
    'ensure', 'ensured', 'coordinate', 'assisted', 'support', 'supported', 'manage',
    'provide', 'provided', 'maintain', 'maintained', 'prepare', 'prepared'
];

const ROLE_SKILL_REQUIREMENTS: Record<string, Array<{ label: string; aliases: string[] }>> = {
    support: [
        { label: 'REST APIs', aliases: ['rest api', 'rest apis', 'api troubleshooting', 'apis'] },
        { label: 'Troubleshooting', aliases: ['troubleshooting', 'debugging', 'debug'] },
        { label: 'System Monitoring', aliases: ['system monitoring', 'monitoring', 'datadog', 'splunk', 'logs'] },
        { label: 'Root Cause Analysis', aliases: ['root cause', 'rca'] },
        { label: 'Ticketing Systems', aliases: ['jira', 'servicenow', 'zendesk', 'ticket'] },
        { label: 'Customer Escalations', aliases: ['escalation', 'customer support', 'technical support'] },
    ],
    software: [
        { label: 'Frontend Engineering', aliases: ['react', 'typescript', 'javascript', 'frontend', 'front-end'] },
        { label: 'Backend/API Engineering', aliases: ['api', 'node', 'python', 'java', 'backend'] },
        { label: 'Databases', aliases: ['sql', 'postgres', 'mysql', 'nosql', 'database'] },
        { label: 'Cloud/DevOps', aliases: ['aws', 'gcp', 'azure', 'docker', 'kubernetes', 'ci/cd'] },
        { label: 'Testing', aliases: ['testing', 'qa', 'unit test', 'automation'] },
    ],
    data: [
        { label: 'SQL/Data Analysis', aliases: ['sql', 'data analysis', 'analytics'] },
        { label: 'Python', aliases: ['python', 'pandas', 'numpy'] },
        { label: 'Visualization', aliases: ['tableau', 'power bi', 'dashboard'] },
        { label: 'Machine Learning', aliases: ['machine learning', 'ml', 'model'] },
    ],
};

const getRoleSkillRequirements = (roleText: string) => {
    const text = roleText.toLowerCase();
    if (/(support|technical support|customer|service|troubleshoot|ticket|incident)/.test(text)) {
        return ROLE_SKILL_REQUIREMENTS.support;
    }
    if (/(data|analytics|analyst|machine learning|ml)/.test(text)) {
        return ROLE_SKILL_REQUIREMENTS.data;
    }
    if (/(software|developer|engineer|full[-\s]?stack|frontend|backend)/.test(text)) {
        return ROLE_SKILL_REQUIREMENTS.software;
    }
    return [];
};

const getSkillNamesForScoring = (skills: ReturnType<typeof normalizeReviewSkills>): string[] => {
    const seen = new Set<string>();
    return skills
        .flatMap((skill) => safeReviewText(skill.name).split(/[\n;,]+/))
        .map((skill) => skill.trim())
        .filter(Boolean)
        .filter((skill) => {
            const key = skill.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
};

// Helper to compute Jaccard similarity (word overlap) between two bullet strings
const getJaccardSimilarity = (strA: string, strB: string): number => {
    const cleanWords = (str: string) => {
        return new Set(
            safeReviewText(str).toLowerCase()
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 2) // ignore small prepositions/articles
        );
    };

    const setA = cleanWords(strA);
    const setB = cleanWords(strB);

    if (setA.size === 0 || setB.size === 0) return 0;

    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    return intersection.size / union.size;
};

// Helper to parse individual bullet achievements from a job description
export const parseBulletPoints = (description: string): string[] => {
    const safeDescription = safeReviewText(description);
    if (!safeDescription) return [];
    return safeDescription
        .split('\n')
        .map(line => {
            // Strip common list bullet markers
            return line.trim()
                .replace(/^[-*•+\s]+/, '')
                .trim();
        })
        .filter(line => line.length >= 10); // ignore short lines or headers
};

export const calculateResumeScore = (resume: ResumeData): ScoreBreakdown => {
    const safeResume = (resume || {}) as Partial<ResumeData>;
    // ----------------------------------------------------
    // 1. SECTION COMPLETION SCORE (0 - 100)
    // ----------------------------------------------------
    const personal = safeResume.personalDetails || {};
    const professionalSummary = safeReviewText(safeResume.professionalSummary);
    const allJobs = normalizeReviewEmploymentHistory(safeResume.employmentHistory);
    const education = safeReviewArray(safeResume.education);
    const skills = normalizeReviewSkills(safeResume.skills);
    
    const completionItems: ScoreItem[] = [
        {
            id: 'firstName',
            label: 'First Name',
            isOk: !!safeReviewText(personal.firstName).trim(),
            category: 'personal',
            feedback: safeReviewText(personal.firstName).trim() ? 'Ok' : 'Please provide your first name'
        },
        {
            id: 'lastName',
            label: 'Last Name',
            isOk: !!safeReviewText(personal.lastName).trim(),
            category: 'personal',
            feedback: safeReviewText(personal.lastName).trim() ? 'Ok' : 'Please provide your last name'
        },
        {
            id: 'email',
            label: 'Email',
            isOk: !!safeReviewText(personal.email).trim(),
            category: 'personal',
            feedback: safeReviewText(personal.email).trim() ? 'Ok' : 'Add an email address so employers can reach you'
        },
        {
            id: 'phone',
            label: 'Phone Number',
            isOk: !!safeReviewText(personal.phone).trim(),
            category: 'personal',
            feedback: safeReviewText(personal.phone).trim() ? 'Ok' : 'Add a phone number to make scheduling interviews easy'
        },
        {
            id: 'location',
            label: 'Location',
            isOk: !!(safeReviewText(personal.city).trim() || safeReviewText(personal.country).trim() || safeReviewText(personal.address).trim()),
            category: 'personal',
            feedback: (safeReviewText(personal.city).trim() || safeReviewText(personal.country).trim() || safeReviewText(personal.address).trim()) ? 'Ok' : 'Provide your city, state, or country'
        },
        {
            id: 'summary',
            label: 'Professional Summary',
            isOk: !!professionalSummary.trim() && professionalSummary.trim().length > 10,
            category: 'summary',
            feedback: (professionalSummary.trim() && professionalSummary.trim().length > 10) ? 'Ok' : 'Add a brief professional summary about yourself'
        },
        {
            id: 'experience',
            label: 'Work Experiences',
            isOk: allJobs.length > 0,
            category: 'experience',
            feedback: allJobs.length > 0 ? 'Ok' : 'Add at least one work experience item'
        },
        {
            id: 'education',
            label: 'Educations',
            isOk: education.length > 0,
            category: 'education',
            feedback: education.length > 0 ? 'Ok' : 'Add your educational history'
        },
        {
            id: 'skills',
            label: 'Skills',
            isOk: skills.length > 0,
            category: 'skills',
            feedback: skills.length > 0 ? 'Ok' : 'List key professional skills to stand out'
        }
    ];

    const completedPersonal = completionItems.filter(item => item.category === 'personal' && item.isOk).length;
    const completedSections = completionItems.filter(item => item.category !== 'personal' && item.isOk).length;
    
    const completionScore = Math.round((completedPersonal * 10) + (completedSections * 12.5));

    // ----------------------------------------------------
    // 2. HEURISTICS & ADVANCED AI SCANNING
    // ----------------------------------------------------
    const repeatedVerbs: RepeatedVerbOccurrence[] = [];
    const nonQuantifiableBullets: NonQuantifiableBullet[] = [];
    const similarBulletPairs: SimilarBulletPair[] = [];
    const bulletDensityIssues: BulletDensityIssue[] = [];

    // A. Scan Verb Frequency
    const verbCounts: Record<string, number> = {};
    allJobs.forEach(job => {
        const desc = job.description || '';
        const words = desc.toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 0);
            
        words.forEach(word => {
            if (ACTION_VERBS.includes(word)) {
                verbCounts[word] = (verbCounts[word] || 0) + 1;
            }
        });
    });

    Object.entries(verbCounts).forEach(([verb, count]) => {
        if (count >= 3) {
            repeatedVerbs.push({ verb, count });
        }
    });

    // B. Scan Non-Quantifiable Achievements (absence of numbers/metrics)
    allJobs.forEach(job => {
        const bullets = parseBulletPoints(job.description || '');
        bullets.forEach((bullet, index) => {
            // Regex checks if bullet has NO digits (\d)
            const hasNumbers = /\d/.test(bullet);
            if (!hasNumbers) {
                nonQuantifiableBullets.push({
                    experienceId: job.id,
                    company: job.employer || 'Company',
                    jobTitle: job.jobTitle || 'Role',
                    bulletIndex: index,
                    text: bullet
                });
            }
        });
    });

    // C. Scan Similarity and Duplications between all bullets
    interface IndexedBullet {
        jobId: string;
        company: string;
        jobTitle: string;
        index: number;
        text: string;
    }

    const flatBullets: IndexedBullet[] = [];
    allJobs.forEach(job => {
        const bullets = parseBulletPoints(job.description || '');
        bullets.forEach((bullet, index) => {
            flatBullets.push({
                jobId: job.id,
                company: job.employer || 'Company',
                jobTitle: job.jobTitle || 'Role',
                index,
                text: bullet
            });
        });
    });

    for (let i = 0; i < flatBullets.length; i++) {
        for (let j = i + 1; j < flatBullets.length; j++) {
            const similarity = getJaccardSimilarity(flatBullets[i].text, flatBullets[j].text);
            if (similarity >= 0.5) { // 50% or higher word overlap is highly repetitive
                similarBulletPairs.push({
                    experienceIdA: flatBullets[i].jobId,
                    companyA: flatBullets[i].company,
                    jobTitleA: flatBullets[i].jobTitle,
                    bulletIndexA: flatBullets[i].index,
                    textA: flatBullets[i].text,
                    
                    experienceIdB: flatBullets[j].jobId,
                    companyB: flatBullets[j].company,
                    jobTitleB: flatBullets[j].jobTitle,
                    bulletIndexB: flatBullets[j].index,
                    textB: flatBullets[j].text,
                    
                    similarity
                });
            }
        }
    }

    // ----------------------------------------------------
    // 3. CONTENT QUALITY SCORE (0 - 100)
    // ----------------------------------------------------
    const qualityItems: ScoreItem[] = [];
    let qualityPoints = 0;
    
    // Check Action Verbs in Work Experiences
    let hasActionVerbs = false;
    if (allJobs.length > 0) {
        const fullExpText = allJobs
            .map(h => (h.description || '').toLowerCase())
            .join(' ');
        
        hasActionVerbs = ACTION_VERBS.some(verb => {
            const regex = new RegExp(`\\b${verb}`, 'i');
            return regex.test(fullExpText);
        });
    }
    
    const actionVerbsOk = hasActionVerbs && repeatedVerbs.length === 0;
    const actionVerbFeedback = !hasActionVerbs
        ? 'Try starting experience bullets with active verbs like "Led", "Engineered", or "Spearheaded".'
        : repeatedVerbs.length > 0
            ? `Action verb repetition detected! "${repeatedVerbs.map(v => v.verb).join(', ')}" is used too many times.`
            : 'Great job! Your work history contains strong, non-repetitive action verbs.';

    qualityItems.push({
        id: 'actionVerbs',
        label: 'No Repetitive Action Verbs',
        isOk: actionVerbsOk,
        category: 'quality',
        feedback: actionVerbFeedback
    });
    if (actionVerbsOk) qualityPoints += 20;
    else if (hasActionVerbs) qualityPoints += 10; // Partial credit for having them even if repeated

    // Check Metrics & Numbers (ideal: at least 40% of bullets contain metrics)
    const totalBulletsCount = flatBullets.length;
    const quantifiableBulletsCount = totalBulletsCount - nonQuantifiableBullets.length;
    const metricsRatio = totalBulletsCount > 0 ? (quantifiableBulletsCount / totalBulletsCount) : 0;
    const hasEnoughMetrics = totalBulletsCount > 0 ? (metricsRatio >= 0.4) : false;

    const metricsFeedback = totalBulletsCount === 0
        ? 'No experience achievements provided.'
        : hasEnoughMetrics
            ? 'Excellent use of numbers! Your metrics represent highly tangible business results.'
            : `We found ${nonQuantifiableBullets.length} achievements that do not use numbers. Add concrete metrics to stand out.`;

    qualityItems.push({
        id: 'quantifiableMetrics',
        label: 'Use of Metrics & Numbers',
        isOk: hasEnoughMetrics,
        category: 'quality',
        feedback: metricsFeedback
    });
    if (hasEnoughMetrics) qualityPoints += 20;
    else if (metricsRatio > 0) qualityPoints += Math.round(20 * (metricsRatio / 0.4)); // Partial credit

    // Check whether the skills section covers the role the resume is targeting.
    // This is a score bridge for AI Review: ATS skill recommendations should move readiness,
    // but only when they fill concrete role-critical gaps.
    const skillNames = getSkillNamesForScoring(skills);
    const skillText = skillNames.join(' ').toLowerCase();
    const roleText = [
        safeReviewText(personal.jobTitle),
        professionalSummary,
        ...allJobs.map((job) => `${job.jobTitle} ${job.description}`),
    ].join(' ');
    const roleRequirements = getRoleSkillRequirements(roleText);
    const matchedRoleSkills = roleRequirements.filter((requirement) =>
        requirement.aliases.some((alias) => skillText.includes(alias))
    );
    const roleCoverageRatio = roleRequirements.length > 0
        ? matchedRoleSkills.length / roleRequirements.length
        : Math.min(skillNames.length / 8, 1);
    const hasEnoughSkillDepth = skillNames.length >= 8;
    const skillCoverageOk = hasEnoughSkillDepth && roleCoverageRatio >= 0.65;
    const missingRoleSkillLabels = roleRequirements
        .filter((requirement) => !matchedRoleSkills.includes(requirement))
        .map((requirement) => requirement.label);

    qualityItems.push({
        id: 'roleSkillCoverage',
        label: 'Role Keyword Coverage',
        isOk: skillCoverageOk,
        category: 'quality',
        feedback: skillCoverageOk
            ? 'Your skills include the core keywords recruiters and ATS screens expect for this role.'
            : roleRequirements.length > 0
                ? `Add role-critical skills such as ${missingRoleSkillLabels.slice(0, 4).join(', ')} to improve ATS readiness.`
                : 'Add a deeper set of role-specific skills so recruiters can quickly see your fit.'
    });
    const skillReadinessPoints = skillCoverageOk
        ? 20
        : Math.round(20 * Math.min(roleCoverageRatio, hasEnoughSkillDepth ? 0.8 : 0.5));

    // Check Bullet Point Counts per Experience (sweet spot: 3 to 6 bullets per job)
    let experienceBulletCountOk = true;
    let totalJobsEvaluated = 0;
    
    allJobs.forEach(job => {
        const rawDesc = (job.description || '').trim();
        if (rawDesc.length > 10) {
            totalJobsEvaluated++;
            const bullets = parseBulletPoints(rawDesc);
            const count = bullets.length;
            
            // Check if plain paragraph format
            const hasBulletMarkers = /^\s*[-*•+]/m.test(job.description || '');
            
            if (!hasBulletMarkers && count <= 2) {
                bulletDensityIssues.push({
                    experienceId: job.id,
                    company: job.employer || 'Company',
                    jobTitle: job.jobTitle || 'Role',
                    count,
                    text: rawDesc,
                    issueType: 'paragraph'
                });
                experienceBulletCountOk = false;
            } else if (count < 3) {
                bulletDensityIssues.push({
                    experienceId: job.id,
                    company: job.employer || 'Company',
                    jobTitle: job.jobTitle || 'Role',
                    count,
                    text: rawDesc,
                    issueType: 'too_few'
                });
                experienceBulletCountOk = false;
            } else if (count > 6) {
                bulletDensityIssues.push({
                    experienceId: job.id,
                    company: job.employer || 'Company',
                    jobTitle: job.jobTitle || 'Role',
                    count,
                    text: rawDesc,
                    issueType: 'too_many'
                });
                experienceBulletCountOk = false;
            }
        }
    });
    
    let bulletFeedback = '';
    if (totalJobsEvaluated === 0) {
        bulletFeedback = 'No experience bullet points found.';
    } else if (experienceBulletCountOk) {
        bulletFeedback = 'Excellent bullet density! Your job descriptions are concise and informative.';
    } else {
        const companies = bulletDensityIssues.map(i => i.company).join(', ');
        bulletFeedback = `Aim for 3-6 key achievement bullet points per work experience to avoid clutter. We found issues at: ${companies}.`;
    }
            
    const healthyBulletDensityJobs = Math.max(0, totalJobsEvaluated - bulletDensityIssues.length);
    const bulletDensityPoints = totalJobsEvaluated > 0
        ? Math.round(20 * (healthyBulletDensityJobs / totalJobsEvaluated))
        : 0;

    qualityItems.push({
        id: 'bulletDensity',
        label: 'Ideal Bullet Densities',
        isOk: totalJobsEvaluated > 0 && experienceBulletCountOk,
        category: 'quality',
        feedback: bulletFeedback
    });
    qualityPoints += bulletDensityPoints;

    // Check for Duplicated/Similar Bullet Points
    const hasDuplicates = similarBulletPairs.length > 0;
    const duplicateFeedback = !hasDuplicates
        ? 'All achievements highlight unique skills and accomplishments.'
        : `We found ${similarBulletPairs.length} pair(s) of achievements that are highly similar. Try varying your focus areas.`;

    qualityItems.push({
        id: 'similarBullets',
        label: 'No Repetitive Bullet Points',
        isOk: !hasDuplicates,
        category: 'quality',
        feedback: duplicateFeedback
    });
    if (!hasDuplicates) qualityPoints += 20;

    const qualityScore = Math.min(100, qualityPoints + skillReadinessPoints);

    // ----------------------------------------------------
    // 4. CONTENT LENGTH & PAGE FULLNESS (0 - 100)
    // ----------------------------------------------------
    const lengthItems: ScoreItem[] = [];
    let lengthPoints = 0;

    // Calculate summary words
    const summaryText = professionalSummary;
    const summaryWords = summaryText.trim().split(/\s+/).filter(w => w.length > 0).length;

    // Estimate total words on resume
    let totalWordCount = 0;
    totalWordCount += summaryWords;
    
    allJobs.forEach(h => {
        totalWordCount += (h.jobTitle || '').split(/\s+/).length;
        totalWordCount += (h.employer || '').split(/\s+/).length;
        totalWordCount += (h.description || '').split(/\s+/).filter(w => w.length > 0).length;
    });
    
    if (education.length > 0) {
        education.forEach(e => {
            totalWordCount += (e.degree || '').split(/\s+/).length;
            totalWordCount += (e.school || '').split(/\s+/).length;
            totalWordCount += (e.description || '').split(/\s+/).filter(w => w.length > 0).length;
        });
    }
    
    if (skills.length > 0) {
        skills.forEach(s => {
            totalWordCount += (s.name || '').split(/\s+/).length;
        });
    }

    const isWordCountAdequate = totalWordCount >= 250;
    const wordCountPoints = isWordCountAdequate
        ? 50
        : Math.max(0, Math.round(50 * (totalWordCount / 250)));
    lengthItems.push({
        id: 'wordCount',
        label: 'Resume Length',
        isOk: isWordCountAdequate,
        category: 'length',
        feedback: isWordCountAdequate
            ? 'Excellent! Your resume has a great length for a professional template.'
            : 'Too short! Add more descriptions, responsibilities, or bullet points to represent your experience.'
    });
    lengthPoints += wordCountPoints;

    // Spacing optimization feedback
    let pageFullnessRating: 'perfect' | 'blank_space' | 'overflow' = 'perfect';
    if (totalWordCount > 0 && totalWordCount < 260) {
        pageFullnessRating = 'blank_space';
    } else if (totalWordCount >= 420 && totalWordCount <= 520) {
        pageFullnessRating = 'overflow';
    }
    
    let fullnessFeedback = 'Perfect page utilization! Your formatting balances spacing and content beautifully.';
    if (pageFullnessRating === 'blank_space') {
        fullnessFeedback = 'Too much blank space. The page has a lot of empty margins. Try editing your resume up with more professional achievements.';
    } else if (pageFullnessRating === 'overflow') {
        fullnessFeedback = 'Potential page overflow! Spacing might cause 1-2 lines to spill onto the next page. Use the Design tab to compact spacing.';
    }

    lengthItems.push({
        id: 'pageFullness',
        label: 'Page Spacing Fullness',
        isOk: pageFullnessRating === 'perfect',
        category: 'length',
        feedback: fullnessFeedback
    });
    if (pageFullnessRating === 'perfect') lengthPoints += 50;
    else if (pageFullnessRating === 'overflow') lengthPoints += 30;
    else lengthPoints += 15;

    const lengthScore = lengthPoints;

    // ----------------------------------------------------
    // 5. OVERALL SCORE (Weighted Average)
    // ----------------------------------------------------
    const overallScore = Math.round((completionScore * 0.4) + (qualityScore * 0.4) + (lengthScore * 0.2));

    return {
        overallScore,
        completionScore,
        completionItems,
        qualityScore,
        qualityItems,
        lengthScore,
        lengthItems,
        repeatedVerbs,
        nonQuantifiableBullets,
        similarBulletPairs,
        bulletDensityIssues
    };
};
