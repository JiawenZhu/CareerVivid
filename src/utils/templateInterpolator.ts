import { UserProfile } from '../types';

/**
 * Replaces double-curly-brace markers in a template string with actual data.
 * 
 * Markers supported:
 * {{USER_NAME}}, {{USER_EMAIL}}, {{USER_TITLE}}, etc.
 * Nested data is supported via dot notation (e.g. {{experience.0.company}})
 */
export const interpolateTemplate = (templateString: string, userData: UserProfile | any): string => {
    if (!templateString || !userData) return templateString;

    // Helper to resolve nested object paths (e.g. "personalDetails.firstName")
    const resolvePath = (obj: any, path: string) => {
        return path.split('.').reduce((prev, curr) => {
            return prev && prev[curr] !== undefined ? prev[curr] : undefined;
        }, obj);
    };

    return templateString.replace(/"\{\{([\w.]+)\}\}"/g, (match, path) => {
        let value: any;
        // First try direct top-level matching for common macros
        switch (path) {
            case 'USER_NAME': value = userData.displayName || ''; break;
            case 'USER_EMAIL': value = userData.email || ''; break;
            case 'USER_SUMMARY': value = userData.summary || userData.about || 'A passionate professional looking for new opportunities.'; break;
            // Add more standard macros here as needed
            default: value = resolvePath(userData, path);
        }

        if (value === undefined) {
            return '""'; // default to empty string in JSON
        }

        // Since the whole placeholder is quoted in the original template (e.g. `"experience": "{{experience}}"`),
        // we replace the ALL of `"{{\w+}}"` with the JSON-stringified value natively, maintaining valid JSON boundaries.
        return JSON.stringify(value);
    }).replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
        // Second pass: handle inline markers (e.g., "Welcome {{USER_NAME}}", not wrapping the whole JSON value)
        let value: any;
        switch (path) {
            case 'USER_NAME': value = userData.displayName || ''; break;
            case 'USER_EMAIL': value = userData.email || ''; break;
            case 'USER_SUMMARY': value = userData.summary || userData.about || 'A passionate professional looking for new opportunities.'; break;
            default: value = resolvePath(userData, path);
        }

        if (value === undefined) return ''; // Hide missing inline values

        if (typeof value === 'object') {
            // Unlikely an object is meant to be inlined mid-string like "Hello {{object}}",
            // but if so, we must escape the quotes so it doesn't break the JSON wrapper.
            return JSON.stringify(value).replace(/"/g, '\\"');
        }

        return String(value);
    });
};
