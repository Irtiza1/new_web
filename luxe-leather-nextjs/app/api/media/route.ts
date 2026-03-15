import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';


export const dynamic = 'force-dynamic';

const BUCKET = 'product-images';

export async function GET() {
    const { data, error } = await supabase.storage.from(BUCKET).list('', {
        limit: 200,
        sortBy: { column: 'created_at', order: 'desc' }
    });

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

    const files = (data || []).filter(f => f.name !== '.emptyFolderPlaceholder').map(f => ({
        name: f.name,
        url: supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
        size: f.metadata?.size || 0,
        created_at: f.created_at
    }));

    return NextResponse.json({ success: true, data: files });
}

export async function POST(request: Request) {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });

    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(filename, file, {
        contentType: file.type,
        upsert: false
    });

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

    const url = supabase.storage.from(BUCKET).getPublicUrl(filename).data.publicUrl;
    return NextResponse.json({ success: true, data: { name: filename, url } });
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    if (!name) return NextResponse.json({ success: false, message: 'File name required' }, { status: 400 });

    const { error } = await supabase.storage.from(BUCKET).remove([name]);
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
