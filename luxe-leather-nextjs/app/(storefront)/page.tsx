
import Link from "next/link";
import { contentService } from "@/lib/services/contentService";
import { getAll as getSettings } from "@/lib/services/settingsService";
import { staticAsset } from "@/lib/staticAssets";

import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const title = await contentService.getBySlug('home_meta_title');
  const description = await contentService.getBySlug('home_meta_description');

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
  };
}

export default async function HomePage() {
  const cmsContent: Record<string, string> = {};
  const keysToFetch = [
    'home_hero_title', 'home_hero_subtitle', 'home_hero_cta', 'home_hero_image',
    'home_featured_title', 'home_featured_subtitle',
    'home_testimonials_title'
  ];
  await Promise.all(keysToFetch.map(async (key) => {
    cmsContent[key] = await contentService.getBySlug(key);
  }));
  const settings = await getSettings();

  // Fetch Categories
  const { data: dbCategories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  const homeHeroImage = cmsContent.home_hero_image || staticAsset(settings, 'home_hero_image');

  const categories = dbCategories?.map(c => ({
    name: c.name,
    image: c.image_url || '',
    isCustom: c.name.toLowerCase() === 'custom'
  })) || [];

  // Fetch Featured Products
  const { data: dbProducts } = await supabase
    .from('products')
    .select('*')
    .eq('is_featured', true)
    .order('createdAt', { ascending: false })
    .limit(4);

  // Fetch Testimonials (5-star, approved, and featured)
  const { data: dbReviews } = await supabase
    .from('reviews')
    .select('rating, comment, customer_name, created_at')
    .eq('status', 'approved')
    .eq('is_featured', true)
    .gte('rating', 4)
    .order('created_at', { ascending: false })
    .limit(3);

  const testimonials = dbReviews?.map(r => ({
    name: r.customer_name || "Verified Buyer",
    role: "Verified Buyer",
    rating: r.rating,
    text: r.comment
  })) || [];


  return (
    <div className="flex flex-col text-[#1b0e10] dark:text-white overflow-x-hidden font-[family-name:var(--font-manrope)]">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative w-full h-[640px] flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('${homeHeroImage}')`,
            }}
          >
            <div className="absolute inset-0 bg-black/10 dark:bg-black/40"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto flex flex-col items-center gap-6">
            <h1 className="text-5xl md:text-7xl font-medium tracking-tight leading-[1.1]">
              {cmsContent.home_hero_title || "Crafted for the World"}
            </h1>
            <p className="text-lg md:text-xl font-medium text-white/90 leading-relaxed">
              {cmsContent.home_hero_subtitle || "Premium leather goods, handmade by masters using centuries-old techniques. Designed to last a lifetime."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link href="/shop" className="bg-[#cf1736] hover:bg-[#a3122a] text-white px-8 py-4 rounded font-bold text-sm tracking-widest uppercase transition-all shadow-lg">
                {cmsContent.home_hero_cta || "Shop Collection"}
              </Link>
              <Link href="/custom-orders" className="bg-white hover:bg-gray-100 text-[#1b0e10] px-8 py-4 rounded font-bold text-sm tracking-widest uppercase transition-all">
                Custom Orders
              </Link>
            </div>
          </div>
        </section>

        {/* Category Rail */}
        <section className="py-20 px-6 max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-medium tracking-tight text-[#1b0e10] dark:text-white">
              Shop by Category
            </h2>
            <Link
              href="/shop"
              className="text-[#cf1736] font-bold text-sm flex items-center hover:underline"
            >
              View All{" "}
              <span className="material-symbols-outlined text-sm ml-1">
                arrow_forward
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {categories.map((category, index) => (
              <Link
                key={index}
                href="/shop"
                className="group flex flex-col gap-4"
              >
                <div className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-white dark:bg-white/5 shadow-sm relative">
                  {category.isCustom && (
                    <div className="absolute inset-0 bg-[#cf1736]/10 flex items-center justify-center z-10 group-hover:bg-[#cf1736]/20 transition-colors">
                      <span className="material-symbols-outlined text-4xl text-[#cf1736]">
                        design_services
                      </span>
                    </div>
                  )}
                  <div
                    className={`w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110 ${category.isCustom ? "grayscale opacity-40" : ""} ${!category.image ? 'bg-gray-200 dark:bg-gray-800 flex items-center justify-center' : ''}`}
                    style={category.image ? { backgroundImage: `url('${category.image}')` } : {}}
                  >
                    {!category.image && <span className="material-symbols-outlined text-5xl text-gray-400">category</span>}
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium group-hover:text-[#cf1736] transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 px-6 bg-white dark:bg-white/5">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-medium text-[#1b0e10] dark:text-white mb-4">
                {cmsContent.home_featured_title || "Featured Collections"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-3xl mx-auto text-lg leading-relaxed">
                {cmsContent.home_featured_subtitle || "Timeless pieces crafted with precision and care. Discover our most sought-after leather goods."}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              {dbProducts?.map((product) => {
                const badgeText = product.featured_tag;
                return (
                <Link key={product.id} href={`/shop`} className="group relative block">
                  <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-100 relative mb-4">
                    <div
                      className={`w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105 ${!product.image ? 'bg-gray-200 flex items-center justify-center' : ''}`}
                      style={product.image ? { backgroundImage: `url('${product.image}')` } : {}}
                    >
                      {!product.image && <span className="material-symbols-outlined text-4xl text-gray-400">image</span>}
                    </div>
                    {badgeText && (
                      <div className="absolute top-4 left-4 bg-[#1a2632] dark:bg-[#cf1736] text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-widest shadow-lg">
                        {badgeText}
                      </div>
                    )}
                    <span className="absolute bottom-4 right-4 bg-white text-black p-3 rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 group-hover:bg-[#cf1736] group-hover:text-white">
                      <span className="material-symbols-outlined text-[20px] block">shopping_bag</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-[#1b0e10] dark:text-white">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {product.category}
                    </p>
                    <p className="font-bold text-[#cf1736] mt-2">
                      ${Number(product.price).toFixed(2)}
                    </p>
                  </div>
                </Link>
              )})}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-6 max-w-[1440px] mx-auto">
          <h2 className="text-3xl font-medium tracking-tight text-[#1b0e10] dark:text-white text-center mb-12">
            {cmsContent.home_testimonials_title || "Stories from our Customers"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.length > 0 ? testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white dark:bg-white/5 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 flex flex-col gap-4"
              >
                <div className="flex text-[#cf1736]">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`material-symbols-outlined text-[20px] ${i < testimonial.rating
                        ? "text-[#cf1736]"
                        : "text-gray-300"
                        }`}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="text-lg font-medium text-[#1b0e10]/80 dark:text-white leading-relaxed">
                  &quot;{testimonial.text}&quot;
                </p>
                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/10">
                  <p className="font-bold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            )) : (
              <div className="col-span-3 text-center text-gray-500 italic py-10">
                No verified reviews found. Check back soon!
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
