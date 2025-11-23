
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { ResumeData } from '../types';

export const translateResumeContent = async (resume: ResumeData, targetLang: string): Promise<ResumeData> => {
    const translateText = httpsCallable(functions, 'translateText');
    
    const textToTranslate: Record<string, string> = {};
    
    // Helper to add text if it exists
    const add = (key: string, text: string) => {
        if (text && text.trim().length > 0) {
            textToTranslate[key] = text;
        }
    };

    // Extract fields to translate
    add('jobTitle', resume.personalDetails.jobTitle);
    add('summary', resume.professionalSummary);
    add('city', resume.personalDetails.city);
    add('country', resume.personalDetails.country);

    resume.employmentHistory.forEach((job, i) => {
        add(`emp_${i}_title`, job.jobTitle);
        add(`emp_${i}_desc`, job.description);
        add(`emp_${i}_city`, job.city);
    });

    resume.education.forEach((edu, i) => {
        add(`edu_${i}_degree`, edu.degree);
        add(`edu_${i}_desc`, edu.description);
        add(`edu_${i}_school`, edu.school);
        add(`edu_${i}_city`, edu.city);
    });

    resume.skills.forEach((skill, i) => {
        add(`skill_${i}`, skill.name);
    });

    // Call Cloud Function
    // Expected format: { text: { key: "value" }, targetLanguage: "es" }
    const result: any = await translateText({
        text: textToTranslate,
        targetLanguage: targetLang
    });

    const translations = result.data.translations;

    // Apply translations back to a clone of the resume
    const newResume = JSON.parse(JSON.stringify(resume));
    newResume.language = targetLang;
    
    // Update fields
    if (translations.jobTitle) newResume.personalDetails.jobTitle = translations.jobTitle;
    if (translations.summary) newResume.professionalSummary = translations.summary;
    if (translations.city) newResume.personalDetails.city = translations.city;
    if (translations.country) newResume.personalDetails.country = translations.country;

    newResume.employmentHistory.forEach((job: any, i: number) => {
        if (translations[`emp_${i}_title`]) job.jobTitle = translations[`emp_${i}_title`];
        if (translations[`emp_${i}_desc`]) job.description = translations[`emp_${i}_desc`];
        if (translations[`emp_${i}_city`]) job.city = translations[`emp_${i}_city`];
    });

    newResume.education.forEach((edu: any, i: number) => {
        if (translations[`edu_${i}_degree`]) edu.degree = translations[`edu_${i}_degree`];
        if (translations[`edu_${i}_desc`]) edu.description = translations[`edu_${i}_desc`];
        if (translations[`edu_${i}_school`]) edu.school = translations[`edu_${i}_school`];
        if (translations[`edu_${i}_city`]) edu.city = translations[`edu_${i}_city`];
    });

    newResume.skills.forEach((skill: any, i: number) => {
        if (translations[`skill_${i}`]) skill.name = translations[`skill_${i}`];
    });

    return newResume;
};
