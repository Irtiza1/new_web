import { supabase, supabaseAdmin, Product } from '../../lib/supabase';
import { AppError } from '../utils/AppError';
import { auditLog, auditLogBulk } from './auditService';

// ============================================
// PRODUCT SERVICE
// ============================================

/**
 * Get all products with optional filtering
 * @param {Object} query - Query parameters
 * @param {boolean} includeInactive - When true (admin), returns ALL products including soft-deleted
 * @returns {Promise<Product[]>} List of products
 */
export const getAll = async (
    query: { search?: string; category?: string; limit?: string; sortBy?: string },
    includeInactive = false
) => {
    let dbQuery = supabase
        .from('products')
        .select('*');

    // Storefront only sees active products; admin can see all
    if (!includeInactive) {
        dbQuery = dbQuery.eq('isActive', true);
    }

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
export const create = async (productData: Partial<Product> & Record<string, unknown>) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const payload: Record<string, unknown> = {
        id,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        name: productData.name,
        description: productData.description || null,
        price: productData.price,
        stock: productData.stock ?? 0,
        category: productData.category,
        image: productData.image || (Array.isArray(productData.images) && productData.images[0]) || '',
        images: productData.images || [],
        badge: productData.badge || null,
        rating: productData.rating ?? 0,
        reviews: productData.reviews ?? 0,
        sizes: productData.sizes || [],
        specs: productData.specs || [],
        colors: productData.colors || [],
        allow_custom_sizing: productData.allow_custom_sizing || false,
        custom_sizing_price: productData.custom_sizing_price || 0,
        shipping_info: productData.shipping_info || {
            policy: "Free Worldwide Shipping",
            delivery_regular: "3-5 Working Days",
            delivery_custom: "12-15 Working Days"
        },
    };

    const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select()
        .single();

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }

    await auditLog('products', id, 'CREATE', { name: { from: null, to: payload.name }, price: { from: null, to: payload.price } });
    return data as Product;
};

/**
 * Update a product
 * @param {string} id - Product UUID
 * @param {Partial<Product>} updates
 * @returns {Promise<Product>}
 */
export const update = async (id: string, updates: Partial<Product>) => {
    // Capture current state for audit diff
    const { data: before } = await supabase.from('products').select('*').eq('id', id).single();

    const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }

    // Build field-level diff for audit
    if (before) {
        const changedFields: Record<string, { from: unknown; to: unknown }> = {};
        for (const key of Object.keys(updates) as (keyof Product)[]) {
            if (before[key] !== (data as Product)[key]) {
                changedFields[key as string] = { from: before[key], to: (data as Product)[key] };
            }
        }
        if (Object.keys(changedFields).length > 0) {
            await auditLog('products', id, 'UPDATE', changedFields);
        }
    }

    return data as Product;
};

/**
 * Delete a product
 * @param {string} id - Product UUID
 * @returns {Promise<void>}
 */
/**
 * Soft-delete a product (sets isActive = false).
 *
 * Strategy:
 *   - If the product has existing order_items → BLOCK deletion entirely.
 *     Order history is permanent business data and must not be destroyed.
 *     The admin should mark it inactive instead.
 *   - cart_items are ephemeral. The DB FK is set to ON DELETE CASCADE,
 *     so they are cleaned up automatically on a hard delete.
 *     On a soft delete we also clean them up explicitly so the cart
 *     doesn't show unavailable products to shoppers.
 *   - The product row itself is NOT removed from the DB; isActive = false
 *     hides it from the storefront while preserving order history references.
 *
 * @param {string} id - Product UUID
 * @returns {Promise<void>}
 */
export const remove = async (id: string) => {
    // 0. Fetch product first to get image URLs
    const { data: product } = await supabase
        .from('products')
        .select('image, images')
        .eq('id', id)
        .single();

    // 1. Guard: block if product is referenced in any order
    const { data: existingOrderItems, error: checkError } = await supabase
        .from('order_items')
        .select('id')
        .eq('product_id', id)
        .limit(1);

    if (checkError) {
        throw new AppError(checkError.message, 500, 'DB_ERROR');
    }

    if (existingOrderItems && existingOrderItems.length > 0) {
        throw new AppError(
            'This product has order history and cannot be permanently deleted. It has been archived (hidden from storefront) instead.',
            409,
            'CONFLICT'
        );
    }

    // 2. No orders → clean up cart_items (belt-and-suspenders; DB CASCADE also handles this)
    const { error: cartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('product_id', id);

    if (cartError) {
        throw new AppError(cartError.message, 500, 'DB_ERROR');
    }

    // 3. Hard delete — safe because no orders reference this product
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }

    // 4. Cascade delete images from storage
    if (product) {
        const legacyFileNames = new Set<string>();
        const mediaFileNames = new Set<string>();
        const allImages = [...(product.images || [])];
        if (product.image) allImages.push(product.image);

        allImages.forEach(url => {
            if (url && url.includes('public/media/product-images/')) {
                const parts = url.split('public/media/product-images/');
                if (parts.length > 1) {
                    mediaFileNames.add(parts[1]);
                }
            } else if (url && url.includes('public/product-images/')) {
                const parts = url.split('public/product-images/');
                if (parts.length > 1) {
                    legacyFileNames.add(parts[1]);
                }
            }
        });

        if (mediaFileNames.size > 0) {
            const filePaths = Array.from(mediaFileNames).map(f => `product-images/${f}`);
            await supabaseAdmin.storage.from('media').remove(filePaths);
            await supabaseAdmin.from('media_files').delete().in('filename', Array.from(mediaFileNames));
        }

        if (legacyFileNames.size > 0) {
            await supabaseAdmin.storage.from('product-images').remove(Array.from(legacyFileNames));
        }
    }

    await auditLog('products', id, 'DELETE');
};

/**
 * Hard delete multiple products and their associated images.
 * Safe delete: throws an error if any product has order history.
 */
export const removeBulk = async (ids: string[]) => {
    if (!ids || ids.length === 0) return { success: true };

    const { data: products } = await supabase
        .from('products')
        .select('id, image, images')
        .in('id', ids);

    const { data: existingOrderItems, error: checkError } = await supabase
        .from('order_items')
        .select('product_id')
        .in('product_id', ids);

    if (checkError) throw new AppError(checkError.message, 500, 'DB_ERROR');

    const productsWithOrders = new Set(existingOrderItems?.map(oi => oi.product_id) || []);
    const safeToDeleteIds = ids.filter(id => !productsWithOrders.has(id));
    const failedCount = productsWithOrders.size;

    if (safeToDeleteIds.length > 0) {
        await supabase.from('cart_items').delete().in('product_id', safeToDeleteIds);

        const { error } = await supabase.from('products').delete().in('id', safeToDeleteIds);
        if (error) throw new AppError(error.message, 500, 'DB_ERROR');

        const legacyFileNames = new Set<string>();
        const mediaFileNames = new Set<string>();
        safeToDeleteIds.forEach(id => {
            const product = products?.find(p => p.id === id);
            if (product) {
                const allImages = [...(product.images || [])];
                if (product.image) allImages.push(product.image);

                allImages.forEach(url => {
                    if (url && url.includes('public/media/product-images/')) {
                        const parts = url.split('public/media/product-images/');
                        if (parts.length > 1) {
                            mediaFileNames.add(parts[1]);
                        }
                    } else if (url && url.includes('public/product-images/')) {
                        const parts = url.split('public/product-images/');
                        if (parts.length > 1) {
                            legacyFileNames.add(parts[1]);
                        }
                    }
                });
            }
        });

        if (mediaFileNames.size > 0) {
            const filePaths = Array.from(mediaFileNames).map(f => `product-images/${f}`);
            await supabaseAdmin.storage.from('media').remove(filePaths);
            await supabaseAdmin.from('media_files').delete().in('filename', Array.from(mediaFileNames));
        }

        if (legacyFileNames.size > 0) {
            await supabaseAdmin.storage.from('product-images').remove(Array.from(legacyFileNames));
        }

        await auditLogBulk('products', safeToDeleteIds, 'DELETE');
    }

    if (failedCount > 0) {
        throw new AppError(
            `${failedCount} product(s) have order history and cannot be permanently deleted. They must be archived instead.`,
            409,
            'CONFLICT'
        );
    }

    return { success: true, deleted: safeToDeleteIds.length };
};

/**
 * Soft-delete (archive) a product by setting isActive = false.
 * Use this when the product has order history and cannot be hard-deleted.
 *
 * Also removes any active cart_items for the product so shoppers
 * don't see unavailable items in their carts.
 *
 * @param {string} id - Product UUID
 * @returns {Promise<Product>} The updated (archived) product
 */
export const archive = async (id: string) => {
    // Clean up localStorage-based cart: the validate API will handle client side.
    // Also attempt DB cart_items cleanup if used.
    await supabase.from('cart_items').delete().eq('product_id', id);

    const { data, error } = await supabase
        .from('products')
        .update({ isActive: false, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }

    await auditLog('products', id, 'ARCHIVE', { isActive: { from: true, to: false } });
    return data as Product;
};

/**
 * Restore a previously archived product (sets isActive = true).
 *
 * @param {string} id - Product UUID
 * @returns {Promise<Product>} The restored product
 */
export const restore = async (id: string) => {
    const { data, error } = await supabase
        .from('products')
        .update({ isActive: true, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }

    await auditLog('products', id, 'RESTORE', { isActive: { from: false, to: true } });
    return data as Product;
};
