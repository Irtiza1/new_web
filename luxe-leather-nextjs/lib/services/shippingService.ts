import { supabase } from '../supabase';

export interface ShippingRate {
    id: string;
    method: string;
    description: string;
    price: number | string;
    estimatedDays: string;
    isActive: boolean;
}

export async function getShippingRates(): Promise<ShippingRate[]> {
    const { data, error } = await supabase
        .from('shipping_zones')
        .select('*')
        .eq('is_active', true)
        .order('rate', { ascending: true });

    if (error) {
        console.error('Error fetching shipping rates:', error);
        return [];
    }

    return (data || []).map(z => ({
        id: z.id,
        method: z.name,
        description: z.regions,
        price: z.rate,
        estimatedDays: `${z.handling_days} days`,
        isActive: z.is_active
    }));
}
