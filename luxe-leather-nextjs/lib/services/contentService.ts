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
            .single();

        if (error) return '';
        return data.content;
    },

    async updateContent(id: string, content: string): Promise<void> {
        const { error } = await supabase
            .from('site_content')
            .update({ content, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    }
};
