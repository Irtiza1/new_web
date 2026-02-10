'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';

const categories = ['All Products', 'Jackets', 'Full Coats', 'Bags & Satchels', 'Accessories', 'Shoes'];

const products = [
    { id: 1, name: 'The Aviator Jacket', price: 350, rating: 4.8, reviews: 124, sizes: ['S', 'M', 'L', 'XL'], badge: null, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnW_Dj5QXncErXePHwY-GKugYL1JGF3bdJO2-dvzF3g5DS6_pp5i3UaxSA1HkBJ5c-iBvcFZYiRS7EaN__4mkFUl0AjTFWarTQjQSeigkvuZDwtBPPvNWn9EFiFyeChe5ee8lG_3zfR8h0z1vYxLxKE8qXUtYoN1KhYXzYpTbAXbOj34ThRmEldh5giEsrtS-wHPjzu1U-T2GwCX0W0TY6BlHud7SkW7Ypeu07rQZOsh9lGUZZYiZNregsy3XVADFURtNuIsgSZq4d' },
    { id: 2, name: 'Classic Trench', price: 450, rating: 4.9, reviews: 89, sizes: ['XS', 'S', 'M', 'L'], badge: 'Best Seller', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYmdUxNujkHwzryhHTMYtJbvoOf5_DivfC9fd0k9sSvApi9stgS3uzPV3k64yyoB_IvA98uRBKXN7llnlc0S-wGEBhaF-ZQCJeaBYyeagGiFmDgPJvvvBlYH-I4UE_y1XmM6YW4BM4htF0yS-eDnYhDVqLNXlZkOfltEtSnh02B0fchCuDAtOz9tV60ri79ea71pTo95Lr9vGOmmKGGCXlmEcTBWFony1E3xDFSSeihzsfgaZyG60W9B1rYNyeOHD7Lnnde8v6JoAR' },
    { id: 3, name: 'City Satchel', price: 120, rating: 4.7, reviews: 45, sizes: ['One Size'], badge: null, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd5tkub3a9xaUJZsiQJEr6byQDP5S00Xo8cncn5UA0ZPakIXfHyc9TL3Zu-c0OOl1OTaK15nB68tzSnefLh5VnAkxgkcfgRU9i9bGdWT0P8Ew7mP16jj58yrQq10VGAgjl28xs6ZqID8MJa68w2-Eto-OtbnkzbSVEcLuetnoylo0fkU54OjX1-C8MUjWsFU-vzsYlFbzGhF09UA0Y4iZt6KXkGBuGkFfU5lsyGr8YkDF-Gfm5aXwPi-akd2GkQOlT4WtwFOSd_VhQ' },
    { id: 4, name: 'Heritage Belt', price: 85, rating: 4.6, reviews: 210, sizes: ['S', 'M', 'L', 'XL'], badge: null, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrJF8xwb6QmWMfZvjb3FRwSiSxg_pZZ7R5NxvPqXlxRZ338RWp-2BXU8xZ067HBRmWPvGIoFRUKazFsIqyeQRbC7xWIsHQAFkLQKrxpBNF-Swrw_FtjLHO-utIQ06XMK1sWMbEoPw8pHd0NpYA_IuuR4cL4CgquQW1SlDajz5xVXYNmfvdlpZQbhNOEl4eTKcxRnMNrsxyWJFmdgy-OG80V9ev8GC868rwjIW8s6jdhi9dc1WOmjmYCYF7fWtUaSuJ--K1Ao818CoD' },
    { id: 5, name: 'Midnight Bomber', price: 320, rating: 4.8, reviews: 67, sizes: ['M', 'L', 'XL'], badge: null, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNCO12pEzHRJXVCsL0_tX9O6I7av4mXNMuqWEcsr0DYbS8QYUVFt5R5UxUPCWt7Z9LX0gjGgrBOefek1n8APo_KfjVvxOcV87Ml_9g9qrFhj1Bm1hgTWt2Gbq16o0vafCnYroSMQafyIx_WXt7RSFwhCAncQvPYNp9ymYu-goohgXhttBeTtW8w10_alACfXSekmKPq1ib-nfs77iXSCw570kflLfy4veuhcWgUdjDpxboZEolMUUEvj28TnIl9QSPWBlrERgySJxE' },
    { id: 6, name: 'Grand Tourer', price: 550, rating: 5.0, reviews: 12, sizes: ['One Size'], badge: 'Limited', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUsSCmBCk_IQO_Nl-2_ndASDJm5kcQXS6_W_lvO1VYbs7WvMex4dnDuQFb0LCBK55M7B0RzJ3QNVx_a1VaJLhm1BPTXT7LLHGwEAfX1iyvocMBM4KnKYJJ4CBLvh-au63Fa8NkpzOg4AiaXruMKI4FAJaxRPeK2IupOzRmY3BnEMjUgRCOECqEGZDMdhGbKMucH-oQ6QmocXfSNQlFRUk1qEWYmQeKJohs9_3_SSi_hcNENIBelPmIaAnbPe5MZyL9KHozfQV03IJj' },
    { id: 7, name: 'Slim Fold Wallet', price: 60, rating: 4.5, reviews: 340, sizes: ['One Size'], badge: null, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzBOZ-NZvYWubfP5m1e81bS4ZgMNYkOVwJOHBpgwGJXalmlVxkm7vNefsQpSA8WyjSBWytVUWaw7Ti3yOHLVYZ2XYfEYjeWf9D6_h2eLMyWFR1vV9iKw634H22pAK8l-0rqhkiD6LRjAzRkowlGoXVPEst829hGczclPNx76zDVXr4O7NtoQOmIhBkOVytCq1QojH9mbKyxjXoXs4eWu0maAW8nceu9ADfx3vZlywaAj76dBSl6vjhoy409kEId2oYxZkUIq-_ZAmn' },
    { id: 8, name: 'Rider Boots', price: 200, rating: 4.7, reviews: 92, sizes: ['7', '8', '9', '10', '11'], badge: null, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwVacSPanPswS_WkzvGeWhQbOSXur42cL1JWtgMzzPZT1VjxkrSFzekxbz5gvDw9T2tac7_H2pyPRLLMyBmWt6eDOzYeFNUBpCn37vMG0wyxDA-gbDljp8B6tLhbknNFCvDSeFQBUnls1cuAhTxZ55zzevUH5R-SAoB6qN08mBiHWYvc7JJfI_S6mKhpx0MbPu8jKPUmJKa52u2PmevJj2MYLvx_sy5ktI56SPhAdi52laytGqFuy1W7g0XtWtbC1GEkwK4ne8Af1T' },
];

export default function ShopPage() {
    const [activeCategory, setActiveCategory] = useState('All Products');

    return (
        <div className="bg-[#FAFAF8] dark:bg-[#111621] text-[#0e121b] dark:text-white min-h-screen flex flex-col font-[family-name:var(--font-inter)]">
            <Header />

            {/* Main Content */}
            <main className="flex-grow w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-12">
                {/* Page Header */}
                <div className="mb-12 text-center md:text-left">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Our Collection</h2>
                    <p className="text-lg text-[#4e6797] dark:text-gray-400">Discover our premium leather goods, handcrafted by artisans for a lifetime of adventure.</p>
                </div>

                {/* Filter Tabs */}
                <div className="mb-10 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                    <div className="flex gap-3 min-w-max">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all ${activeCategory === cat
                                    ? 'bg-[#0e121b] text-white dark:bg-white dark:text-[#0e121b] shadow-lg shadow-gray-200/50 dark:shadow-none hover:scale-105 active:scale-95'
                                    : 'bg-white dark:bg-gray-800 text-[#0e121b] dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#0e121b] dark:hover:border-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
                    {products.map(product => (
                        <div key={product.id} className="group flex flex-col gap-3">
                            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                    style={{ backgroundImage: `url('${product.image}')` }}
                                />
                                <button className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-black/60 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#d41132]">
                                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                                </button>
                                {product.badge && (
                                    <div className={`absolute bottom-3 left-3 bg-white/90 dark:bg-black/80 px-2 py-1 text-xs font-bold uppercase tracking-wide rounded ${product.badge === 'Limited' ? 'text-orange-700' : ''}`}>
                                        {product.badge}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg leading-tight group-hover:text-[#d41132] transition-colors">{product.name}</h3>
                                    <p className="font-bold text-[#d41132] dark:text-#e85273">${product.price.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-1 text-yellow-500 text-sm">
                                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    <span className="font-medium text-[#0e121b] dark:text-white ml-1">{product.rating}</span>
                                    <span className="text-[#4e6797] text-xs font-normal ml-1">({product.reviews} reviews)</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {product.sizes.map(size => (
                                        <span key={size} className={`px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded text-[#4e6797] dark:text-gray-400 ${size === 'One Size' ? 'bg-gray-100 dark:bg-gray-800' : 'hover:border-[#0e121b] cursor-pointer dark:hover:border-white'}`}>
                                            {size}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Load More */}
                <div className="mt-16 flex justify-center">
                    <button className="px-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-sm hover:border-[#0e121b] dark:hover:border-white hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm">
                        Load More Products
                    </button>
                </div>
            </main>

            <Footer />

            {/* WhatsApp FAB */}
            <a href="#" className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#d41132] text-white rounded-full shadow-lg hover:bg-#a20e26 hover:scale-110 transition-all duration-300">
                <svg fill="currentColor" height="30px" viewBox="0 0 256 256" width="30px"><path d="M187.58,144.84l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88,40,40,0,0,0,40-40A8,8,0,0,0,187.58,144.84ZM152,176a72.08,72.08,0,0,1-72-72A24,24,0,0,1,99.29,80.46l11.48,23L101,118a8,8,0,0,0-.73,7.51,56.47,56.47,0,0,0,30.15,30.15A8,8,0,0,0,138,155l14.61-9.74,23,11.48A24,24,0,0,1,152,176ZM128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-6.54-.67L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Z"></path></svg>
            </a>
            {/* CTA Section */}
            <section className="py-20 px-6 bg-[#f8fafc] dark:bg-[#1e293b] text-center border-t border-gray-200 dark:border-gray-800">
                <div className="max-w-3xl mx-auto space-y-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] dark:text-white">
                        Ready to find your piece?
                    </h2>
                    <p className="text-lg text-gray-500 dark:text-gray-400">
                        Explore our latest collection of handcrafted leather goods
                    </p>
                    <button className="bg-[#d41132] hover:bg-[#b30f2a] text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg shadow-red-900/20">
                        Shop Collection
                    </button>
                </div>
            </section>
        </div>
    );
}
