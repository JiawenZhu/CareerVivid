import { functions } from '../../../firebase';
import { httpsCallable } from 'firebase/functions';
import { StripeAccountStatus } from '../types';

export const createConnectAccount = async (userId: string, email: string) => {
    const createAccountFn = httpsCallable(functions, 'createConnectAccount');
    const result = await createAccountFn({
        redirectUrl: window.location.origin + '/commerce'
    });
    return (result.data as any).url;
};

export const getAccountStatus = async (): Promise<StripeAccountStatus> => {
    const getStatusFn = httpsCallable(functions, 'getAccountStatus');
    const result = await getStatusFn();
    return result.data as StripeAccountStatus;
};

export const createExpressDashboardLink = async () => {
    const createLinkFn = httpsCallable(functions, 'createLoginLink');
    const result = await createLinkFn();
    return (result.data as any).url;
};

export const createProductCheckoutSession = async (productId: string, merchantId: string) => {
    // Determine URLs based on current location (or product page)
    const successUrl = window.location.origin + `/p/${merchantId}/${productId}?success=true`;
    const cancelUrl = window.location.origin + `/p/${merchantId}/${productId}?cancel=true`;

    const createSessionFn = httpsCallable(functions, 'createProductCheckoutSession');
    const result = await createSessionFn({
        productId,
        merchantId,
        successUrl,
        cancelUrl
    });
    return (result.data as any); // { url: string, sessionId: string }
};
