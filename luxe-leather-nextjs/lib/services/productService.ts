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
export const getAll = async (query: { search?: string; category?: string; limit?: string }) => {
    let dbQuery = supabase
        .from('Product')
        .select('*');

    if (query.category && query.category !== 'All') {
        dbQuery = dbQuery.eq('category', query.category);
    }

    if (query.search) {
        dbQuery = dbQuery.ilike('name', `%${query.search}%`);
    }

    dbQuery = dbQuery.order('createdAt', { ascending: false });

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
        .from('Product')
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
    const { data, error } = await supabase
        .from('Product')
        .insert([productData])
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
        .from('Product')
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
    const { error } = await supabase
        .from('Product')
        .delete()
        .eq('id', id);

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }
};
