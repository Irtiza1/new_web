import Image from "next/image";
import Link from "next/link";
import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";
import { contentService } from "@/lib/services/contentService";

export default async function HomePage() {
  const cmsContent: Record<string, string> = {};
  await Promise.all(['home_hero_title', 'home_hero_subtitle', 'home_hero_cta'].map(async (key) => {
    cmsContent[key] = await contentService.getBySlug(key);
  }));
  const categories = [
    {
      name: "Bags",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBCXlGxUlNVUPCAiWMd3IcYHCtTCaQvmlKE8ckXliTBTGO7kZ24DWxTydT7c4x1eeH35zHBO74SK-RKLOoM7RhMziyd1-Fu4iCqwhQ5L1bpLGdqI3WB04LpXr8J23V6k3-ilfx436cvf0BlQP6GByydrvlclk3UpR7ByQsvVPZyi6bhMx70GBeaG9FuU586DekhEOcxRgynzdU7etRxAR6HZGK8nZgiGwPtCNy-bvAm9g7Gy0wYB-PKF7Z4hw0avEYeHbeL3Zj4LU4p",
    },
    {
      name: "Jackets",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuA3Mi_4x3U-7bVaej8P1FqcWGO1loc-UlDb3dKp8fBeepxCP4ba_zcJhpELxvqiZWSbycGJQ4_VYDkc7tCC2D7Ga4TJ07sn-9LkhAsh_EdSFpHNQTkVEukqmfG4SCgwKyUPTsjAG4CH7DvMrAZs2FFJQK8xycF0EY2a7f-LtuaUDjvLhGpmtAcy9g96yAVgwz_-hy_nvYkAS9uYOVBCFbdXWid_3Lm9keTylyHZSiAGzUSBN-6Nt1M_YVnZGph1Wfz61rIw1vTqtPlg",
    },
    {
      name: "Coats",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBO93bgOimTqtihwaN7n5zlO0ylWa0nFvO7i1VbdSfDNLYa7XiTh_lA-rtXtlqV-xBe4pfnyCEkRHegpXFjQRx7ALF0SlxPx9kYPFkAtaQqD6rq-zdDr_tU3FETvcs6hyuNQuwc58Hiiv2Z2gGsDurrj8QSftr9P9jNgWhuNb9snOBHADAHEX5gGjjptE6A3DwJzNFpau3b3EIS0aFxUQ0G7AZFBejy90dR2PvsCca8b_aKfrvIdSGZvl1Pqzn8ZkIvvKndePNvRrf0",
    },
    {
      name: "Masks",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuClaBZyru9u7jYuaK3T9Rimw2LKCajKhDdre-7pUpAdDe164j2mCQgKBs3C0e2btEGSZPfCmszf4gu4SHYwV49k8AheIEbrbScve59Wad63lFV0bdDtBAQ21w_KKQmIk09r0Cuqp4zDrpaPz_49pey7_pUTHqKVnKoiZkMz1k2f448mxAxZdvNOPSZWVw4d0NRlahRWlxhSWYJCVgXeRB_ghCxQMiVwQHC9Ta655dJjq99t2v4_e9pc_nJ7DEL3OWl74iWXb9dZl7Em",
    },
    {
      name: "Custom",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBCXlGxUlNVUPCAiWMd3IcYHCtTCaQvmlKE8ckXliTBTGO7kZ24DWxTydT7c4x1eeH35zHBO74SK-RKLOoM7RhMziyd1-Fu4iCqwhQ5L1bpLGdqI3WB04LpXr8J23V6k3-ilfx436cvf0BlQP6GByydrvlclk3UpR7ByQsvVPZyi6bhMx70GBeaG9FuU586DekhEOcxRgynzdU7etRxAR6HZGK8nZgiGwPtCNy-bvAm9g7Gy0wYB-PKF7Z4hw0avEYeHbeL3Zj4LU4p",
      isCustom: true,
    },
    {
      name: "Accessories",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBpvy-aR6ixt8NgGdfJXyIz7APWRrVukfe-6kHDMsTC98bk97oHUi0JVRbzoL2oWp9hT5pZun2_QmxyCG1vnZm3fTOVnhd0Omj7PtoQRHdVeriLgRK_FvOcCOac_CbCQTjOPTmGn4VKuw92loIyXg4tWqFj6DKhpFq7SEriHHe9UF0V5ooAbLAnlsGfMUof3WmdqXsqotbv58-K2COJX_zeYno-As-Nivs6_g9qYCHL9P6EbZ9rwcRV9fvgfBqdDVECTFknlfJt11oB",
    },
  ];

  const products = [
    {
      name: "The Aviator Jacket",
      subtitle: "Classic Brown Leather",
      price: 495.0,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuA2HkeNnu0abGDgCNiq4tq8ylBeGoRwx0R0fCWgG0tPbrPHirF9oh20vbGn1hsC10Kry0v8ya_Ni-bUmj9ewaL2-Uq_hc8pO82_Nhc6Fyp_G1iAotKTgrESRndrmxx9iAROtpt0J6pFph4pqM4k3bQsjo6L4xa__XSCEJkShUm1JWgqSsa34kOFWFH9tcz_AJSC4nlgWWxgnz4giQ7THGDrkjFmw47szjZQrn3-O-qIhRPl_uJlwnTyTGCcDJTJltYwTE2nV9p5nkcg",
    },
    {
      name: "The Weekender",
      subtitle: "Full Grain Duffle",
      price: 325.0,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBySw9VH6oH_IL-JJqsE0ldUXhZUD_HgwQFAd8QxG8PgQr8SFbP03lWxSL1kEvBTUR7DjA-msFEIC6lFj0VZpu-EJqseZNnkmMkNTq5TP16HbTzaVU4Ck4JgzshGGjj5XTCDpUhgYHnRBblnMxqe7f1SmOV9wOLOvia2uNVcUv_U6oBU2hjCiG8z4LJ7O95N7LCPWa31Qn343O8hRh_FPvcKTy2B4WqOZsSHrGfkmhmAMVcurGO3iSy_BYOrathM3heCnTzDhV_XgzK",
      bestseller: true,
    },
    {
      name: "Oxford Satchel",
      subtitle: "Vegetable Tanned",
      price: 185.0,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDcztn-DIb409yBENwQGfa97o6zndn704ksw5vN5qNjcx-0TT1cfwcXQUvif2-ujiqSvbnlFlbqn9jZgYIujWIG-o9Ue_3FiIpsCzgBzAMmq467lMWT_ffGvpbvFkwdnpWfQVXZSaDkVfjUesLb_Yb5QzqpcoyHITHMhFGbbTZYZSRTlYlh8Q2ZZ1yegwr8aX1xsEbevvFLTSRNrgseY-JfeRBNGx5FhJ9-0pKz6fpBUYR9LjB1xQQnzLzoF-cIynkUqQxn2o8jMRRp",
    },
    {
      name: "Classic Belt",
      subtitle: "Everyday Essential",
      price: 85.0,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD5cZTztdGLR9vaaDcAYl88Cx0fdr3ICTWmgA54VFETYCWYw5px9BkE_DT5D6QwE9IVI9n0BNCFTOaBSmL8il8fPGMkPySQyY8Bn0Kp1WRogOHOWGbOK-DPlO8KOmPt2IWYJbRUr_nXVF8CsjPIc7F0HvJ36izEzZGyik3ivEWouaKJhcs0r7lpaUp2gRDGurmUsviVIYcmjgwJ60dwwo1M5aoQDjAjGfc63v__GTDwd3-ddRkIpPSNuvGsH50wzhInNWuO9xLRAEo6",
    },
  ];

  const testimonials = [
    {
      name: "James Caldwell",
      role: "Verified Buyer",
      rating: 5,
      text: "The craftsmanship is honestly unlike anything I've seen before. The leather smells incredible right out of the box and has aged beautifully over the last 6 months.",
    },
    {
      name: "Sarah Jenkins",
      role: "Verified Buyer",
      rating: 5,
      text: "I ordered a custom jacket for my husband's birthday. The team was so helpful with measurements. It fits him like a glove. Truly a luxury experience.",
    },
    {
      name: "Michael Ross",
      role: "Verified Buyer",
      rating: 4,
      text: "Finally found a bag that looks professional but can take a beating during my commute. The Weekender is sturdy, stylish, and gets compliments everywhere.",
    },
  ];

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
                Featured Collections
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-3xl mx-auto text-lg leading-relaxed">
                Timeless pieces crafted with precision and care. Discover our
                most sought-after leather goods.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              {products.map((product, index) => (
                <Link key={index} href="/shop" className="group relative block">
                  <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-100 relative mb-4">
                    <div
                      className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url('${product.image}')` }}
                    ></div>
                    {product.bestseller && (
                      <div className="absolute top-4 left-4 bg-[#d41132] text-white text-xs font-bold px-2 py-1 rounded">
                        BESTSELLER
                      </div>
                    )}
                    <span className="absolute bottom-4 right-4 bg-white text-black p-3 rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 group-hover:bg-[#d41132] group-hover:text-white">
                      <span className="material-symbols-outlined text-[20px] block">shopping_bag</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-[#1A1A1A] dark:text-white">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {product.subtitle}
                    </p>
                    <p className="font-bold text-[#d41132] mt-2">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-6 max-w-[1440px] mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-[#1A1A1A] dark:text-white text-center mb-12">
            Stories from our Customers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
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
                  "{testimonial.text}"
                </p>
                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/10">
                  <p className="font-bold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
