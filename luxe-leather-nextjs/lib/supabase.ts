import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables — must match actual Supabase column names
export type Product = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image: string;
    category: string;
    stock: number;
    sizes?: string[];
    badge?: string | null;
    rating?: number;
    reviews?: number;
    createdAt: string;
    updatedAt: string;
};

export type Customer = {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    createdAt: string;
    updatedAt: string;
};

export type Order = {
    id: string;
    customerId: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    total: number;
    items?: OrderItem[];
    createdAt: string;
    updatedAt?: string;
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
    customerId?: string | null;
    name: string;
    email: string;
    phone?: string | null;
    itemType: string;
    budget?: string | null;
    deadline?: string | null;
    description: string;
    inspiration?: string | null;
    status: 'new' | 'quoted' | 'in_progress' | 'completed';
    createdAt: string;
    updatedAt: string;
};

export type ContactMessage = {
    id: string;
    name: string;
    email: string;
    phone?: string;
    inquiry_type: string;
    message: string;
    status: 'new' | 'read' | 'replied';
    createdAt: string;
};

export type MediaFile = {
    id: string;
    filename: string;
    url: string;
    size?: number;
    width?: number;
    height?: number;
    content_type?: string;
    folder?: string;
    alt_text?: string;
    createdAt: string;
};

export type SiteSetting = {
    id: string;
    key: string;
    value: string | null;
    updatedAt: string;
};
