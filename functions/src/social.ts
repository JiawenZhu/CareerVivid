import * as functions from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";

// Mock Data Service for Social Stats
const getMockTikTokStats = (username: string) => {
    // Generate deterministic but realistic-looking stats based on username length
    const base = username.length * 1000;
    return {
        followerCount: base * 12 + 543,
        heartCount: base * 150 + 2300,
        videoCount: base / 2 + 10,
        // Mock Top 3 Videos
        topVideos: [
            {
                id: '1',
                thumbnailUrl: 'https://images.unsplash.com/photo-1611605698389-eb4f98bb521d?w=400&h=600&fit=crop',
                views: base * 50,
                url: `https://www.tiktok.com/@${username}/video/1`
            },
            {
                id: '2',
                thumbnailUrl: 'https://images.unsplash.com/photo-1596558450255-7c0baff34cb0?w=400&h=600&fit=crop',
                views: base * 30,
                url: `https://www.tiktok.com/@${username}/video/2`
            },
            {
                id: '3',
                thumbnailUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=600&fit=crop',
                views: base * 10,
                url: `https://www.tiktok.com/@${username}/video/3`
            }
        ]
    };
};

export const getSocialStats = onCall(
    {
        region: "us-west1",
    },
    async (request) => {
        const { platform, username } = request.data;

        if (!username) {
            throw new HttpsError('invalid-argument', 'Username is required.');
        }

        if (platform === 'tiktok') {
            const stats = getMockTikTokStats(username);
            return {
                data: stats,
                success: true
            };
        }

        throw new HttpsError('unimplemented', 'Platform not supported.');
    }
);
