import axios from 'axios';
import * as functions from "firebase-functions";

// These will be populated with real keys once provided by the user
const CLIENT_KEY = functions.config().tiktok?.client_key || 'PLACEHOLDER_CLIENT_KEY';
const CLIENT_SECRET = functions.config().tiktok?.client_secret || 'PLACEHOLDER_CLIENT_SECRET';
const REDIRECT_URI = functions.config().tiktok?.redirect_uri || 'PLACEHOLDER_REDIRECT_URI';

export const getAuthUrl = (state: string) => {
    const csrfState = state;
    let url = 'https://www.tiktok.com/v2/auth/authorize/';
    url += `?client_key=${CLIENT_KEY}`;
    url += `&scope=user.info.basic,video.list`;
    url += `&response_type=code`;
    url += `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    url += `&state=${csrfState}`;
    return url;
};

export const getAccessToken = async (code: string) => {
    if (CLIENT_KEY === 'PLACEHOLDER_CLIENT_KEY') {
        throw new Error('TikTok API Keys not configured.');
    }

    try {
        const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', new URLSearchParams({
            client_key: CLIENT_KEY,
            client_secret: CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-cache'
            }
        });
        return response.data;
    } catch (error: any) {
        console.error('Error getting access token:', error.response?.data || error.message);
        throw error;
    }
};

export const getUserInfo = async (accessToken: string) => {
    // Mock for now if keys are missing
    if (CLIENT_KEY === 'PLACEHOLDER_CLIENT_KEY') {
        return {
            follower_count: 125000,
            display_name: "Mock User",
            avatar_url: "https://via.placeholder.com/150"
        };
    }
    // Real implementation
    // const response = await axios.get(...)
    return null;
};
