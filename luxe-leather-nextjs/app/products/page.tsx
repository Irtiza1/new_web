"use client";

import { useEffect, useState } from "react";
import { getAllProducts, createProduct, updateProduct, deleteProduct } from "@/lib/api/products";
import type { Product } from "@/lib/supabase";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: 0,
        category: "",
        image_url: "",
        stock: 0,
    });

    // Load products
    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAllProducts();
            setProducts(data);
        } catch (err: any) {
            setError(err.message || "Failed to load products");
            console.error("Error loading products:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    // Handle create/update
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, formData);
            } else {
                await createProduct(formData as any);
            }
            setIsModalOpen(false);
            resetForm();
            loadProducts();
        } catch (err: any) {
            alert("Error: " + err.message);
        }
    };

    // Handle delete
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            await deleteProduct(id);
            loadProducts();
        } catch (err: any) {
            alert("Error: " + err.message);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            price: 0,
            category: "",
            image_url: "",
            stock: 0,
        });
        setEditingProduct(null);
    };

    // Open modal for editing
    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || "",
            price: product.price,
            category: product.category,
            image_url: product.image_url || "",
            stock: product.stock,
        });
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen p-8 bg-background-light dark:bg-background-dark">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                            Products Management
                        </h1>
                        <p className="text-text-secondary-light dark:text-text-secondary-dark">
                            Testing Supabase CRUD Operations
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            resetForm();
                            setIsModalOpen(true);
                        }}
                        variant="primary"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Add Product
                    </Button>
                </div>

                {/* Error State */}
                {error && (
                    <Card variant="bordered" padding="md">
                        <div className="flex items-center gap-3 text-error">
                            <span className="material-symbols-outlined text-3xl">error</span>
                            <div>
                                <h3 className="font-bold">Database Connection Error</h3>
                                <p className="text-sm mt-1">{error}</p>
                                <p className="text-xs mt-2 text-text-secondary-light dark:text-text-secondary-dark">
                                    Make sure you've:
                                    <br />
                                    1. Created the database tables (run supabase-schema.sql)
                                    <br />
                                    2. Added NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local
                                    <br />
                                    3. Restarted the dev server
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                        <p className="mt-4 text-text-secondary-light dark:text-text-secondary-dark">
                            Loading products...
                        </p>
                    </div>
                )}

                {/* Products Grid */}
                {!loading && !error && (
                    <>
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                                All Products ({products.length})
                            </h2>
                        </div>

                        {products.length === 0 ? (
                            <Card padding="lg">
                                <div className="text-center py-8">
                                    <span className="material-symbols-outlined text-6xl text-text-secondary-light dark:text-text-secondary-dark mb-4">
                                        inventory_2
                                    </span>
                                    <h3 className="text-xl font-bold mb-2">No products yet</h3>
                                    <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
                                        Run the SQL schema to add sample products, or create your first product.
                                    </p>
                                    <Button onClick={() => setIsModalOpen(true)}>
                                        Create First Product
                                    </Button>
                                </div>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map((product) => (
                                    <Card key={product.id} variant="elevated" padding="none">
                                        {/* Product Image */}
                                        {product.image_url && (
                                            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-xl overflow-hidden">
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}

                                        {/* Product Info */}
                                        <div className="p-6 space-y-4">
                                            <div>
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                                                        {product.name}
                                                    </h3>
                                                    <Badge variant="primary">{product.category}</Badge>
                                                </div>
                                                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark line-clamp-2">
                                                    {product.description}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-2xl font-bold text-primary">
                                                        {formatCurrency(product.price)}
                                                    </div>
                                                    <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                                        Stock: {product.stock}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 pt-4 border-t border-border-light dark:border-border-dark">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEdit(product)}
                                                    fullWidth
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        edit
                                                    </span>
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => handleDelete(product.id)}
                                                    fullWidth
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        delete
                                                    </span>
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Create/Edit Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        resetForm();
                    }}
                    title={editingProduct ? "Edit Product" : "Create Product"}
                    size="lg"
                >
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <Input
                            label="Product Name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            required
                        />
                        <Input
                            label="Description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Price"
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) =>
                                    setFormData({ ...formData, price: parseFloat(e.target.value) })
                                }
                                required
                            />
                            <Input
                                label="Stock"
                                type="number"
                                value={formData.stock}
                                onChange={(e) =>
                                    setFormData({ ...formData, stock: parseInt(e.target.value) })
                                }
                                required
                            />
                        </div>
                        <Input
                            label="Category"
                            value={formData.category}
                            onChange={(e) =>
                                setFormData({ ...formData, category: e.target.value })
                            }
                            required
                        />
                        <Input
                            label="Image URL"
                            value={formData.image_url}
                            onChange={(e) =>
                                setFormData({ ...formData, image_url: e.target.value })
                            }
                        />

                        <div className="flex gap-3 pt-4">
                            <Button type="submit" variant="primary" fullWidth>
                                {editingProduct ? "Update Product" : "Create Product"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    resetForm();
                                }}
                                fullWidth
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
}
