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
        .from('ShippingRate')
        .select('*')
        .eq('isActive', true)
        .order('price', { ascending: true });

    if (error) {
        console.error('Error fetching shipping rates:', error);
        return [];
    }

    return data as ShippingRate[];
}
