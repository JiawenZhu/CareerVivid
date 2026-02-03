import { db } from '../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    doc,
    getDoc,
    addDoc,
    serverTimestamp,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Drop, Product, Order, OrderStatus } from '../types';

export const stitchService = {
    /**
     * Fetch upcoming drops available for a specific zone.
     * @param zoneId The user's assigned zone ID (e.g. 'urbana')
     */
    getUpcomingDrops: async (zoneId: string): Promise<Drop[]> => {
        try {
            const dropsRef = collection(db, 'drops');
            // Query: Status is NOT 'delivering' (or specific logic) + contains zone
            // Note: Array-contains is useful here.
            const q = query(
                dropsRef,
                where('zones', 'array-contains', zoneId),
                where('status', 'in', ['open', 'locked']),
                orderBy('scheduled_date', 'asc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Drop));
        } catch (error) {
            console.error("Error fetching upcoming drops:", error);
            return [];
        }
    },

    /**
     * Get a single drop by ID.
     */
    getDropById: async (dropId: string): Promise<Drop | null> => {
        try {
            const docRef = doc(db, 'drops', dropId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Drop;
            }
            return null;
        } catch (error) {
            console.error("Error fetching drop:", error);
            return null;
        }
    },

    /**
     * Get all products associated with a drop (via subcollection or manual link).
     * For now, assuming products are global catalog items linked via 'drop_inventory'.
     */
    getDropProducts: async (dropId: string): Promise<Product[]> => {
        // Implementation note: This might need to join 'drop_inventory' with 'products'
        // For simple start, let's just fetch all products (demo mode) or specific query
        // Real implementation: Fetch drop_inventory subcollection -> get product IDs -> fetch products
        try {
            // Demo: Fetching all products for now to populate the gallery
            const productsRef = collection(db, 'products');
            const snapshot = await getDocs(productsRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        } catch (error) {
            console.error("Error fetching drop products:", error);
            return [];
        }
    },

    /**
     * Create a new order securely via Cloud Function.
     */
    createOrder: async (orderData: { drop_id: string; items: { productId: string; quantity: number }[] }) => {
        try {
            const functions = getFunctions();
            // Point to the region where we deployed 'stitchCommerce-createOrder' (mapped via export)
            // Note: In index.ts we did `export * from "./stitchCommerce"`, so the function name is `createOrder`.
            // Check if region needs to be specific.
            const createOrderFn = httpsCallable(functions, 'createOrder');

            const result = await createOrderFn({
                dropId: orderData.drop_id,
                items: orderData.items
            });

            const data = result.data as { success: true; orderId: string; total: number };
            return data.orderId;
        } catch (error) {
            console.error("Error creating order (Cloud Function):", error);
            throw error;
        }
    },

    /**
     * Real-time listener for orders in a specific drop (for Assembly Line).
     */
    subscribeToDropOrders: (dropId: string, callback: (orders: Order[]) => void) => {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('drop_id', '==', dropId));

        return onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            callback(orders);
        });
    }
};
