import { NextResponse } from 'next/server';
import sharp from 'sharp';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { auditLog, auditLogBulk } from '@/lib/services/auditService';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BUCKET = 'media';
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);

function safeFolderName(value: FormDataEntryValue | null): string {
    const raw = typeof value === 'string' && value.trim() ? value : 'platform-images';
    const normalized = raw.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '');
    return normalized || 'platform-images';
}

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
    const { data: productsData } = await supabaseAdmin.from('products').select('image, images');
    if (productsData) {
        productsData.forEach(p => {
            if (p.image) inUseUrls.add(p.image);
            if (p.images && Array.isArray(p.images)) {
                p.images.forEach((img: string) => {
                    if (img) inUseUrls.add(img);
                });
            }
        });
    }

    // Check categories
    const { data: categoriesData } = await supabaseAdmin.from('categories').select('image_url');
    if (categoriesData) {
        categoriesData.forEach(c => {
            if (c.image_url) inUseUrls.add(c.image_url);
        });
    }

    // Check all site settings that might contain image URLs
    const { data: settingsData } = await supabaseAdmin.from('site_settings').select('value');
    if (settingsData) {
        settingsData.forEach(s => {
            if (s.value && (s.value.includes('http://') || s.value.includes('https://') || s.value.includes('/media/'))) {
                inUseUrls.add(s.value);
            }
        });
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
    const files = formData.getAll('file') as File[];
    if (!files || files.length === 0) return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });

    const folderName = safeFolderName(formData.get('bucket'));
    
    let customNames: string[] = [];
    const customNameStr = formData.get('customName') as string;
    const customNamesStr = formData.get('customNames') as string;
    
    if (customNamesStr) {
        try { customNames = JSON.parse(customNamesStr); } catch (e) {}
    } else if (customNameStr) {
        customNames = [customNameStr];
    }

    const results = [];

    // Process files sequentially to avoid overwhelming memory with Sharp conversions
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!ALLOWED_IMAGE_TYPES.has(file.type)) continue;
        if (file.size > MAX_UPLOAD_BYTES) continue;

        const customName = customNames[i] || '';
        let baseName = customName || file.name.replace(/\.[^/.]+$/, "");
        baseName = baseName.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '');
        
        const shortId = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
        const filename = `${baseName || 'image'}-${shortId}.webp`;
        const filePath = `${folderName}/${filename}`;

        const arrayBuffer = await file.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);
        const buffer = await sharp(inputBuffer, { animated: false })
            .rotate()
            .resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 84, effort: 4 })
            .toBuffer();

        const { error } = await supabaseAdmin.storage.from(BUCKET).upload(filePath, buffer, {
            contentType: 'image/webp',
            upsert: false
        });

        if (error) {
            console.error('Storage upload error:', error);
            continue;
        }

        const url = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl;

        await supabaseAdmin.from('media_files').insert({
            filename,
            url,
            size: buffer.length,
            content_type: 'image/webp',
            folder: folderName
        });

        await auditLog('media', filePath, 'CREATE', { url: { from: null, to: url } });
        
        results.push({ name: filename, url, content_type: 'image/webp', size: buffer.length });
    }

    if (results.length === 0) {
        return NextResponse.json({ success: false, message: 'All files failed validation or upload.' }, { status: 400 });
    }

    return NextResponse.json({
        success: true,
        data: results.length === 1 ? results[0] : results,
        results: results,
        url: results.length === 1 ? results[0].url : undefined,
    });
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    let namesToDelete: string[] = [];

    if (name) {
        namesToDelete = [name];
    } else {
        try {
            const body = await request.json();
            if (body.names && Array.isArray(body.names)) {
                namesToDelete = body.names;
            }
        } catch {}
    }

    if (namesToDelete.length === 0) return NextResponse.json({ success: false, message: 'File name(s) required' }, { status: 400 });

    let defaultFolderName = searchParams.get('bucket');

    const { data: fileRecords } = await supabaseAdmin.from('media_files')
        .select('filename, folder')
        .in('filename', namesToDelete);

    const filePathsToDelete: string[] = [];
    const validNames: string[] = [];

    if (fileRecords) {
        fileRecords.forEach(record => {
            const folder = record.folder || defaultFolderName || 'platform-images';
            filePathsToDelete.push(`${folder}/${record.filename}`);
            validNames.push(record.filename);
        });
    }

    namesToDelete.forEach(n => {
        if (!validNames.includes(n)) {
            const folder = defaultFolderName || 'platform-images';
            filePathsToDelete.push(`${folder}/${n}`);
            validNames.push(n);
        }
    });

    const { error: storageError } = await supabaseAdmin.storage.from(BUCKET).remove(filePathsToDelete);
    if (storageError) console.error('Storage delete error:', storageError);

    const { error: dbError } = await supabaseAdmin.from('media_files').delete().in('filename', validNames);
    if (dbError) console.error('DB delete error:', dbError);

    if (storageError && dbError) {
        return NextResponse.json({ success: false, message: 'Failed to delete files from both storage and database' }, { status: 500 });
    }
    
    await auditLogBulk('media', validNames, 'DELETE');

    return NextResponse.json({ success: true, count: validNames.length });
}
