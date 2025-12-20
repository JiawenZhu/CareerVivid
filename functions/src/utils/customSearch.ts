export interface CustomSearchResult {
    title: string;
    link: string;
    snippet: string;
}

export const performGoogleSearch = async (query: string, apiKey: string, cx: string): Promise<CustomSearchResult[]> => {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('key', apiKey);
    url.searchParams.append('cx', cx);
    url.searchParams.append('q', query);
    url.searchParams.append('num', '10'); // Get top 10 results

    console.log(`[performGoogleSearch] Fetching results for: "${query}"`);

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[performGoogleSearch] API Error (${response.status}):`, errorText);
            throw new Error(`Google Search API returned ${response.status}`);
        }

        const data = await response.json();
        const items = data.items || [];

        return items.map((item: any) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
        }));
    } catch (error) {
        console.error('[performGoogleSearch] Exception during search:', error);
        return [];
    }
};
