import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import * as orderService from "@/lib/services/orderService";

export const dynamic = 'force-dynamic';

const paymentIntentSchema = z.object({
    customer: z.object({
        name: z.string().min(1, "Customer name is required"),
        email: z.string().email(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        notes: z.string().optional(),
    }),
    items: z.array(z.object({
        id: z.union([z.string(), z.number()]),
        name: z.string(),
        price: z.number(),
        quantity: z.number().int().min(1),
        image: z.string().optional(),
        variant: z.string().optional(),
    })).min(1, "At least one item is required"),
    total: z.number().min(0.5),
    dummyPayment: z.boolean().optional(),
});

export async function POST(req: NextRequest){
    try {
        const body = await req.json();
        const data = paymentIntentSchema.parse(body);

        if (!data.dummyPayment && (!isStripeConfigured() || !stripe)) {
            return NextResponse.json({
                success: false,
                message: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.',
            }, { status: 503, statusText: "Stripe is not configured" });
        }

        // Step 0: Pre-flight checks (Stock validation removed)
        for (const item of data.items) {
            const productId = String(item.id);
            const { data: productData, error: productError } = await supabase
                .from('products')
                .select('name')
                .eq('id', productId)
                .single();
                
            if (productError || !productData) {
                return NextResponse.json({
                    success: false,
                    message: `Product ${item.name} not found.`,
                }, { status: 400 });
            }
        }

        // Step 1: Find or create customer
        let customerId: string ;
        const { data: existing} = await supabase.from('customers').select('id').eq('email', data.customer.email).limit(1);

        if(existing && existing.length >0 ){
            customerId = existing[0].id;
        }
        else{
            const {data : created, error: createError} = await supabase
            .from('customers')
            .insert([{
                id : crypto.randomUUID(),
                name: data.customer.name,
                email: data.customer.email,
                phone: data.customer.phone || null,
                address: data.customer.address || null,
                city: data.customer.city || null,
                country: data.customer.country || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }])
            .select('id')
            .single();

            if (createError || !created){
                console.error('Cusotmer creation error:', createError);
                return NextResponse.json({
                    success: false,
                    message: 'Failed to create customer',
                },{status: 500, statusText: "Failed to create customer"});
            }

            customerId = created.id;
        }
            //step2: create pending order in database
            const isDummy = !!data.dummyPayment;
            const order = await orderService.create({
                customerId: customerId,
                status: isDummy ? 'PROCESSING' : 'PENDING',
                total: data.total,
                subtotal: data.total,
                shipping: 0,
                notes: data.customer.notes || null,
                payment_status: isDummy ? 'paid' : 'unpaid',
                items: data.items.map((item) => {
                    let size = null;
                    let color = null;
                    let variant = item.variant || null;
                    
                    if (variant) {
                        if (variant.startsWith('Size: ')) {
                            const parts = variant.split(', Color: ');
                            size = parts[0].replace('Size: ', '');
                            color = parts[1] || null;
                            variant = null; // Standard order, no bespoke variant string
                        } else if (variant.startsWith('Custom Size: ')) {
                            const parts = variant.split(', Color: ');
                            variant = parts[0];
                            color = parts[1] || null;
                        }
                    }

                    return {
                        product_id: String(item.id),
                        quantity: item.quantity,
                        price: item.price,
                        name: item.name,
                        variant,
                        color,
                        size,
                    };
                }),
            });

            // Step 2.5: Stock Deduction removed

            if (isDummy) {
                return NextResponse.json({
                    success: true,
                    dummyMode: true,
                    orderId: order.id,
                    message: "Test order placed successfully",
                });
            }

            // Step 3: Create Stripe Payment Intent
            if (!stripe) {
                throw new Error("Stripe is not configured");
            }
            
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(data.total * 100), // Convert to cents
                currency: process.env.NEXT_PUBLIC_CURRENCY || 'usd',
                automatic_payment_methods: {enabled: true},
                receipt_email: data.customer.email,
                metadata: {
                    order_id: order.id,
                    customer_id: customerId,
                    customer_email: data.customer.email,
                },
            });

            //step 4: Update order with payment intent id
            await supabase
            .from('orders')
            .update({ stripe_payment_intent_id: paymentIntent.id })
            .eq('id', order.id);

            return NextResponse.json({
                success: true,
                clientSecret: paymentIntent.client_secret,
                orderId: order.id,
                paymentIntentId: paymentIntent.id,
            });
    } catch (error) {
        console.error('[POST /api/checkout/payment-intent] Payment Intent creation error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                message: 'Invalid request data',
                errors: error.issues,
            }, {status: 400});
        }

        const errMessage = error instanceof Error ? error.message : 'Failed to create payment intent';
        return NextResponse.json({
            success: false,
            message: errMessage,
        }, {status: 500});
    }
}