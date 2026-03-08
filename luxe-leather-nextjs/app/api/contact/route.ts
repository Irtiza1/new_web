import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { apiHandler } from '@/lib/middleware/apiHandler';

const contactSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    inquiry_type: z.string().default('Other'),
    message: z.string().min(1, 'Message is required'),
});

/**
 * @route   POST /api/contact
 * @desc    Submit a contact form message
 * @access  Public
 */
export const POST = apiHandler(async (req: NextRequest) => {
    const body = await req.json();
    const data = contactSchema.parse(body);

    const now = new Date().toISOString();

    const { error } = await supabase
        .from('contact_messages')
        .insert([{
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            inquiry_type: data.inquiry_type,
            message: data.message,
            status: 'new',
            created_at: now,
        }]);

    if (error) {
        console.error('Contact form submission error:', JSON.stringify(error));
        // Table not set up yet — return 503 with guidance
        if (error.code === 'PGRST205') {
            return NextResponse.json(
                { success: false, error: 'Contact form setup required. Run supabase/migrations/007_create_contact_messages_table.sql in your Supabase SQL Editor.' },
                { status: 503 }
            );
        }
        throw error;
    }

    return NextResponse.json({
        success: true,
        message: 'Message sent successfully! We will get back to you within 24 hours.',
    });
});

/**
 * @route   GET /api/contact
 * @desc    Get all contact messages (admin use)
 * @access  Private
 */
export const GET = apiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
        .from('contact_messages')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
        success: true,
        data: data || [],
        pagination: {
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        },
    });
});
