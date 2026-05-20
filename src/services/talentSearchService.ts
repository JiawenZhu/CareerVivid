import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

/**
 * Call the Cloud Talent Solution autocomplete endpoint.
 */
export const getTalentAutocomplete = async (query: string): Promise<string[]> => {
    if (!query || query.trim().length < 2) {
        return [];
    }

    try {
        const autocompleteFn = httpsCallable(functions, 'jobs-getTalentAutocomplete');
        const result = await autocompleteFn({ query });
        return result.data as string[];
    } catch (error) {
        console.error("[talentSearchService] Error calling getTalentAutocomplete:", error);
        return [];
    }
};
