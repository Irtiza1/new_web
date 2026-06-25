import { supabase } from '../supabase';

export interface CMSContent {
    id: string;
    slug: string;
    content: string;
    description: string;
    contentType: string;
    updatedAt: string;
}

export const contentService = {
    async getAll(): Promise<CMSContent[]> {
        const { data, error } = await supabase
            .from('site_content')
            .select('*')
            .order('slug', { ascending: true });

        if (error) {
            console.error('ContentService Error:', error);
            throw error;
        }
        return data.map(item => ({
            id: item.id,
            slug: item.slug,
            content: item.content,
            description: item.description,
            contentType: item.content_type,
            updatedAt: item.updated_at
        }));
    },

    async getBySlug(slug: string): Promise<string> {
        const { data, error } = await supabase
            .from('site_content')
            .select('content')
            .eq('slug', slug)
            .maybeSingle();

        if (error || !data) return '';
        return data.content;
    },

    async updateContent(id: string, content: string): Promise<void> {
        const { error } = await supabase
            .from('site_content')
            .update({ content, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Supabase Update Error:', error);
            throw new Error(error.message || 'Failed to update content');
        }
    },

    async upsertContentBySlug(slug: string, content: string, title?: string, section?: string, type: string = 'text'): Promise<void> {
        // Try to find if it exists
        const { data } = await supabase
            .from('site_content')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();

        if (data && data.id) {
            // Update
            const { error } = await supabase
                .from('site_content')
                .update({ content, updated_at: new Date().toISOString() })
                .eq('id', data.id);
            if (error) {
                console.error('Supabase Update Error:', error);
                throw new Error(error.message || 'Failed to update content');
            }
        } else {
            // Insert
            const { error } = await supabase
                .from('site_content')
                .insert([{
                    slug,
                    content,
                    description: section || 'CMS Content',
                    content_type: type
                }]);
            if (error) {
                console.error('Supabase Insert Error:', error);
                throw new Error(error.message || 'Failed to insert content');
            }
        }
    }
};
