import { supabase, type Product } from '../supabase';
export type { Product };

// ============================================
// PRODUCTS CRUD
// ============================================

/**
 * Get all products
 */
export async function getAllProducts() {
    const { data, error } = await supabase
        .from('Product')
        .select('*')
        .order('createdAt', { ascending: false });

    if (error) throw error;
    return data as Product[];
}

/**
 * Get products by category
 */
export async function getProductsByCategory(category: string) {
    const { data, error } = await supabase
        .from('Product')
        .select('*')
        .eq('category', category)
        .order('createdAt', { ascending: false });

    if (error) throw error;
    return data as Product[];
}

/**
 * Get single product by ID
 */
export async function getProductById(id: string) {
    const { data, error } = await supabase
        .from('Product')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Product;
}

/**
 * Search products by name
 */
export async function searchProducts(query: string) {
    const { data, error } = await supabase
        .from('Product')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('createdAt', { ascending: false });

    if (error) throw error;
    return data as Product[];
}

/**
 * Create new product
 */
export async function createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
        .from('Product')
        .insert([product])
        .select()
        .single();

    if (error) throw error;
    return data as Product;
}

/**
 * Update product
 */
export async function updateProduct(id: string, updates: Partial<Product>) {
    const { data, error } = await supabase
        .from('Product')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Product;
}

/**
 * Delete product
 */
export async function deleteProduct(id: string) {
    const { error } = await supabase
        .from('Product')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return { success: true };
}

/**
 * Update product stock
 */
export async function updateProductStock(id: string, quantity: number) {
    const { data, error } = await supabase
        .from('Product')
        .update({ stock: quantity })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Product;
}
