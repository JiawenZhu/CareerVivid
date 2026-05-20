export interface CustomSearchResult {
    title: string;
    link: string;
    snippet: string;
}

export const performGoogleSearch = async (query: string, apiKey: string, cx: string, numResults: number = 10): Promise<CustomSearchResult[]> => {
    // Helper to fetch a single page of results (10 results per page)
    const fetchPage = async (start: number): Promise<CustomSearchResult[]> => {
        const url = new URL('https://www.googleapis.com/customsearch/v1');
        url.searchParams.append('key', apiKey);
        url.searchParams.append('cx', cx);
        url.searchParams.append('q', query);
        url.searchParams.append('num', '10');
        url.searchParams.append('start', start.toString());
        // For US region targeting
        url.searchParams.append('gl', 'us');
        url.searchParams.append('cr', 'countryUS');

        console.log(`[performGoogleSearch] Fetching page start=${start} for query: "${query}"`);

        try {
            const response = await fetch(url.toString());
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[performGoogleSearch] Page start=${start} Error (${response.status}):`, errorText);
                return [];
            }

            const data = await response.json();
            const items = data.items || [];

            return items.map((item: any) => ({
                title: item.title,
                link: item.link,
                snippet: item.snippet
            }));
        } catch (error) {
            console.error(`[performGoogleSearch] Exception during search page start=${start}:`, error);
            return [];
        }
    };

    if (numResults <= 10) {
        return fetchPage(1);
    } else {
        // Fetch pages starting at 1 and 11 in parallel
        console.log(`[performGoogleSearch] Fetching 2 pages in parallel for query: "${query}"`);
        const [page1, page2] = await Promise.all([fetchPage(1), fetchPage(11)]);
        return [...page1, ...page2];
    }
};
