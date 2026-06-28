import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import * as orderService from "@/lib/services/orderService";
import sharp from "sharp";
import { sendAdminOrderNotificationEmail, sendCustomerOrderConfirmation } from "@/lib/utils/email";

export const dynamic = 'force-dynamic';

const customerSchema = z.object({
    name: z.string().min(1, "Customer name is required"),
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    notes: z.string().optional(),
    dummyPayment: z.boolean().optional(),
});

const itemsSchema = z.array(z.object({
    id: z.union([z.string(), z.number()]),
    name: z.string(),
    price: z.number(),
    quantity: z.number().int().min(1),
    image: z.string().optional(),
    variant: z.string().optional(),
})).min(1, "At least one item is required");

export async function POST(req: NextRequest){
    try {
        const formData = await req.formData();
        
        const customerStr = formData.get('customer') as string;
        const itemsStr = formData.get('items') as string;
        const totalStr = formData.get('total') as string;
        const paymentSlip = formData.get('paymentSlip') as File | null;

        if (!customerStr || !itemsStr || !totalStr) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const customer = customerSchema.parse(JSON.parse(customerStr));
        const items = itemsSchema.parse(JSON.parse(itemsStr));
        const total = parseFloat(totalStr);

        if (!customer.dummyPayment && !paymentSlip) {
            return NextResponse.json({ success: false, message: 'Payment slip is required' }, { status: 400 });
        }

        // Step 0: Pre-flight checks (Stock validation removed)
        for (const item of items) {
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
        const { data: existing} = await supabase.from('customers').select('id').eq('email', customer.email).limit(1);

        if(existing && existing.length >0 ){
            customerId = existing[0].id;
        }
        else{
            const {data : created, error: createError} = await supabase
            .from('customers')
            .insert([{
                id : crypto.randomUUID(),
                name: customer.name,
                email: customer.email,
                phone: customer.phone || null,
                address: customer.address || null,
                city: customer.city || null,
                country: customer.country || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }])
            .select('id')
            .single();

            if (createError || !created){
                console.error('Customer creation error:', createError);
                return NextResponse.json({
                    success: false,
                    message: 'Failed to create customer',
                },{status: 500, statusText: "Failed to create customer"});
            }

            customerId = created.id;
        }
        
        // Step 2: Create pending order in database
        const isDummy = !!customer.dummyPayment;
        const order = await orderService.create({
            customerId: customerId,
            status: isDummy ? 'PROCESSING' : 'PENDING',
            total: total,
            subtotal: total,
            shipping: 0,
            notes: customer.notes || null,
            payment_status: isDummy ? 'paid' : 'pending_verification',
            items: items.map((item) => {
                let size: string | undefined = undefined;
                let color: string | undefined = undefined;
                let variant: string | undefined = item.variant || undefined;
                
                if (variant) {
                    if (variant.startsWith('Size: ')) {
                        const parts = variant.split(', Color: ');
                        size = parts[0].replace('Size: ', '');
                        color = parts[1] || undefined;
                        variant = undefined; // Standard order, no bespoke variant string
                    } else if (variant.startsWith('Custom Size: ')) {
                        const parts = variant.split(', Color: ');
                        variant = parts[0];
                        color = parts[1] || undefined;
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

        if (isDummy) {
            return NextResponse.json({
                success: true,
                dummyMode: true,
                orderId: order.id,
                message: "Test order placed successfully",
            });
        }

        // Step 3: Process and upload payment slip
        let paymentSlipUrl = '';
        if (paymentSlip) {
            const arrayBuffer = await paymentSlip.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            const webpBuffer = await sharp(buffer)
                .webp({ quality: 80 })
                .toBuffer();

            const filename = `${customer.email}_${order.order_number}.webp`;

            const { error: uploadError } = await supabase.storage
                .from('payment-receipts')
                .upload(filename, webpBuffer, {
                    contentType: 'image/webp',
                    upsert: false,
                });

            if (uploadError) {
                console.error("Storage upload error:", uploadError);
                throw new Error("Failed to upload payment slip");
            }

            const { data: publicUrlData } = supabase.storage
                .from('payment-receipts')
                .getPublicUrl(filename);
                
            paymentSlipUrl = publicUrlData.publicUrl;
        }

        // Step 4: Update order with payment slip URL
        await supabase
            .from('orders')
            .update({ 
                payment_slip_url: paymentSlipUrl,
                payment_status: 'pending_verification'
            })
            .eq('id', order.id);

        // Step 5: Send email notifications
        const emailDetails = {
            orderId: order.id,
            customerName: customer.name,
            customerEmail: customer.email,
            total: total,
            paymentSlipUrl: paymentSlipUrl,
        };
        
        await Promise.all([
            sendAdminOrderNotificationEmail(emailDetails),
            sendCustomerOrderConfirmation(emailDetails)
        ]);

        return NextResponse.json({
            success: true,
            orderId: order.id,
        });
    } catch (error) {
        console.error('[POST /api/checkout/process] Checkout error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                message: 'Invalid request data',
                errors: error.issues,
            }, {status: 400});
        }

        const errMessage = error instanceof Error ? error.message : 'Failed to process checkout';
        return NextResponse.json({
            success: false,
            message: errMessage,
        }, {status: 500});
    }
}