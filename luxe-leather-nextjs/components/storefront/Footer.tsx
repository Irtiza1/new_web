import Link from "next/link";
import { STOREFRONT_NAV_ITEMS } from "@/lib/constants/navigation";

export default function Footer() {
    return (
        <footer className="bg-[#0C0E12] text-white pt-16 pb-20 border-t border-white/5 relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#c27a2a]/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-[1440px] mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
                    {/* Brand Col */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-4xl text-[#c27a2a]">
                                checkroom
                            </span>
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold uppercase tracking-[0.3em] font-serif leading-none">
                                    Luxe Leather
                                </span>
                                <span className="text-[10px] uppercase tracking-[0.5em] text-[#c27a2a] mt-1 font-bold">Since 2026</span>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                            Crafting heritage quality leather goods for the modern nomad. 
                            Every piece is hand-stitched with a lifetime guarantee, designed to age with grace and story.
                        </p>
                        
                        <div className="flex items-center gap-8 mt-4">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold uppercase tracking-widest text-[#c27a2a] mb-1">Lifetime</span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest">Warranty</span>
                            </div>
                            <div className="w-[1px] h-8 bg-white/10"></div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold uppercase tracking-widest text-[#c27a2a] mb-1">Ethical</span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest">Sourcing</span>
                            </div>
                        </div>
                    </div>

                    {/* Links Col 1 - Shop */}
                    <div>
                        <h4 className="font-bold text-sm mb-4 uppercase tracking-[0.2em] text-[#c27a2a] font-serif">The Collection</h4>
                        <ul className="flex flex-col gap-4 text-xs font-medium text-gray-400">
                            {STOREFRONT_NAV_ITEMS.filter(item => item.path === '/shop').map(item => (
                                <li key={item.name}>
                                    <Link href={item.path} className="hover:text-white transition-colors tracking-widest uppercase">
                                        All Products
                                    </Link>
                                </li>
                            ))}
                            <li><Link href="/shop?category=Jackets" className="hover:text-white transition-colors tracking-widest uppercase">Signature Jackets</Link></li>
                            <li><Link href="/shop?category=Accessories" className="hover:text-white transition-colors tracking-widest uppercase">Small Goods</Link></li>
                            <li><Link href="/bespoke" className="hover:text-[#c27a2a] transition-colors tracking-widest uppercase font-bold text-white">Bespoke Commissions</Link></li>
                        </ul>
                    </div>

                    {/* Links Col 2 - Concierge */}
                    <div>
                        <h4 className="font-bold text-sm mb-4 uppercase tracking-[0.2em] text-[#c27a2a] font-serif">Concierge</h4>
                        <ul className="flex flex-col gap-4 text-xs font-medium text-gray-400">
                            <li><Link href="/contact" className="hover:text-white transition-colors tracking-widest uppercase">Trace Order</Link></li>
                            <li><Link href="/shipping" className="hover:text-white transition-colors tracking-widest uppercase">Care & Maintenance</Link></li>
                            <li><Link href="/shipping" className="hover:text-white transition-colors tracking-widest uppercase">Shipping Policy</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors tracking-widest uppercase">Private Consultations</Link></li>
                        </ul>
                        <div className="mt-6 pt-6 border-t border-white/5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Artisan Support</p>
                            <a href="mailto:concierge@luxeleather.co" className="text-xs text-[#c27a2a] hover:text-white transition-colors font-bold tracking-widest">
                                concierge@luxeleather.co
                            </a>
                        </div>
                    </div>

                    {/* Newsletter - The Journal */}
                    <div className="flex flex-col gap-8">
                        <div>
                            <h4 className="font-bold text-sm mb-4 uppercase tracking-[0.2em] text-[#c27a2a] font-serif">The Artisan's Journal</h4>
                            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
                                Join our inner circle for exclusive early access to limited edition drops and artisan stories.
                            </p>
                            <div className="relative group">
                                <input
                                    className="w-full bg-transparent border-b border-white/20 pb-4 text-xs tracking-widest text-white outline-none focus:border-[#c27a2a] transition-all placeholder:text-gray-600"
                                    placeholder="your@email.co"
                                    type="email"
                                />
                                <button className="absolute right-0 bottom-4 text-[#c27a2a] text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors">
                                    Join
                                </button>
                            </div>
                        </div>

                        {/* Social Icons */}
                        <div className="mt-auto">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600 mb-4">Connect</h4>
                            <div className="flex gap-6">
                                <a href="#" className="text-gray-400 hover:text-[#c27a2a] transition-all transform hover:-translate-y-1">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                                </a>
                                <a href="#" className="text-gray-400 hover:text-[#c27a2a] transition-all transform hover:-translate-y-1">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.259 7.929-7.259 4.162 0 7.398 2.965 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.033-1.002 2.324-1.492 3.121 1.125.347 2.314.535 3.543.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
                                </a>
                                <a href="#" className="text-gray-400 hover:text-[#c27a2a] transition-all transform hover:-translate-y-1">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Stripe */}
                <div className="pt-8 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between gap-10 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">
                    <div className="flex flex-col md:flex-row items-center gap-8 lg:gap-12">
                        <p>© {new Date().getFullYear()} Luxe Leather Co. All rights reserved.</p>
                        <div className="flex gap-8">
                            <Link href="/contact" className="hover:text-white transition-colors">Privacy Policy</Link>
                            <Link href="/contact" className="hover:text-white transition-colors">Terms of Service</Link>
                        </div>
                    </div>

                    {/* Payment Provider SVGs */}
                    <div className="flex items-center gap-8 opacity-40 hover:opacity-100 transition-opacity duration-500">
                        <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 6H10C7.79086 6 6 7.79086 6 10V22C6 24.2091 7.79086 26 10 26H22C24.2091 26 26 24.2091 26 22V10C26 7.79086 24.2091 6 22 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 12L16 16L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div className="w-[1px] h-6 bg-white/10 hidden md:block"></div>
                        <div className="flex gap-4 grayscale">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4 w-auto object-contain brightness-0 invert" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4 w-auto object-contain brightness-0 invert" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4 w-auto object-contain brightness-0 invert" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg" alt="Amex" className="h-4 w-auto object-contain brightness-0 invert" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-[9px] text-[#c27a2a] tracking-[0.4em]">Artisan Crafted</span>
                        <div className="w-12 h-[1px] bg-[#c27a2a]/30"></div>
                    </div>
                </div>
            </div>
            
            {/* Decorative bottom texture/gradient */}
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#c27a2a]/20 to-transparent"></div>
        </footer>
    );
}
