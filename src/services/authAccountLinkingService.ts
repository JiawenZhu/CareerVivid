import { signInWithCustomToken, User } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../firebase';

type ResolveSignedInWorkspaceResponse = {
    canonicalUid: string;
    switched: boolean;
    customToken?: string;
    mergedSourceUids?: string[];
    copiedSubcollectionDocs?: number;
    transferredRootDocs?: number;
    skipped?: string;
};

export const resolveSignedInWorkspace = async (): Promise<User> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('Sign in before resolving your workspace.');
    }

    let data: ResolveSignedInWorkspaceResponse;
    try {
        const resolveWorkspace = httpsCallable<unknown, ResolveSignedInWorkspaceResponse>(
            functions,
            'resolveSignedInWorkspace'
        );
        const result = await resolveWorkspace({});
        data = result.data;
    } catch (error) {
        console.warn('[CareerVivid] Workspace account resolver failed; continuing with current auth user.', error);
        return currentUser;
    }

    if (data.customToken) {
        try {
            const credential = await signInWithCustomToken(auth, data.customToken);
            return credential.user;
        } catch (error) {
            console.warn('[CareerVivid] Workspace account switch failed; continuing with current auth user.', error);
            return currentUser;
        }
    }

    return auth.currentUser || currentUser;
};
