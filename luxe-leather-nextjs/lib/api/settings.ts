import { supabase, type SiteSetting } from '../supabase';

export type { SiteSetting };

// ============================================
// SITE SETTINGS CRUD
// ============================================

/**
 * Get all settings as a key-value map
 */
export async function getSettings(): Promise<Record<string, string>> {
    const { data, error } = await supabase
        .from('site_settings')
        .select('*');

    if (error) throw error;

    const map: Record<string, string> = {};
    (data as SiteSetting[]).forEach((s) => {
        map[s.key] = s.value ?? '';
    });
    return map;
}

/**
 * Get a single setting value by key
 */
export async function getSetting(key: string): Promise<string> {
    const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .single();

    if (error) throw error;
    return data?.value ?? '';
}

/**
 * Upsert a setting (insert or update)
 */
export async function updateSetting(key: string, value: string) {
    const { data, error } = await supabase
        .from('site_settings')
        .upsert({ key, value, updatedAt: new Date().toISOString() }, { onConflict: 'key' })
        .select()
        .single();

    if (error) throw error;
    return data as SiteSetting;
}

/**
 * Update multiple settings at once
 */
export async function updateSettings(settings: Record<string, string>) {
    const upserts = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updatedAt: new Date().toISOString(),
    }));

    const { error } = await supabase
        .from('site_settings')
        .upsert(upserts, { onConflict: 'key' });

    if (error) throw error;
    return { success: true };
}
