'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Order } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';

interface AdminOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (orderData: any) => Promise<void>;
}

// Simplified types for the selection lists
type SimpleCustomer = { id: string; name: string; email: string };
type SimpleProduct = { id: string; name: string; price: number; stock: number };

export default function AdminOrderModal({ isOpen, onClose, onSubmit }: AdminOrderModalProps) {
    const { showToast } = useToast();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(false);

    // Data lists
    const [customers, setCustomers] = useState<SimpleCustomer[]>([]);
    const [products, setProducts] = useState<SimpleProduct[]>([]);

    // Form State
    const [customerId, setCustomerId] = useState('');
    const [status, setStatus] = useState<Order['status']>('PENDING');
    const [items, setItems] = useState<{ product_id: string; quantity: number; price: number }[]>([]);

    // Load data on open
    useEffect(() => {
        if (isOpen && (customers.length === 0 || products.length === 0)) {
            fetchData();
        }
        if (isOpen) {
            // Reset form
            setCustomerId('');
            setStatus('PENDING');
            setItems([]);
        }
    }, [isOpen, customers.length, products.length]);

    const fetchData = async () => {
        setIsFetchingData(true);
        try {
            // Concurrent fetch
            const [custRes, prodRes] = await Promise.all([
                fetch('/api/customers?limit=1000'),
                fetch('/api/products')
            ]);

            const custData = await custRes.json();
            const prodData = await prodRes.json();

            if (custData.success) setCustomers(custData.data);
            if (prodData.success) setProducts(prodData.data);

        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setIsFetchingData(false);
        }
    };

    const handleAddItem = () => {
        if (products.length === 0) return;
        setItems([...items, { product_id: products[0].id, quantity: 1, price: products[0].price }]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleItemChange = (index: number, field: 'product_id' | 'quantity', value: string | number) => {
        const newItems = [...items];
        const item = { ...newItems[index] };

        if (field === 'product_id') {
            const prod = products.find(p => p.id === value);
            if (prod) {
                item.product_id = prod.id;
                item.price = prod.price; // Update price when product changes
            }
        } else if (field === 'quantity') {
            item.quantity = Number(value);
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerId) { showToast('Please select a customer', 'error'); return; }
        if (items.length === 0) { showToast('Please add at least one item', 'error'); return; }

        setIsLoading(true);
        try {
            const orderData = {
                customer_id: customerId,
                status,
                total: calculateTotal(),
                items
            };
            await onSubmit(orderData);
            onClose();
        } catch (error) {
            console.error('Error submitting order:', error);
            showToast('Failed to create order', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !mounted) return null;

    const container = typeof document !== 'undefined' ? document.body : null;
    if (!container) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-xl w-full max-h-[90vh] overflow-y-auto" style={{ maxWidth: '672px' }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-[#e5e7eb] dark:border-[#2d3b4a]">
                    <h2 className="text-xl font-bold text-[#0d141b] dark:text-white">Create New Order</h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
                    {isFetchingData ? (
                        <div className="flex justify-center py-8">
                            <span className="material-symbols-outlined animate-spin text-3xl text-[#d41132]">progress_activity</span>
                        </div>
                    ) : (
                        <>
                            {/* Customer & Status */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-[#0d141b] dark:text-white">Customer</label>
                                    <select
                                        required
                                        value={customerId}
                                        onChange={(e) => setCustomerId(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none"
                                    >
                                        <option value="">Select a customer...</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-[#0d141b] dark:text-white">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as any)}
                                        className="w-full px-4 py-2 rounded-lg bg-[#f6f7f8] dark:bg-[#101922] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#d41132] outline-none"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <label className="text-sm font-bold text-[#0d141b] dark:text-white">Order Items</label>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="text-sm text-[#d41132] font-bold hover:underline flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-sm">add</span> Add Item
                                    </button>
                                </div>

                                {items.length === 0 ? (
                                    <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg text-center text-sm text-gray-400 border border-dashed border-gray-200 dark:border-gray-700">
                                        No items added. Click "Add Item" to start.
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="flex gap-3 items-start bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                                <div className="flex-1">
                                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Product</label>
                                                    <select
                                                        value={item.product_id}
                                                        onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                                                        className="w-full text-sm px-3 py-2 rounded bg-white dark:bg-[#1a2632] border border-gray-300 dark:border-gray-600"
                                                    >
                                                        {products.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-24">
                                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Qty</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                                        className="w-full text-sm px-3 py-2 rounded bg-white dark:bg-[#1a2632] border border-gray-300 dark:border-gray-600"
                                                    />
                                                </div>
                                                <div className="w-24 text-right">
                                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Subtotal</label>
                                                    <p className="text-sm font-bold pt-2">${(item.price * item.quantity).toFixed(2)}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="mt-6 text-gray-400 hover:text-red-500"
                                                >
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Total */}
                            <div className="flex justify-between items-center pt-4 border-t border-[#e5e7eb] dark:border-[#2d3b4a]">
                                <span className="font-bold text-lg text-[#0d141b] dark:text-white">Total</span>
                                <span className="font-bold text-2xl text-[#d41132]">${calculateTotal().toFixed(2)}</span>
                            </div>
                        </>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-[#e5e7eb] dark:border-[#2d3b4a]">
                        <button type="button" onClick={onClose} className="px-4 py-2 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancel</button>
                        <button
                            type="submit"
                            disabled={isLoading || isFetchingData}
                            className="px-6 py-2 bg-[#d41132] hover:bg-[#b30f2a] text-white font-bold rounded-lg shadow-md transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Creating...' : 'Create Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        container
    );
}
