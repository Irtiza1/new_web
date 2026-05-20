import { supabase, type SiteSetting } from '@/lib/supabase';

export type { SiteSetting };

/**
 * Get all settings as a key-value map
 */
export async function getAll(): Promise<Record<string, string>> {
    const { data, error } = await supabase
        .from('site_settings')
        .select('*');

    // If the table is empty or errors, return empty map gracefully
    if (error) {
        console.warn('Settings fetch warning:', error.message);
        return {};
    }

    const map: Record<string, string> = {};
    (data as SiteSetting[]).forEach((s) => {
        map[s.key] = s.value ?? '';
    });
    return map;
}

/**
 * Update multiple settings at once using upsert.
 * Generates a deterministic ID from the key so upsert works correctly.
 */
export async function update(settings: Record<string, string>) {
    // Build upserts — for each key we fetch existing id first, or generate one
    const { data: existing } = await supabase
        .from('site_settings')
        .select('id, key');

    const existingMap: Record<string, string> = {};
    (existing || []).forEach((s: { id: string; key: string }) => {
        existingMap[s.key] = s.id;
    });

    const upserts = Object.entries(settings).map(([key, value]) => {
        // Reuse existing ID if available, otherwise generate a cuid-style one
        const id = existingMap[key] || crypto.randomUUID();
        return {
            id,
            key,
            value,
            updatedAt: new Date().toISOString(),
        };
    });

    const { error } = await supabase
        .from('site_settings')
        .upsert(upserts, { onConflict: 'key' });

    if (error) {
        console.error('Settings upsert error:', JSON.stringify(error));
        throw error;
    }
    return { success: true };
}
