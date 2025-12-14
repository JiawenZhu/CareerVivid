import {
    ref,
    uploadBytes,
    getDownloadURL
} from 'firebase/storage';
import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs,
    serverTimestamp,
    Timestamp,
    onSnapshot
} from 'firebase/firestore';
import { db, storage } from '../firebase';

export interface AnnotationObject {
    id: string;
    type: 'rect' | 'circle' | 'line' | 'arrow' | 'text' | 'path' | 'pin';
    // Fabric.js object properties
    left: number;
    top: number;
    width?: number;
    height?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeDashArray?: number[];
    // For paths (freehand)
    path?: string | any[];
    // For text
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    // For pins
    pinNumber?: number;
    commentId?: string; // Link to comment in Firestore
    // Store full Fabric.js serialized object as JSON string (to avoid Firestore nested array errors)
    fabricData?: string;
}

export interface Annotation {
    id?: string;
    imageUrl: string;            // Composite image for display
    objects?: AnnotationObject[]; // Structured objects for editing (optional for backward compatibility)
    author: string;
    createdAt: Timestamp | null;
}

const COLLECTION_NAME = 'annotations';

export const uploadAnnotation = async (
    ownerId: string,
    resumeId: string,
    imageBlob: Blob,
    authorName: string,
    objects?: AnnotationObject[] // Optional for backward compatibility
): Promise<string> => {
    // 1. Upload Image to Storage
    const timestamp = Date.now();
    const storagePath = `annotations/${resumeId}/${timestamp}.png`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, imageBlob);
    const downloadUrl = await getDownloadURL(storageRef);

    // 2. Save Metadata + Objects to Firestore
    const annotationsRef = collection(db, 'users', ownerId, 'resumes', resumeId, COLLECTION_NAME);
    await addDoc(annotationsRef, {
        imageUrl: downloadUrl,
        objects: objects || [], // Save structured objects
        author: authorName,
        createdAt: serverTimestamp()
    });

    return downloadUrl;
};

export const getLatestAnnotation = async (
    ownerId: string,
    resumeId: string
): Promise<Annotation | null> => {
    const annotationsRef = collection(db, 'users', ownerId, 'resumes', resumeId, COLLECTION_NAME);
    const q = query(annotationsRef, orderBy('createdAt', 'desc'), limit(1));

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
        id: doc.id,
        ...doc.data()
    } as Annotation;
};

export const subscribeToAnnotations = (
    ownerId: string,
    resumeId: string,
    callback: (annotation: Annotation | null) => void
) => {
    const annotationsRef = collection(db, 'users', ownerId, 'resumes', resumeId, COLLECTION_NAME);
    const q = query(annotationsRef, orderBy('createdAt', 'desc'), limit(1));

    return onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            callback(null);
            return;
        }

        const doc = snapshot.docs[0];
        callback({
            id: doc.id,
            ...doc.data()
        } as Annotation);
    });
};
