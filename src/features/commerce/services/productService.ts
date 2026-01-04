import { db } from '../../../firebase';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Product } from '../types';

export const getMerchantProducts = async (userId: string): Promise<Product[]> => {
    try {
        const q = query(
            collection(db, 'users', userId, 'products'),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
};

export const getProductById = async (userId: string, productId: string): Promise<Product | null> => {
    try {
        const docRef = doc(db, 'users', userId, 'products', productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Product;
        }
        return null;
    } catch (error) {
        console.error("Error fetching product:", error);
        return null;
    }
};

export const createProduct = async (userId: string, data: Partial<Product>): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, 'users', userId, 'products'), {
            ...data,
            createdAt: serverTimestamp(),
            isActive: true, // Default to active
            stock: data.type === 'digital' ? -1 : (data.stock || 0)
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating product:", error);
        throw error;
    }
};

export const updateProduct = async (userId: string, productId: string, data: Partial<Product>): Promise<void> => {
    try {
        const docRef = doc(db, 'users', userId, 'products', productId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating product:", error);
        throw error;
    }
};

export const deleteProduct = async (userId: string, productId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'users', userId, 'products', productId));
    } catch (error) {
        console.error("Error deleting product:", error);
        throw error;
    }
};
