import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image_url: string;
    stock: number;
    colors?: string[];
    sizes?: string[];
    created_at: string;
    updated_at: string;
};

export type Customer = {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    created_at: string;
};

export type Order = {
    id: string;
    customer_id: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    total: number;
    items: OrderItem[];
    created_at: string;
    updated_at: string;
};

export type OrderItem = {
    product_id: string;
    quantity: number;
    price: number;
    color?: string;
    size?: string;
};

export type CustomRequest = {
    id: string;
    customer_name: string;
    customer_email: string;
    request_type: string;
    description: string;
    budget_min: number;
    budget_max: number;
    deadline?: string;
    status: 'new' | 'quoted' | 'in_progress' | 'completed';
    created_at: string;
};
