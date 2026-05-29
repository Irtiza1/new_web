import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Default client for frontend/anon operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend API routes to bypass RLS securely
// This should ONLY be used in /app/api/... routes, NEVER in client components
export const supabaseAdmin = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey) 
    : supabase; // Fallback to anon if service key is missing during build

// Types for our database tables — must match actual Supabase column names
export type Product = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image: string;
    images?: string[]; // Array of secondary images
    category: string;
    stock: number;
    sizes?: string[];
    badge?: string | null;
    rating?: number;
    reviews?: number;
    salesCount?: number; // For sorting by popularity
    customSizingPrice?: number; // Base price for custom sizing
    isActive: boolean; // Soft delete flag — false = archived/hidden from storefront
    is_featured?: boolean; // Front-end toggle for featured products
    featured_tag?: string | null;
    createdAt: string;
    updatedAt: string;
};

export type Coupon = {
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    value: number;
    minOrderAmount?: number;
    isActive: boolean;
    expiryDate?: string | null;
    createdAt: string;
};

export type Customer = {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    isActive: boolean; // false = anonymized/GDPR-deleted customer
    createdAt: string;
    updatedAt: string;
};

export type Order = {
    id: string;
    order_number?: string | null;
    customerId: string;
    customer_id?: string;
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    total: number;
    subtotal?: number;
    shipping?: number;
    notes?: string | null;
    stripe_session_id?: string | null;
    stripe_payment_intent_id?: string | null;
    payment_status?: 'unpaid' | 'paid' | 'failed' | 'refunded';
    isDeleted: boolean; // soft delete — orders are never hard-deleted
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
