import { getAuth } from 'firebase/auth';
interface DownloadResumeParams {
    userId: string;
    resumeId: string;
    title?: string;
    onStart?: () => void;
    onComplete?: () => void;
    onError?: (error: string) => void;
}

export const downloadResume = async ({
    userId,
    resumeId,
    title = 'Resume',
    onStart,
    onComplete,
    onError
}: DownloadResumeParams) => {
    if (!userId || !resumeId) return;

    onStart?.();

    const projectId = 'jastalk-firebase';
    const functionUrl = `https://us-west1-${projectId}.cloudfunctions.net/generateResumePdfHttp`;

    let headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Attempt to get auth token for owner access
    try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (currentUser) {
            const token = await currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
        }
    } catch (e) {
        console.warn('Failed to get auth token for resume download, proceeding as public request', e);
    }

    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                userId,
                resumeId
            })
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            onComplete?.();
        } else {
            console.error('Resume download failed:', response.status, response.statusText);
            onError?.(`Failed to download (Status: ${response.status})`);
        }
    } catch (error: any) {
        console.error('Resume download error:', error);
        onError?.(error.message || 'Connection error');
    }
};
