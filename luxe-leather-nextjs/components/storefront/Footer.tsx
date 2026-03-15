import Link from "next/link";
import { STOREFRONT_NAV_ITEMS } from "@/lib/constants/navigation";

export default function Footer() {
    return (
        <footer className="bg-white dark:bg-[#1A1A1A] text-slate-900 dark:text-white pt-24 pb-32 border-t border-gray-100 dark:border-white/5">
            <div className="max-w-[1440px] mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand Col */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-3xl">
                                checkroom
                            </span>
                            <span className="text-xl font-bold uppercase tracking-widest font-serif">
                                Luxe Leather
                            </span>
                        </div>
                        <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">
                            Crafting heritage quality leather goods for the modern world.
                            Guaranteed for life, designed for you.
                        </p>
                    </div>

                    {/* Links Col 1 */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 font-serif">Shop</h4>
                        <ul className="flex flex-col gap-3 text-sm text-slate-600 dark:text-gray-400">
                            {STOREFRONT_NAV_ITEMS.filter(item => item.path === '/shop').map(item => (
                                <li key={item.name}>
                                    <Link
                                        href={item.path}
                                        className="hover:text-[#d41132] transition-colors"
                                    >
                                        All Products
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link
                                    href="/shop?category=Jackets"
                                    className="hover:text-[#d41132] transition-colors"
                                >
                                    Jackets
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/shop?category=Accessories"
                                    className="hover:text-[#d41132] transition-colors"
                                >
                                    Accessories
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Links Col 2 */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 font-serif">Support</h4>
                        <ul className="flex flex-col gap-3 text-sm text-slate-600 dark:text-gray-400">
                            <li>
                                <Link
                                    href="/contact"
                                    className="hover:text-[#d41132] transition-colors"
                                >
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/shipping"
                                    className="hover:text-[#d41132] transition-colors"
                                >
                                    Shipping & Returns
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/shipping"
                                    className="hover:text-[#d41132] transition-colors"
                                >
                                    Size Guide
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/shipping"
                                    className="hover:text-[#d41132] transition-colors"
                                >
                                    Care Instructions
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 font-serif">Stay in the Loop</h4>
                        <p className="text-slate-600 dark:text-gray-400 text-sm mb-4">
                            Subscribe for exclusive offers and first access to new drops.
                        </p>
                        <div className="flex gap-2">
                            <input
                                className="bg-gray-100 dark:bg-white/10 border-none rounded text-sm text-slate-900 dark:text-white placeholder-gray-500 focus:ring-1 focus:ring-[#d41132] w-full h-10 px-3"
                                placeholder="Your email address"
                                type="email"
                            />
                            <button className="bg-[#d41132] hover:bg-[#d41132]/90 text-white px-4 h-10 rounded text-sm font-bold">
                                Join
                            </button>
                        </div>
                     </div>
                 </div>
 
                 <div className="pt-12 border-t border-gray-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 text-[11px] font-medium text-slate-400 dark:text-gray-500">
                     <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                         <p className="tracking-wide">© {new Date().getFullYear()} Luxe Leather Co. All rights reserved.</p>
                         <div className="flex gap-8">
                             <Link href="/contact" className="hover:text-[#d41132] dark:hover:text-white transition-colors">
                                 Privacy Policy
                             </Link>
                             <Link href="/contact" className="hover:text-[#d41132] dark:hover:text-white transition-colors">
                                 Terms of Service
                             </Link>
                         </div>
                     </div>
                     
                     <div className="flex items-center gap-6">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-gray-700">Artisan Crafted</span>
                         <div className="w-8 h-[1px] bg-slate-200 dark:bg-gray-800"></div>
                     </div>
                 </div>
             </div>
         </footer>
    );
}
