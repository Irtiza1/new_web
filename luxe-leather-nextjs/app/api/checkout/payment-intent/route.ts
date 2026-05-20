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
});

export async function POST(req: NextRequest){
    if (!isStripeConfigured() || !stripe){
        return NextResponse.json({
            success: false,
            message: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.',
        }, {status: 503, statusText: "Stripe is not configured"});
    }

    try{
        const body = await req.json();
        const data = paymentIntentSchema.parse(body);

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
            const order = await orderService.create({
                customer_id: customerId,
                status: 'PENDING',
                total: data.total,
                subtotal: data.total,
                shipping: 0,
                notes: data.customer.notes || null,
                payment_status: 'unpaid',
                items: data.items.map((item) => ({
                    product_id: String(item.id),
                    quantity: item.quantity,
                    price: item.price,
                    name: item.name,
                    variant: item.variant,
                })),
            });

            // Step 3: Create Stripe Payment Intent
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(data.total * 100), // Convert to cents
                currency: 'usd',
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
    }
    catch (error: any) {
        console.error('Payment Intent creation error:', error);

        if(error.name === 'ZodError'){
            return NextResponse.json({
                success: false,
                message: 'Invalid request data',
                errors: error.issues,
            }, {status: 400});
        }

        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to create payment intent',
        }, {status: 500});
    }
}