import { Timestamp } from 'firebase/firestore';

export interface Product {
    id: string;
    userId: string;
    portfolioId?: string;
    title: string;
    description: string;
    price: number; // In cents
    currency: string;
    type: 'digital' | 'physical';
    images: string[];
    fileUrl?: string; // For digital goods
    stock: number; // -1 for infinite
    stripeProductId?: string;
    stripePriceId?: string;
    isActive: boolean;
    slug: string;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

export interface StripeAccountStatus {
    isConnected: boolean;
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    email?: string;
}
