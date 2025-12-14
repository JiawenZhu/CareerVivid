import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Comment {
    id?: string;
    text: string;
    author: string;
    userId?: string; // Optional: if the commenter is a logged-in user
    createdAt: Timestamp | null;
}

const COLLECTION_NAME = 'comments';

export const subscribeToComments = (
    ownerId: string,
    resumeId: string,
    callback: (comments: Comment[]) => void
) => {
    // Path: users/{userId}/resumes/{resumeId}/comments
    const commentsRef = collection(db, 'users', ownerId, 'resumes', resumeId, COLLECTION_NAME);
    const q = query(commentsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Comment));
        callback(comments);
    });
};

export const addComment = async (
    ownerId: string,
    resumeId: string,
    text: string,
    author: string,
    userId?: string
) => {
    const commentsRef = collection(db, 'users', ownerId, 'resumes', resumeId, COLLECTION_NAME);

    await addDoc(commentsRef, {
        text,
        author,
        userId: userId || null,
        createdAt: serverTimestamp()
    });
};
