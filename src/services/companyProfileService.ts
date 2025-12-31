import { db } from '../firebase';
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs,
    serverTimestamp
} from 'firebase/firestore';
import { CompanyProfile, EmbedWidgetTheme, EmbedFontFamily } from '../types';

const COLLECTION_NAME = 'companyProfiles';

/**
 * Generate a URL-friendly slug from company name
 */
export const generateSlug = (companyName: string): string => {
    return companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
};

/**
 * Check if a slug is already taken
 */
export const isSlugAvailable = async (slug: string, excludeId?: string): Promise<boolean> => {
    const q = query(collection(db, COLLECTION_NAME), where('slug', '==', slug));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return true;
    if (excludeId && snapshot.docs.length === 1 && snapshot.docs[0].id === excludeId) return true;

    return false;
};

/**
 * Get company profile by hrUserId
 */
export const getCompanyProfileByUserId = async (hrUserId: string): Promise<CompanyProfile | null> => {
    const q = query(collection(db, COLLECTION_NAME), where('hrUserId', '==', hrUserId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as CompanyProfile;
};

/**
 * Get company profile by slug (for public pages)
 */
export const getCompanyProfileBySlug = async (slug: string): Promise<CompanyProfile | null> => {
    const q = query(collection(db, COLLECTION_NAME), where('slug', '==', slug));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as CompanyProfile;
};

/**
 * Create or update company profile
 */
export const saveCompanyProfile = async (
    hrUserId: string,
    data: Partial<Omit<CompanyProfile, 'id' | 'hrUserId' | 'createdAt' | 'updatedAt'>>
): Promise<CompanyProfile> => {
    const existing = await getCompanyProfileByUserId(hrUserId);

    if (existing) {
        // Update existing
        const docRef = doc(db, COLLECTION_NAME, existing.id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
        return { ...existing, ...data, updatedAt: new Date() };
    } else {
        // Create new
        const slug = data.slug || generateSlug(data.companyName || 'company');
        const docRef = doc(collection(db, COLLECTION_NAME));

        const newProfile: Omit<CompanyProfile, 'id'> = {
            hrUserId,
            slug,
            companyName: data.companyName || '',
            logo: data.logo,
            primaryColor: data.primaryColor || '#7c3aed',
            secondaryColor: data.secondaryColor,
            fontFamily: data.fontFamily || 'inter',
            theme: data.theme || 'minimalist',
            customCss: data.customCss,
            showSalary: data.showSalary ?? true,
            showBenefits: data.showBenefits ?? true,
            heroImage: data.heroImage,
            tagline: data.tagline,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await setDoc(docRef, newProfile);
        return { id: docRef.id, ...newProfile } as CompanyProfile;
    }
};

/**
 * Get default theme settings
 */
export const getDefaultThemeSettings = (theme: EmbedWidgetTheme) => {
    const themes = {
        minimalist: {
            primaryColor: '#1f2937',
            secondaryColor: '#6b7280',
            fontFamily: 'system' as EmbedFontFamily,
            borderRadius: '8px',
        },
        executive: {
            primaryColor: '#1a365d',
            secondaryColor: '#c9a227',
            fontFamily: 'roboto' as EmbedFontFamily,
            borderRadius: '4px',
        },
        creative: {
            primaryColor: '#7c3aed',
            secondaryColor: '#ec4899',
            fontFamily: 'outfit' as EmbedFontFamily,
            borderRadius: '16px',
        },
    };

    return themes[theme] || themes.minimalist;
};
