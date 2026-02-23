import {
    collection,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    limit,
    increment,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION_NAME = 'tiktok_leaderboard';

export interface LeaderboardPlayer {
    id: string;
    name: string;
    score: number;
    createdAt?: any;
}

export const leaderboardService = {
    // Subscribe to top users in real-time
    subscribeToLeaderboard: (callback: (players: LeaderboardPlayer[]) => void, maxResults = 50) => {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('score', 'desc'),
            limit(maxResults)
        );

        // Return unsubscribe function
        return onSnapshot(q, (snapshot) => {
            const players: LeaderboardPlayer[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as LeaderboardPlayer));
            callback(players);
        });
    },

    // Add a new player to the game
    addPlayer: async (name: string): Promise<string> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                name,
                score: 0,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error adding player:", error);
            throw error;
        }
    },

    // Update player score atomically
    updateScore: async (playerId: string, incrementBy: number = 1) => {
        if (!playerId) return;

        try {
            const playerRef = doc(db, COLLECTION_NAME, playerId);
            await updateDoc(playerRef, {
                score: increment(incrementBy)
            });
        } catch (error) {
            console.error("Error updating score:", error);
        }
    }
};
