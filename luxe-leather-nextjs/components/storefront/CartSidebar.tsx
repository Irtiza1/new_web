'use client';

import { useState } from 'react';

interface CartItem {
    id: number;
    name: string;
    variant: string;
    quantity: number;
    price: number;
    image: string;
}

interface CartSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const initialItems: CartItem[] = [
    { id: 1, name: 'Aviator Jacket', variant: 'Size: M, Brown', quantity: 1, price: 250, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnW_Dj5QXncErXePHwY-GKugYL1JGF3bdJO2-dvzF3g5DS6_pp5i3UaxSA1HkBJ5c-iBvcFZYiRS7EaN__4mkFUl0AjTFWarTQjQSeigkvuZDwtBPPvNWn9EFiFyeChe5ee8lG_3zfR8h0z1vYxLxKE8qXUtYoN1KhYXzYpTbAXbOj34ThRmEldh5giEsrtS-wHPjzu1U-T2GwCX0W0TY6BlHud7SkW7Ypeu07rQZOsh9lGUZZYiZNregsy3XVADFURtNuIsgSZq4d' },
    { id: 2, name: 'Minimalist Wallet', variant: 'Color: Cognac', quantity: 2, price: 180, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGt-CXd4zInYKFbguNwFT87MP0fEPlPlucrhhFDOk4yIStgxb5h4tG6Oyqd4oxK5vZk73cemdXEYWv_tkNB1yK4XXPr85Pk2-7Rxxi7eMdZylNT8Mn5o3qgHt5nbefk6jyFoZS48jKUYvraZfU2QGzpwSVWhB_k-Zt1WWwm6h7L0bp1By-mXaxTPj4-dUVlFJnByhaOY1YQejTyMeoZlRV21RmGQ9E3kUB8mnKsrChCzyR_WJkK5mx92dPekZyBLGjyC9oT7zqQupL' },
    { id: 3, name: 'Leather Care Kit', variant: 'Size: Standard', quantity: 1, price: 35, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9h7G8wQyTWTSIxGuu6HfFNWtP9yhJs29T05rxTIbh7iCWtiWFFQISu6LU2yil51nXJZY7GsOqUxs66U95gMF4R2AWrc5uxVxdZpwlE_Tca8qmy9RiD-7VTD3flQ05bx1Bs9K3DNeRFDbgK8VnUxCZKGVgTi8wJ1fWhSBTO0i6btp-rhVnXxBI-NKVx3XNebxhlxwgS1W1ztGdbnPPwaYBdC-wQoysBU_pqofe7VtSQD35Tgjmm6xf74Yiuk8R68S4G1f_eNagPyJN' },
];

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
    const [items, setItems] = useState(initialItems);

    const updateQuantity = (id: number, delta: number) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        ));
    };

    const removeItem = (id: number) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
            )}

            {/* Sidebar */}
            <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-[460px] flex flex-col bg-white dark:bg-[#111827] shadow-2xl transform transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#137fec] text-2xl">shopping_bag</span>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Bag</h2>
                        <span className="bg-[#137fec] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{items.length}</span>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-full text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6" style={{ scrollbarWidth: 'thin' }}>
                    {items.map(item => (
                        <div key={item.id} className="group flex gap-5">
                            <div className="relative shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 dark:border-gray-700">
                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${item.image}')` }} />
                            </div>
                            <div className="flex flex-col flex-1 justify-between py-0.5">
                                <div>
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-tight">{item.name}</h3>
                                        <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.variant}</p>
                                </div>
                                <div className="flex items-end justify-between mt-2">
                                    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md h-8">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="px-2.5 h-full hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
                                            <span className="material-symbols-outlined text-[16px]">remove</span>
                                        </button>
                                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="px-2.5 h-full hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
                                            <span className="material-symbols-outlined text-[16px]">add</span>
                                        </button>
                                    </div>
                                    <p className="font-medium text-slate-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {/* Shipping Notice */}
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg flex gap-3 items-start">
                        <span className="material-symbols-outlined text-[#137fec] text-xl shrink-0 mt-0.5">local_shipping</span>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Free shipping automatically applied to all orders over $200.</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 dark:border-gray-800 p-8 bg-white dark:bg-[#111827] space-y-4 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-20">
                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                            <span>Subtotal</span>
                            <span className="font-medium text-slate-900 dark:text-white">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                            <span>Shipping</span>
                            <span>Calculated next step</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold text-slate-900 dark:text-white pt-2 border-t border-dashed border-gray-200 dark:border-gray-700 mt-2">
                            <span>Total</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button className="w-full h-12 flex items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1DA851] text-white font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.99]">
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path></svg>
                            Order via WhatsApp
                        </button>
                        <button className="w-full h-12 flex items-center justify-center gap-2 rounded-lg border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white font-bold hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">mail</span>
                            Order via Email
                        </button>
                    </div>
                    <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
                        Secure checkout managed directly by our concierge team.
                    </p>
                </div>
            </div>
        </>
    );
}
