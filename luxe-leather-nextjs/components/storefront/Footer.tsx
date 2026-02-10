import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-[#1A1A1A] text-white pt-16 pb-8">
            <div className="max-w-[1440px] mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand Col */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-3xl">
                                checkroom
                            </span>
                            <span className="text-xl font-bold uppercase tracking-widest">
                                Luxe Leather
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Crafting heritage quality leather goods for the modern world.
                            Guaranteed for life, designed for you.
                        </p>
                    </div>

                    {/* Links Col 1 */}
                    <div>
                        <h4 className="font-bold text-lg mb-6">Shop</h4>
                        <ul className="flex flex-col gap-3 text-sm text-gray-400">
                            <li>
                                <Link
                                    href="/shop"
                                    className="hover:text-[#d41132] transition-colors"
                                >
                                    New Arrivals
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/shop"
                                    className="hover:text-[#d41132] transition-colors"
                                >
                                    Best Sellers
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/shop"
                                    className="hover:text-[#d41132] transition-colors"
                                >
                                    Jackets
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/shop"
                                    className="hover:text-[#d41132] transition-colors"
                                >
                                    Accessories
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Links Col 2 */}
                    <div>
                        <h4 className="font-bold text-lg mb-6">Support</h4>
                        <ul className="flex flex-col gap-3 text-sm text-gray-400">
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
                        <h4 className="font-bold text-lg mb-6">Stay in the Loop</h4>
                        <p className="text-gray-400 text-sm mb-4">
                            Subscribe for exclusive offers and first access to new drops.
                        </p>
                        <div className="flex gap-2">
                            <input
                                className="bg-white/10 border-none rounded text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-[#d41132] w-full h-10 px-3"
                                placeholder="Your email address"
                                type="email"
                            />
                            <button className="bg-[#d41132] hover:bg-[#d41132]/90 text-white px-4 h-10 rounded text-sm font-bold">
                                Join
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
                    <p>© 2024 Luxe Leather Co. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/contact" className="hover:text-white">
                            Privacy Policy
                        </Link>
                        <Link href="/contact" className="hover:text-white">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
