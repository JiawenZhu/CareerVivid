import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { PianoRecording } from '../types/portfolio';

export const savePianoRecording = async (recording: Omit<PianoRecording, 'id' | 'timestamp'>) => {
    try {
        const docRef = await addDoc(collection(db, 'portfolio_piano_recordings'), {
            ...recording,
            timestamp: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error saving piano recording:", error);
        throw error;
    }
};

export const fetchRecentRecordings = async (max: number = 20): Promise<PianoRecording[]> => {
    try {
        const q = query(
            collection(db, 'portfolio_piano_recordings'),
            orderBy('timestamp', 'desc'),
            limit(max)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as PianoRecording));
    } catch (error) {
        console.error("Error fetching recordings:", error);
        return [];
    }
};
