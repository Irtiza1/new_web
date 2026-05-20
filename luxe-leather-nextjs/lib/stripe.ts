import Stripe from 'stripe';

/**
 * Server-side Stripe client.
 * Uses STRIPE_SECRET_KEY from environment variables.
 * Returns null if the key is not configured (graceful degradation).
 */
export const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

/**
 * Check if Stripe is properly configured with API keys.
 * API routes should call this before attempting any Stripe operations.
 */
export const isStripeConfigured = (): boolean => {
    return Boolean(process.env.STRIPE_SECRET_KEY);
};

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('[Stripe] STRIPE_SECRET_KEY is not set. Payment processing disabled.');
}