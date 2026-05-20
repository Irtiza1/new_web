import { loadStripe, Stripe } from '@stripe/stripe-js';

/**
 * Client-side Stripe loader.
 * Loads Stripe.js once and caches the promise.
 * Used by React components that need <Elements> provider.
 */
let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = (): Promise<Stripe | null> => {
    if (!stripePromise) {
        const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!key) {
            console.warn('[Stripe] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set.');
            return Promise.resolve(null);
        }
        stripePromise = loadStripe(key);
    }
    return stripePromise;
};