import { supabase, type MediaFile } from '../supabase';

export type { MediaFile };

// ============================================
// MEDIA FILES CRUD
// ============================================

/**
 * Get all media files
 */
export async function getAllMedia(folder?: string) {
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
export async function getMediaById(id: string) {
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
export async function uploadMedia(
    file: File,
    folder: string = 'general'
) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to Storage
    const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file);

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
export async function deleteMedia(id: string) {
    // Get the record first to find the storage path
    const media = await getMediaById(id);

    // Extract storage path from URL
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
export async function searchMedia(query: string) {
    const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .ilike('filename', `%${query}%`)
        .order('createdAt', { ascending: false });

    if (error) throw error;
    return data as MediaFile[];
}
