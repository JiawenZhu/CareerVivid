
import {
    collection,
    addDoc,
    serverTimestamp,
    FieldValue
} from 'firebase/firestore';
import { db } from '../../../firebase';

export interface PortfolioMessage {
    id?: string;
    text: string;
    senderName: string;
    senderEmail: string;
    subject: string;
    createdAt: FieldValue;
    isRead: boolean;
    isDone: boolean;
    isDeleted: boolean;
    portfolioId: string; // Critical for isolation
    type: 'portfolio_inquiry';
}

/**
 * Sends a message from a portfolio viewer to the portfolio owner.
 * Path: users/{ownerId}/messages
 */
export const sendMessage = async (
    ownerId: string,
    portfolioId: string,
    text: string,
    senderName: string,
    senderEmail: string,
    subject: string
) => {
    // Reference to the user's "messages" subcollection
    const messagesRef = collection(db, 'users', ownerId, 'messages');

    await addDoc(messagesRef, {
        text,
        senderName: senderName || 'Guest Visitor',
        senderEmail: senderEmail || '',
        subject: subject || 'No Subject',
        createdAt: serverTimestamp(),
        isRead: false,
        isDone: false,
        isDeleted: false,
        portfolioId,
        type: 'portfolio_inquiry'
    });
};
