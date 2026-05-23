import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auditLog } from '@/lib/services/auditService';


export const dynamic = 'force-dynamic';

const BUCKET = 'media';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const folderName = searchParams.get('bucket') || 'platform-images';

    // 1. Get files from Storage
    const { data: storageData, error: storageError } = await supabaseAdmin.storage.from(BUCKET).list(folderName, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
    });

    if (storageError) {
        console.error('[GET /api/media] Storage list error:', storageError);
    }

    const storageFiles = (storageData || []).filter(f => f.name !== '.emptyFolderPlaceholder').map(f => ({
        name: f.name,
        url: supabaseAdmin.storage.from(BUCKET).getPublicUrl(`${folderName}/${f.name}`).data.publicUrl,
        size: f.metadata?.size || 0,
        created_at: f.created_at,
        source: 'storage'
    }));

    // 2. Get files from Database
    const { data: dbData, error: dbError } = await supabaseAdmin
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

    // 3. Get in-use URLs for Garbage Collection
    const inUseUrls = new Set<string>();
    
    // Check products
    const { data: productsData } = await supabaseAdmin.from('products').select('image'); // note: we don't have additional_images array in our schema, just 'image'
    if (productsData) {
        productsData.forEach(p => {
            if (p.image) inUseUrls.add(p.image);
        });
    }

    // Check settings logo
    const { data: settingsData } = await supabaseAdmin.from('site_settings').select('value').eq('key', 'logo_url').maybeSingle();
    if (settingsData && settingsData.value) {
        inUseUrls.add(settingsData.value);
    }

    // Combine all in-use URLs into a single string for robust substring matching
    // This avoids issues with http/https mismatches, trailing slashes, or query parameters.
    const inUseString = Array.from(inUseUrls).join('|||');

    const finalData = combined.map(file => ({
        ...file,
        is_used: inUseString.includes(file.name)
    }));

    return NextResponse.json({ success: true, data: finalData });
}

export async function POST(request: Request) {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });

    const folderName = formData.get('bucket') as string || 'platform-images';
    const customName = formData.get('customName') as string;

    const ext = file.name.split('.').pop();
    let baseName = customName || file.name.replace(/\.[^/.]+$/, "");
    baseName = baseName.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    // Add a short timestamp as the "counter" to ensure uniqueness
    const shortTimestamp = Date.now().toString().slice(-6);
    const filename = `${baseName}-${shortTimestamp}.${ext}`;
    const filePath = `${folderName}/${filename}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
    });

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

    const url = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl;

    // Save to database for syncing
    await supabaseAdmin.from('media_files').insert({
        filename,
        url,
        size: file.size,
        content_type: file.type,
        folder: folderName
    });

    await auditLog('media', filePath, 'CREATE', { url: { from: null, to: url } });
    return NextResponse.json({ success: true, data: { name: filename, url } });
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    if (!name) return NextResponse.json({ success: false, message: 'File name required' }, { status: 400 });

    let folderName = searchParams.get('bucket');

    // If bucket isn't explicitly passed, look it up in the database so we delete from the correct storage folder
    if (!folderName) {
        const { data: fileRecord } = await supabaseAdmin.from('media_files').select('folder').eq('filename', name).maybeSingle();
        folderName = fileRecord?.folder || 'platform-images'; // fallback
    }

    const filePath = `${folderName}/${name}`;
    const { error: storageError } = await supabaseAdmin.storage.from(BUCKET).remove([filePath]);
    if (storageError) console.error('Storage delete error:', storageError);

    const { error: dbError } = await supabaseAdmin.from('media_files').delete().eq('filename', name);
    if (dbError) console.error('DB delete error:', dbError);

    if (storageError && dbError) {
        return NextResponse.json({ success: false, message: 'Failed to delete file from both storage and database' }, { status: 500 });
    }
    await auditLog('media', name, 'DELETE');
    return NextResponse.json({ success: true });
}
