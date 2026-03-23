import { supabase } from '@/lib/supabase';

export interface SizeGuide {
    id: string;
    label: string;
    chest: string;
    waist: string;
    hips: string;
    shoulders: string;
    length: string;
}

export const getSizeGuides = async (): Promise<SizeGuide[]> => {
    const { data, error } = await supabase
        .from('SizeGuide')
        .select('*')
        .order('label', { ascending: true });

    if (error) {
        console.error('Error fetching size guides:', error.message);
        return [];
    }

    return data as SizeGuide[];
};
