import { db } from '../../../firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { LinkTreeTheme } from '../styles/linktreeThemes';

const COLLECTION_NAME = 'user_themes';

export const saveCustomTheme = async (userId: string, theme: Omit<LinkTreeTheme, 'id'>) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...theme,
            userId,
            createdAt: Date.now()
        });
        return { ...theme, id: docRef.id };
    } catch (error) {
        console.error('Error saving theme:', error);
        throw error;
    }
};

export const getUserThemes = async (userId: string): Promise<LinkTreeTheme[]> => {
    try {
        const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LinkTreeTheme));
    } catch (error) {
        console.error('Error fetching themes:', error);
        return [];
    }
};

export const deleteCustomTheme = async (themeId: string) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, themeId));
    } catch (error) {
        console.error('Error deleting theme:', error);
        throw error;
    }
};
