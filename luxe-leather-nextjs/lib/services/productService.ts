import { supabase, Product } from '../../lib/supabase';
import { AppError } from '../utils/AppError';

// ============================================
// PRODUCT SERVICE
// ============================================

/**
 * Get all products with optional filtering
 * @param {Object} query - Query parameters
 * @returns {Promise<Product[]>} List of products
 */
export const getAll = async (query: { search?: string; category?: string; limit?: string; sortBy?: string }) => {
    let dbQuery = supabase
        .from('products')
        .select('*');

    if (query.category && query.category !== 'All' && query.category !== 'All Products') {
        dbQuery = dbQuery.eq('category', query.category);
    }

    if (query.search) {
        dbQuery = dbQuery.ilike('name', `%${query.search}%`);
    }

    // Apply Sorting at DB level
    if (query.sortBy === 'popularity') {
        dbQuery = dbQuery.order('salesCount', { ascending: false });
    } else if (query.sortBy === 'rating') {
        dbQuery = dbQuery.order('rating', { ascending: false, nullsFirst: false });
    } else if (query.sortBy === 'price-low') {
        dbQuery = dbQuery.order('price', { ascending: true });
    } else if (query.sortBy === 'price-high') {
        dbQuery = dbQuery.order('price', { ascending: false });
    } else {
        dbQuery = dbQuery.order('createdAt', { ascending: false });
    }

    const { data, error } = await dbQuery;

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }
    return data as Product[];
};

/**
 * Get product by ID
 * @param {string} id - Product UUID
 * @returns {Promise<Product>}
 */
export const getById = async (id: string) => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        throw new AppError('Product not found', 404, 'NOT_FOUND');
    }
    return data as Product;
};

/**
 * Create a new product
 * @param {Omit<Product, 'id' | 'createdAt' | 'updatedAt'>} productData
 * @returns {Promise<Product>}
 */
export const create = async (productData: any) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Only include columns that actually exist in the Product table:
    // id, name, description, price, stock, category, image, badge, rating, sizes, createdAt, updatedAt
    const payload: any = {
        id,
        createdAt: now,
        updatedAt: now,
        name: productData.name,
        description: productData.description || null,
        price: productData.price,
        stock: productData.stock ?? 0,
        category: productData.category,
        image: productData.image || (Array.isArray(productData.images) && productData.images[0]) || '',
        badge: productData.badge || null,
        rating: productData.rating ?? 0,
        reviews: productData.reviews ?? 0,
        sizes: productData.sizes || [],
    };

    const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select()
        .single();

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }
    return data as Product;
};

/**
 * Update a product
 * @param {string} id - Product UUID
 * @param {Partial<Product>} updates
 * @returns {Promise<Product>}
 */
export const update = async (id: string, updates: Partial<Product>) => {
    const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }
    return data as Product;
};

/**
 * Delete a product
 * @param {string} id - Product UUID
 * @returns {Promise<void>}
 */
export const remove = async (id: string) => {
    // Delete associated OrderItems first to satisfy FK constraint
    const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('product_id', id);

    if (itemsError) {
        throw new AppError(itemsError.message, 500, 'DB_ERROR');
    }

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }
};
