import { supabase, type MediaFile } from '@/lib/supabase';

export type { MediaFile };

/**
 * Get all media files
 */
export async function getAll(folder?: string) {
    let query = supabase
        .from('media_files')
        .select('*')
        .order('createdAt', { ascending: false });

    if (folder) {
        query = query.eq('folder', folder);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as MediaFile[];
}

/**
 * Get a single media file by ID
 */
export async function getById(id: string) {
    const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as MediaFile;
}

/**
 * Upload media to Supabase Storage and create a record
 */
export async function upload(
    file: File,
    folder: string = 'general'
) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Convert File to ArrayBuffer for reliable Node.js upload
    const fileBuffer = await file.arrayBuffer();

    // Upload to Storage
    const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: false
        });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

    // Insert metadata record
    const { data, error } = await supabase
        .from('media_files')
        .insert([{
            filename: file.name,
            url: publicUrl,
            size: file.size,
            content_type: file.type,
            folder,
        }])
        .select()
        .single();

    if (error) throw error;
    return data as MediaFile;
}

/**
 * Delete media file (storage + record)
 */
export async function remove(id: string) {
    // Get the record first to find the storage path
    const media = await getById(id);

    if (!media) return { success: false, error: 'File not found' };

    // Extract storage path from URL
    // URL format: .../storage/v1/object/public/media/folder/filename
    // We need 'folder/filename'
    // This depends on how getPublicUrl formats it.
    // Usually ends with .../media/filename

    // Simplest way: if we stored the path, we'd use that. But we store URL.
    // Let's try to extract from URL based on standard Supabase URL structure
    const urlParts = media.url.split('/media/');
    if (urlParts.length > 1) {
        const storagePath = urlParts[1];
        await supabase.storage.from('media').remove([storagePath]);
    }

    // Delete the record
    const { error } = await supabase
        .from('media_files')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return { success: true };
}

/**
 * Search media by filename
 */
export async function search(query: string) {
    const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .ilike('filename', `%${query}%`)
        .order('createdAt', { ascending: false });

    if (error) throw error;
    return data as MediaFile[];
}
