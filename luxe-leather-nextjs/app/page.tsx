
import Link from "next/link";
import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";
import { contentService } from "@/lib/services/contentService";

import { supabase } from "@/lib/supabase";

export default async function HomePage() {
  const cmsContent: Record<string, string> = {};
  const keysToFetch = [
    'home_hero_title', 'home_hero_subtitle', 'home_hero_cta',
    'home_featured_title', 'home_featured_subtitle',
    'home_testimonials_title'
  ];
  await Promise.all(keysToFetch.map(async (key) => {
    cmsContent[key] = await contentService.getBySlug(key);
  }));

  // Fetch Categories
  const { data: dbCategories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  // Map to the aesthetic images since DB doesn't store them yet
  const categoryImages: Record<string, string> = {
    "Jackets": "https://lh3.googleusercontent.com/aida-public/AB6AXuA3Mi_4x3U-7bVaej8P1FqcWGO1loc-UlDb3dKp8fBeepxCP4ba_zcJhpELxvqiZWSbycGJQ4_VYDkc7tCC2D7Ga4TJ07sn-9LkhAsh_EdSFpHNQTkVEukqmfG4SCgwKyUPTsjAG4CH7DvMrAZs2FFJQK8xycF0EY2a7f-LtuaUDjvLhGpmtAcy9g96yAVgwz_-hy_nvYkAS9uYOVBCFbdXWid_3Lm9keTylyHZSiAGzUSBN-6Nt1M_YVnZGph1Wfz61rIw1vTqtPlg",
    "Bags": "https://lh3.googleusercontent.com/aida-public/AB6AXuBCXlGxUlNVUPCAiWMd3IcYHCtTCaQvmlKE8ckXliTBTGO7kZ24DWxTydT7c4x1eeH35zHBO74SK-RKLOoM7RhMziyd1-Fu4iCqwhQ5L1bpLGdqI3WB04LpXr8J23V6k3-ilfx436cvf0BlQP6GByydrvlclk3UpR7ByQsvVPZyi6bhMx70GBeaG9FuU586DekhEOcxRgynzdU7etRxAR6HZGK8nZgiGwPtCNy-bvAm9g7Gy0wYB-PKF7Z4hw0avEYeHbeL3Zj4LU4p",
    "Coats": "https://lh3.googleusercontent.com/aida-public/AB6AXuBO93bgOimTqtihwaN7n5zlO0ylWa0nFvO7i1VbdSfDNLYa7XiTh_lA-rtXtlqV-xBe4pfnyCEkRHegpXFjQRx7ALF0SlxPx9kYPFkAtaQqD6rq-zdDr_tU3FETvcs6hyuNQuwc58Hiiv2Z2gGsDurrj8QSftr9P9jNgWhuNb9snOBHADAHEX5gGjjptE6A3DwJzNFpau3b3EIS0aFxUQ0G7AZFBejy90dR2PvsCca8b_aKfrvIdSGZvl1Pqzn8ZkIvvKndePNvRrf0",
    "Accessories": "https://lh3.googleusercontent.com/aida-public/AB6AXuBpvy-aR6ixt8NgGdfJXyIz7APWRrVukfe-6kHDMsTC98bk97oHUi0JVRbzoL2oWp9hT5pZun2_QmxyCG1vnZm3fTOVnhd0Omj7PtoQRHdVeriLgRK_FvOcCOac_CbCQTjOPTmGn4VKuw92loIyXg4tWqFj6DKhpFq7SEriHHe9UF0V5ooAbLAnlsGfMUof3WmdqXsqotbv58-K2COJX_zeYno-As-Nivs6_g9qYCHL9P6EbZ9rwcRV9fvgfBqdDVECTFknlfJt11oB",
    "Wallets": "https://lh3.googleusercontent.com/aida-public/AB6AXuClaBZyru9u7jYuaK3T9Rimw2LKCajKhDdre-7pUpAdDe164j2mCQgKBs3C0e2btEGSZPfCmszf4gu4SHYwV49k8AheIEbrbScve59Wad63lFV0bdDtBAQ21w_KKQmIk09r0Cuqp4zDrpaPz_49pey7_pUTHqKVnKoiZkMz1k2f448mxAxZdvNOPSZWVw4d0NRlahRWlxhSWYJCVgXeRB_ghCxQMiVwQHC9Ta655dJjq99t2v4_e9pc_nJ7DEL3OWl74iWXb9dZl7Em",
    "Default": "https://lh3.googleusercontent.com/aida-public/AB6AXuBCXlGxUlNVUPCAiWMd3IcYHCtTCaQvmlKE8ckXliTBTGO7kZ24DWxTydT7c4x1eeH35zHBO74SK-RKLOoM7RhMziyd1-Fu4iCqwhQ5L1bpLGdqI3WB04LpXr8J23V6k3-ilfx436cvf0BlQP6GByydrvlclk3UpR7ByQsvVPZyi6bhMx70GBeaG9FuU586DekhEOcxRgynzdU7etRxAR6HZGK8nZgiGwPtCNy-bvAm9g7Gy0wYB-PKF7Z4hw0avEYeHbeL3Zj4LU4p"
  };

  const categories = dbCategories?.map(c => ({
    name: c.name,
    image: c.image_url || categoryImages[c.name] || categoryImages["Default"],
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
    <div className="min-h-screen flex flex-col bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] text-[#1A1A1A] dark:text-white overflow-x-hidden">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative w-full h-[640px] flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD663YQ9A3yCTD5ey9kXXjD2nNHR8t7_sLSr9pizcD4Ai5LZfqqKiZz8zyYNLGjhITo-Z05zCLpeLUJwAbqCICLNGO_KilvL65Qu-FKP5cmYRl4JBFK7k-3CzTHAzUTXnx21a6yXnPEDhsFh8I1xbgex4o4t8SYYq9qpJraotJZhmiRNI_bnKTgiLqMPpnV3CxPjLoWJ6ma68eRBMqoaUlXn2Zy2B_fQo09l7vqGPJwsnOPAHIsSj7-eSGjKyVbu7bHY_I5SD-QBRgT')",
            }}
          >
            <div className="absolute inset-0 bg-black/10 dark:bg-black/40"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto flex flex-col items-center gap-6">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] uppercase">
              {cmsContent.home_hero_title || "Crafted for the World"}
            </h1>
            <p className="text-lg md:text-xl font-medium text-white/90 leading-relaxed">
              {cmsContent.home_hero_subtitle || "Premium leather goods, handmade by masters using centuries-old techniques. Designed to last a lifetime."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link href="/shop" className="bg-[#d41132] hover:bg-[#d41132]/90 text-white px-8 py-4 rounded-lg font-bold text-sm tracking-wide uppercase transition-all transform hover:scale-105 shadow-lg shadow-[#d41132]/30">
                {cmsContent.home_hero_cta || "Shop Collection"}
              </Link>
              <Link href="/bespoke" className="bg-white hover:bg-gray-100 text-[#1A1A1A] px-8 py-4 rounded-lg font-bold text-sm tracking-wide uppercase transition-all">
                Explore Custom
              </Link>
            </div>
          </div>
        </section>

        {/* Category Rail */}
        <section className="py-20 px-6 max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-[#1A1A1A] dark:text-white">
              Shop by Category
            </h2>
            <Link
              href="/shop"
              className="text-[#d41132] font-bold text-sm flex items-center hover:underline"
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
                    <div className="absolute inset-0 bg-[#d41132]/10 flex items-center justify-center z-10 group-hover:bg-[#d41132]/20 transition-colors">
                      <span className="material-symbols-outlined text-4xl text-[#d41132]">
                        design_services
                      </span>
                    </div>
                  )}
                  <div
                    className={`w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110 ${category.isCustom ? "grayscale opacity-40" : ""
                      }`}
                    style={{ backgroundImage: `url('${category.image}')` }}
                  ></div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold group-hover:text-[#d41132] transition-colors">
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
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] dark:text-white mb-4">
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
                      className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url('${product.image || 'https://images.unsplash.com/photo-1551028719-00167b16eac5'}')` }}
                    ></div>
                    {badgeText && (
                      <div className="absolute top-4 left-4 bg-[#1a2632] dark:bg-[#d41132] text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                        {badgeText}
                      </div>
                    )}
                    {product.stock !== undefined && product.stock === 0 ? (
                      <span className="absolute bottom-4 right-4 bg-white text-red-500 font-bold text-[10px] uppercase tracking-widest px-3 py-2 rounded shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        Out of Stock
                      </span>
                    ) : (
                      <span className="absolute bottom-4 right-4 bg-white text-black p-3 rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 group-hover:bg-[#d41132] group-hover:text-white">
                        <span className="material-symbols-outlined text-[20px] block">shopping_bag</span>
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-[#1A1A1A] dark:text-white">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {product.category}
                    </p>
                    <p className="font-bold text-[#d41132] mt-2">
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
          <h2 className="text-3xl font-bold tracking-tight text-[#1A1A1A] dark:text-white text-center mb-12">
            {cmsContent.home_testimonials_title || "Stories from our Customers"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.length > 0 ? testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white dark:bg-white/5 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 flex flex-col gap-4"
              >
                <div className="flex text-[#d41132]">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`material-symbols-outlined text-[20px] ${i < testimonial.rating
                        ? "text-[#d41132]"
                        : "text-gray-300"
                        }`}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="text-lg font-medium text-[#1A1A1A] dark:text-white leading-relaxed">
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

      <Footer />
    </div>
  );
}
