import { ResumeData } from '../types';

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

// Helper to compute Jaccard similarity (word overlap) between two bullet strings
const getJaccardSimilarity = (strA: string, strB: string): number => {
    const cleanWords = (str: string) => {
        return new Set(
            str.toLowerCase()
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
    if (!description) return [];
    return description
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
    // ----------------------------------------------------
    // 1. SECTION COMPLETION SCORE (0 - 100)
    // ----------------------------------------------------
    const personal = resume.personalDetails || {};
    
    const completionItems: ScoreItem[] = [
        {
            id: 'firstName',
            label: 'First Name',
            isOk: !!personal.firstName?.trim(),
            category: 'personal',
            feedback: personal.firstName?.trim() ? 'Ok' : 'Please provide your first name'
        },
        {
            id: 'lastName',
            label: 'Last Name',
            isOk: !!personal.lastName?.trim(),
            category: 'personal',
            feedback: personal.lastName?.trim() ? 'Ok' : 'Please provide your last name'
        },
        {
            id: 'email',
            label: 'Email',
            isOk: !!personal.email?.trim(),
            category: 'personal',
            feedback: personal.email?.trim() ? 'Ok' : 'Add an email address so employers can reach you'
        },
        {
            id: 'phone',
            label: 'Phone Number',
            isOk: !!personal.phone?.trim(),
            category: 'personal',
            feedback: personal.phone?.trim() ? 'Ok' : 'Add a phone number to make scheduling interviews easy'
        },
        {
            id: 'location',
            label: 'Location',
            isOk: !!(personal.city?.trim() || personal.country?.trim() || personal.address?.trim()),
            category: 'personal',
            feedback: (personal.city?.trim() || personal.country?.trim() || personal.address?.trim()) ? 'Ok' : 'Provide your city, state, or country'
        },
        {
            id: 'summary',
            label: 'Professional Summary',
            isOk: !!resume.professionalSummary?.trim() && resume.professionalSummary.trim().length > 10,
            category: 'summary',
            feedback: (resume.professionalSummary?.trim() && resume.professionalSummary.trim().length > 10) ? 'Ok' : 'Add a brief professional summary about yourself'
        },
        {
            id: 'experience',
            label: 'Work Experiences',
            isOk: !!(resume.employmentHistory && resume.employmentHistory.length > 0),
            category: 'experience',
            feedback: (resume.employmentHistory && resume.employmentHistory.length > 0) ? 'Ok' : 'Add at least one work experience item'
        },
        {
            id: 'education',
            label: 'Educations',
            isOk: !!(resume.education && resume.education.length > 0),
            category: 'education',
            feedback: (resume.education && resume.education.length > 0) ? 'Ok' : 'Add your educational history'
        },
        {
            id: 'skills',
            label: 'Skills',
            isOk: !!(resume.skills && resume.skills.length > 0),
            category: 'skills',
            feedback: (resume.skills && resume.skills.length > 0) ? 'Ok' : 'List key professional skills to stand out'
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

    // Experience scanning setup
    const allJobs = resume.employmentHistory || [];
    
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
    if (actionVerbsOk) qualityPoints += 25;
    else if (hasActionVerbs) qualityPoints += 12; // Partial credit for having them even if repeated

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
    if (hasEnoughMetrics) qualityPoints += 25;
    else if (metricsRatio > 0) qualityPoints += Math.round(25 * (metricsRatio / 0.4)); // Partial credit

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
            
    qualityItems.push({
        id: 'bulletDensity',
        label: 'Ideal Bullet Densities',
        isOk: totalJobsEvaluated > 0 && experienceBulletCountOk,
        category: 'quality',
        feedback: bulletFeedback
    });
    if (totalJobsEvaluated > 0 && experienceBulletCountOk) qualityPoints += 25;

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
    if (!hasDuplicates) qualityPoints += 25;

    const qualityScore = qualityPoints;

    // ----------------------------------------------------
    // 4. CONTENT LENGTH & PAGE FULLNESS (0 - 100)
    // ----------------------------------------------------
    const lengthItems: ScoreItem[] = [];
    let lengthPoints = 0;

    // Calculate summary words
    const summaryText = resume.professionalSummary || '';
    const summaryWords = summaryText.trim().split(/\s+/).filter(w => w.length > 0).length;

    // Estimate total words on resume
    let totalWordCount = 0;
    totalWordCount += summaryWords;
    
    allJobs.forEach(h => {
        totalWordCount += (h.jobTitle || '').split(/\s+/).length;
        totalWordCount += (h.employer || '').split(/\s+/).length;
        totalWordCount += (h.description || '').split(/\s+/).filter(w => w.length > 0).length;
    });
    
    if (resume.education) {
        resume.education.forEach(e => {
            totalWordCount += (e.degree || '').split(/\s+/).length;
            totalWordCount += (e.school || '').split(/\s+/).length;
            totalWordCount += (e.description || '').split(/\s+/).filter(w => w.length > 0).length;
        });
    }
    
    if (resume.skills) {
        resume.skills.forEach(s => {
            totalWordCount += (s.name || '').split(/\s+/).length;
        });
    }

    const isWordCountAdequate = totalWordCount >= 250;
    lengthItems.push({
        id: 'wordCount',
        label: 'Resume Length',
        isOk: isWordCountAdequate,
        category: 'length',
        feedback: isWordCountAdequate
            ? 'Excellent! Your resume has a great length for a professional template.'
            : 'Too short! Add more descriptions, responsibilities, or bullet points to represent your experience.'
    });
    if (isWordCountAdequate) lengthPoints += 50;

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
