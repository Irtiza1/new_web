import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { apiHandler } from '@/lib/middleware/apiHandler';
import * as settingsService from '@/lib/services/settingsService';

export const dynamic = 'force-dynamic';

const contactSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    inquiry_type: z.string().default('Other'),
    message: z.string().min(1, 'Message is required'),
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: send email via Resend — silently skips if RESEND_API_KEY is not set
// ─────────────────────────────────────────────────────────────────────────────
async function sendEmail(opts: { to: string; subject: string; html: string; from?: string }) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return;
    try {
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: opts.from || 'Luxe Leather Gear <noreply@luxeleathergear.com>',
                to: [opts.to],
                subject: opts.subject,
                html: opts.html,
            }),
        });
    } catch (err) {
        console.warn('[sendEmail] Resend call failed:', err);
    }
}

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

    // ── Fire-and-forget: send confirmation email to user + alert to support ──
    (async () => {
        try {
            const settings = await settingsService.getAll();
            const supportEmail = settings.support_email || 'support@luxeleather.co';
            const siteTitle   = settings.site_title   || 'Luxe Leather Gear';

            // 1. Confirmation to the user
            await sendEmail({
                to: data.email,
                from: `${siteTitle} <noreply@luxeleather.co>`,
                subject: `We received your message — ${siteTitle}`,
                html: `
<div style="font-family:Inter,Helvetica,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:#d41132;padding:24px 32px">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;letter-spacing:-0.5px">${siteTitle}</h1>
  </div>
  <div style="padding:32px">
    <h2 style="margin:0 0 8px;font-size:18px;color:#0d141b">Hi ${data.name} 👋</h2>
    <p style="color:#4b5563;margin:0 0 20px;line-height:1.7">Thanks for reaching out! We've received your message and our team will get back to you within <strong>24 hours</strong>.</p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#9ca3af">Your Message</p>
      <p style="margin:0;color:#0d141b;line-height:1.7">${data.message.replace(/\n/g, '<br>')}</p>
    </div>
    <p style="color:#6b7280;font-size:13px;margin:0">Need urgent help? Contact us at <a href="mailto:${supportEmail}" style="color:#d41132">${supportEmail}</a></p>
  </div>
  <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center">
    <p style="margin:0;font-size:12px;color:#9ca3af">© ${new Date().getFullYear()} ${siteTitle}. All rights reserved.</p>
  </div>
</div>`,
            });

            // 2. Internal notification to support team
            await sendEmail({
                to: supportEmail,
                subject: `[New Contact] ${data.inquiry_type} from ${data.name}`,
                html: `
<div style="font-family:Inter,Helvetica,sans-serif;max-width:520px;margin:0 auto">
  <h2 style="color:#d41132;margin-bottom:16px">New Contact Form Submission</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:8px 0;font-weight:700;color:#374151;width:110px">Name</td><td style="padding:8px 0;color:#0d141b">${data.name}</td></tr>
    <tr><td style="padding:8px 0;font-weight:700;color:#374151">Email</td><td style="padding:8px 0"><a href="mailto:${data.email}" style="color:#d41132">${data.email}</a></td></tr>
    ${data.phone ? `<tr><td style="padding:8px 0;font-weight:700;color:#374151">Phone</td><td style="padding:8px 0;color:#0d141b">${data.phone}</td></tr>` : ''}
    <tr><td style="padding:8px 0;font-weight:700;color:#374151">Type</td><td style="padding:8px 0;color:#0d141b">${data.inquiry_type}</td></tr>
    <tr><td style="padding:8px 0;font-weight:700;color:#374151;vertical-align:top">Message</td><td style="padding:8px 0;color:#0d141b">${data.message.replace(/\n/g, '<br>')}</td></tr>
  </table>
</div>`,
            });
        } catch (emailErr) {
            console.warn('[contact POST] Email send failed (non-critical):', emailErr);
        }
    })();

    const { data: insertedData } = await supabase
        .from('contact_messages')
        .select('*')
        .eq('email', data.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    return NextResponse.json({
        success: true,
        message: 'Message sent successfully! We will get back to you within 24 hours.',
        data: insertedData,
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

/**
 * @route   PUT /api/contact
 * @desc    Update a contact message (e.g. status)
 */
export const PUT = apiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Message ID required' }, { status: 400 });

    const body = await req.json();
    const { data, error } = await supabase.from('contact_messages').update(body).eq('id', id).select().single();
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
});

/**
 * @route   DELETE /api/contact
 * @desc    Delete a contact message
 */
export const DELETE = apiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Message ID required' }, { status: 400 });

    const { error } = await supabase.from('contact_messages').delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: 'Message deleted successfully' });
});
