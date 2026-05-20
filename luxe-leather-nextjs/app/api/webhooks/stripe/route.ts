import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    if (!isStripeConfigured() || !stripe) {
        return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('[Stripe webhook] STRIPE_WEBHOOK_SECRET is not set');
        return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
    }

    // Get raw body — must use req.text() NOT req.json()
    // Stripe signs the raw bytes, so we need the exact original content
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    // Verify this request actually came from Stripe (not a hacker)
    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
        console.error('[Stripe webhook] Signature verification failed:', err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    console.log(`[Stripe webhook] Received event: ${event.type}`);

    // Handle different event types
    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const orderId = paymentIntent.metadata?.order_id;

                if (!orderId) {
                    console.warn('[Stripe webhook] No order_id in metadata');
                    break;
                }

                const { error } = await supabase
                    .from('orders')
                    .update({
                        status: 'PROCESSING',
                        payment_status: 'paid',
                        updatedAt: new Date().toISOString(),
                    })
                    .eq('id', orderId);

                if (error) {
                    console.error(`[Stripe webhook] Failed to update order ${orderId}:`, error);
                } else {
                    console.log(`[Stripe webhook] Order ${orderId} marked as PAID`);
                }
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const orderId = paymentIntent.metadata?.order_id;

                if (orderId) {
                    await supabase
                        .from('orders')
                        .update({
                            payment_status: 'failed',
                            updatedAt: new Date().toISOString(),
                        })
                        .eq('id', orderId);

                    console.log(`[Stripe webhook] Order ${orderId} payment failed`);
                }
                break;
            }

            default:
                console.log(`[Stripe webhook] Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error('[Stripe webhook] Handler error:', err);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}
