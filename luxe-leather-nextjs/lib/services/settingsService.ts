import { supabase, type SiteSetting } from '@/lib/supabase';

export type { SiteSetting };

/**
 * Get all settings as a key-value map
 */
export async function getAll(): Promise<Record<string, string>> {
    const { data, error } = await supabase
        .from('Setting')
        .select('*');

    if (error) throw error;

    const map: Record<string, string> = {};
    (data as SiteSetting[]).forEach((s) => {
        map[s.key] = s.value ?? '';
    });
    return map;
}

/**
 * Update multiple settings at once
 */
export async function update(settings: Record<string, string>) {
    const upserts = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updatedAt: new Date().toISOString(),
    }));

    const { error } = await supabase
        .from('Setting')
        .upsert(upserts, { onConflict: 'key' });

    if (error) throw error;
    return { success: true };
}
