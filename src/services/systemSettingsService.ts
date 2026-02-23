import { db } from '../firebase';
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export interface LandingPageSettings {
    featuredResumeSuffix: string;
    updatedAt?: any;
    updatedBy?: string;
}

const SETTINGS_COLLECTION = 'system_settings';
const LANDING_PAGE_DOC = 'landing_page';

export const DEFAULT_LANDING_PAGE_SETTINGS: LandingPageSettings = {
    featuredResumeSuffix: 'shared/n95XpkySLMhwcHcpKTOpFAqrOPi2/H0t3jJ0CNMrrsIpWy9Yr'
};

export const subscribeToLandingPageSettings = (callback: (settings: LandingPageSettings) => void) => {
    const docRef = doc(db, SETTINGS_COLLECTION, LANDING_PAGE_DOC);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data() as LandingPageSettings);
        } else {
            callback(DEFAULT_LANDING_PAGE_SETTINGS);
        }
    });
};

export const getLandingPageSettings = async (): Promise<LandingPageSettings> => {
    const docRef = doc(db, SETTINGS_COLLECTION, LANDING_PAGE_DOC);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as LandingPageSettings;
    }
    return DEFAULT_LANDING_PAGE_SETTINGS;
};

export const updateLandingPageSettings = async (settings: Partial<LandingPageSettings>, adminUid: string) => {
    const docRef = doc(db, SETTINGS_COLLECTION, LANDING_PAGE_DOC);
    await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: adminUid
    }, { merge: true });
};
