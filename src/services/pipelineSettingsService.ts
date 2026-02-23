import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { PipelineSettings, PipelineStage } from '../types';

/**
 * Save pipeline settings for a user
 */
export const savePipelineSettings = async (
    userId: string,
    settings: Partial<PipelineSettings>
): Promise<void> => {
    const settingsRef = doc(db, 'users', userId, 'pipelineSettings', 'default');
    await setDoc(settingsRef, {
        ...settings,
        updatedAt: Timestamp.now()
    }, { merge: true });
};

/**
 * Load pipeline settings for a user
 */
export const loadPipelineSettings = async (
    userId: string
): Promise<PipelineSettings | null> => {
    const settingsRef = doc(db, 'users', userId, 'pipelineSettings', 'default');
    const snapshot = await getDoc(settingsRef);

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data() as PipelineSettings;
};

/**
 * Save custom stages
 */
export const saveCustomStages = async (
    userId: string,
    stages: PipelineStage[]
): Promise<void> => {
    await savePipelineSettings(userId, { customStages: stages });
};

/**
 * Save background theme
 */
export const saveBackgroundTheme = async (
    userId: string,
    theme: string
): Promise<void> => {
    await savePipelineSettings(userId, { backgroundTheme: theme as any });
};
