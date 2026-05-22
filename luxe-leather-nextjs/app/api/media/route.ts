import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auditLog } from '@/lib/services/auditService';


export const dynamic = 'force-dynamic';

const BUCKET = 'product-images';

export async function GET() {
    // 1. Get files from Storage
    const { data: storageData, error: storageError } = await supabase.storage.from(BUCKET).list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
    });

    if (storageError) {
        console.error('[GET /api/media] Storage list error:', storageError);
    }

    const storageFiles = (storageData || []).filter(f => f.name !== '.emptyFolderPlaceholder').map(f => ({
        name: f.name,
        url: supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
        size: f.metadata?.size || 0,
        created_at: f.created_at,
        source: 'storage'
    }));

    // 2. Get files from Database
    const { data: dbData, error: dbError } = await supabase
        .from('media_files')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    if (dbError) {
        console.error('[GET /api/media] DB list error:', dbError);
    }

    const dbFiles = (dbData || []).map(f => ({
        name: f.filename,
        url: f.url,
        size: f.size || 0,
        created_at: f.created_at,
        source: 'database'
    }));

    // Combine and remove duplicates (by URL)
    const combined = [...storageFiles];
    const seenUrls = new Set(storageFiles.map(f => f.url));

    for (const f of dbFiles) {
        if (!seenUrls.has(f.url)) {
            combined.push(f);
            seenUrls.add(f.url);
        }
    }

    return NextResponse.json({ success: true, data: combined });
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
    await auditLog('media', filename, 'CREATE', { url: { from: null, to: url } });
    return NextResponse.json({ success: true, data: { name: filename, url } });
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    if (!name) return NextResponse.json({ success: false, message: 'File name required' }, { status: 400 });

    const { error } = await supabase.storage.from(BUCKET).remove([name]);
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    await auditLog('media', name, 'DELETE');
    return NextResponse.json({ success: true });
}
