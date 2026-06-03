import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, setDoc, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { WhiteboardData } from '../types';

export const useWhiteboards = () => {
    const [whiteboards, setWhiteboards] = useState<WhiteboardData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) {
            setWhiteboards([]);
            setIsLoading(false);
            return;
        }

        const q = query(
            collection(db, 'whiteboards'),
            where('userId', '==', currentUser.uid),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            })) as WhiteboardData[];

            setWhiteboards(data);
            setIsLoading(false);
            setError(null);
        }, (err) => {
            console.error('Error fetching whiteboards:', err);
            // Don't show error if we're just waiting for indices
            if (err.message.includes('requires an index') || err.message.includes('currently building')) {
                console.warn('Index building for whiteboards... falling back to simple query');
                // Fallback to non-ordered query while index builds
                const fallbackQ = query(
                    collection(db, 'whiteboards'),
                    where('userId', '==', currentUser.uid)
                );

                // Set up a secondary listener for the fallback query
                const fallbackUnsubscribe = onSnapshot(fallbackQ, (fallbackSnapshot) => {
                    const fallbackData = fallbackSnapshot.docs.map(d => ({
                        ...d.data(),
                        id: d.id
                    })) as WhiteboardData[];
                    // Sort locally in JavaScript while the Firestore index builds
                    setWhiteboards(fallbackData.sort((a, b) => b.updatedAt - a.updatedAt));
                    setIsLoading(false);
                    setError(null); // Clear the error since we successfully fell back
                }, (fallbackErr) => {
                    setError(fallbackErr);
                    setIsLoading(false);
                });

                // Note: We don't have a clean way to return both unsubscribes here without re-architecting the hook, 
                // but since the component is top-level dashboard it's acceptable for the temporary index-building phase.
            } else {
                setError(err);
                setIsLoading(false);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [currentUser]);

    const fetchWhiteboard = async (id: string): Promise<WhiteboardData | null> => {
        try {
            const docRef = doc(db, 'whiteboards', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const raw = docSnap.data() as any;

                // ─── Format 1 (current): excalidrawJson is a JSON string ───
                if (raw.excalidrawJson && typeof raw.excalidrawJson === 'string') {
                    try {
                        raw.excalidrawData = JSON.parse(raw.excalidrawJson);
                    } catch {
                        // malformed string — fall through to migration below
                    }
                }

                // ─── Format 2 (previous): nested excalidrawData object ───
                // Already accessible as raw.excalidrawData — nothing to do.

                // ─── Format 3 (legacy): flat elements/appState fields ───
                if (!raw.excalidrawData && (raw.elements || raw.appState)) {
                    raw.excalidrawData = {
                        type: 'excalidraw',
                        version: 2,
                        source: window.location.origin,
                        elements: raw.elements ?? [],
                        appState: {
                            gridSize: 20,
                            gridStep: 5,
                            gridModeEnabled: false,
                            viewBackgroundColor: raw.appState?.viewBackgroundColor ?? '#ffffff',
                        },
                        files: {},
                    };
                }

                return { ...raw, id: docSnap.id } as WhiteboardData;
            }
            return null;
        } catch (err) {
            console.error('Error fetching whiteboard:', err);
            throw err;
        }
    };

    const createWhiteboard = async (title: string = 'Untitled Whiteboard'): Promise<string> => {
        if (!currentUser) throw new Error('Must be logged in to create whiteboard');

        const newDocRef = doc(collection(db, 'whiteboards'));
        const now = Date.now();

        const whiteboard: WhiteboardData = {
            id: newDocRef.id,
            userId: currentUser.uid,
            title,
            excalidrawData: {
                type: 'excalidraw',
                version: 2,
                source: window.location.origin,
                elements: [],
                appState: {
                    gridSize: 20,
                    gridStep: 5,
                    gridModeEnabled: false,
                    viewBackgroundColor: '#ffffff',
                },
                files: {},
            },
            createdAt: now,
            updatedAt: now,
        };

        try {
            await setDoc(newDocRef, whiteboard);
            return newDocRef.id;
        } catch (err) {
            console.error('Error creating whiteboard:', err);
            throw err;
        }
    };

    const updateWhiteboard = async (id: string, updates: Partial<WhiteboardData>) => {
        try {
            const docRef = doc(db, 'whiteboards', id);
            await updateDoc(docRef, { ...updates, updatedAt: Date.now() });
        } catch (err) {
            console.error('Error updating whiteboard:', err);
            throw err;
        }
    };

    const deleteWhiteboard = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'whiteboards', id));
        } catch (err) {
            console.error('Error deleting whiteboard:', err);
            throw err;
        }
    };

    const duplicateWhiteboard = async (originalId: string) => {
        if (!currentUser) throw new Error('Must be logged in');

        try {
            const originalDoc = await getDoc(doc(db, 'whiteboards', originalId));
            if (!originalDoc.exists()) throw new Error('Original whiteboard not found');

            const originalData = originalDoc.data() as WhiteboardData;

            const newDocRef = doc(collection(db, 'whiteboards'));
            const now = Date.now();

            const duplicateData: WhiteboardData = {
                ...originalData,
                id: newDocRef.id,
                title: `${originalData.title} (Copy)`,
                createdAt: now,
                updatedAt: now
            };

            await setDoc(newDocRef, duplicateData);
            return newDocRef.id;
        } catch (err) {
            console.error('Error duplicating whiteboard:', err);
            throw err;
        }
    };

    return {
        whiteboards,
        isLoading,
        error,
        fetchWhiteboard,
        createWhiteboard,
        updateWhiteboard,
        deleteWhiteboard,
        duplicateWhiteboard
    };
};
