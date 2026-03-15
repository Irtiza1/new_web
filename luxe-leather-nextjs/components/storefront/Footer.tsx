import Link from "next/link";
import { STOREFRONT_NAV_ITEMS } from "@/lib/constants/navigation";

export default function Footer() {
    return (
        <footer className="bg-[#0C0E12] text-white pt-12 pb-14 border-t border-white/5 relative">
            <div className="max-w-[1440px] mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
                    {/* Brand Col */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-3xl text-[#c27a2a]">
                                checkroom
                            </span>
                            <span className="text-xl font-bold uppercase tracking-[0.2em] font-serif">
                                Luxe Leather
                            </span>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed max-w-xs">
                            Premium handcrafted leather goods designed for the modern world.
                            Guaranteed quality, sustainable materials.
                        </p>
                    </div>

                    {/* Links Col 1 - Shop */}
                    <div>
                        <h4 className="font-bold text-[10px] mb-6 uppercase tracking-[0.2em] text-[#c27a2a]">Shop</h4>
                        <ul className="flex flex-col gap-3 text-[11px] font-medium text-gray-400">
                            {STOREFRONT_NAV_ITEMS.filter(item => item.path === '/shop').map(item => (
                                <li key={item.name}>
                                    <Link href={item.path} className="hover:text-white transition-colors tracking-widest uppercase">
                                        All Products
                                    </Link>
                                </li>
                            ))}
                            <li><Link href="/shop?category=Jackets" className="hover:text-white transition-colors tracking-widest uppercase">Jackets</Link></li>
                            <li><Link href="/shop?category=Accessories" className="hover:text-white transition-colors tracking-widest uppercase">Accessories</Link></li>
                        </ul>
                    </div>

                    {/* Links Col 2 - Support */}
                    <div>
                        <h4 className="font-bold text-[10px] mb-6 uppercase tracking-[0.2em] text-[#c27a2a]">Support</h4>
                        <ul className="flex flex-col gap-3 text-[11px] font-medium text-gray-400">
                            <li><Link href="/contact" className="hover:text-white transition-colors tracking-widest uppercase">Contact Us</Link></li>
                            <li><Link href="/shipping" className="hover:text-white transition-colors tracking-widest uppercase">Shipping & Returns</Link></li>
                            <li><Link href="/shipping" className="hover:text-white transition-colors tracking-widest uppercase">Size Guide</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors tracking-widest uppercase">FAQ</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="flex flex-col gap-6">
                        <div>
                            <h4 className="font-bold text-[10px] mb-4 uppercase tracking-[0.2em] text-[#c27a2a]">Newsletter</h4>
                            <p className="text-gray-400 text-[11px] mb-4 leading-relaxed">
                                Subscribe for updates and exclusive offers.
                            </p>
                            <div className="relative group">
                                <input
                                    className="w-full bg-transparent border-b border-white/20 pb-3 text-[11px] tracking-widest text-white outline-none focus:border-[#c27a2a] transition-all placeholder:text-gray-600"
                                    placeholder="your@email.co"
                                    type="email"
                                />
                                <button className="absolute right-0 bottom-3 text-[#c27a2a] text-[9px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors">
                                    Join
                                </button>
                            </div>
                        </div>

                        {/* Social Icons */}
                        <div className="flex gap-5">
                            <a href="#" className="text-gray-500 hover:text-[#c27a2a] transition-all">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            </a>
                            <a href="#" className="text-gray-500 hover:text-[#c27a2a] transition-all">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.259 7.929-7.259 4.162 0 7.398 2.965 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.033-1.002 2.324-1.492 3.121 1.125.347 2.314.535 3.543.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Stripe */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-600">
                    <div className="flex flex-col md:flex-row items-center gap-6 lg:gap-10">
                        <p>© {new Date().getFullYear()} Luxe Leather Co.</p>
                        <div className="flex gap-6">
                            <Link href="/contact" className="hover:text-white transition-colors">Privacy</Link>
                            <Link href="/contact" className="hover:text-white transition-colors">Terms</Link>
                        </div>
                    </div>

                    {/* Payment Icons */}
                    <div className="flex items-center gap-6 opacity-30 grayscale brightness-0 invert">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-2.5 w-auto" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-2.5 w-auto" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-2.5 w-auto" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg" alt="Amex" className="h-2.5 w-auto" />
                    </div>
                </div>
            </div>
        </footer>
    );
}
