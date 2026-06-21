import { contentService } from '@/lib/services/contentService';
import { getShippingRates } from '@/lib/services/shippingService';
import { getSizeGuides } from '@/lib/services/sizeService';
import { getAll as getSettings } from '@/lib/services/settingsService';
import { staticAsset } from '@/lib/staticAssets';
import SizeGuideSection from './SizeGuideSection';

export const revalidate = 60; // revalidate every minute

export default async function ShippingPage() {
    const keys = ['shipping_hero_title', 'shipping_hero_subtitle'];
    const cmsContent: Record<string, string> = {};
    
    // Fetch CMS Content
    await Promise.all(keys.map(async (key) => {
        cmsContent[key] = await contentService.getBySlug(key);
    }));

    // Fetch Settings
    const settings = await getSettings();
    
    const heroImage = staticAsset(settings, 'shipping_hero_image');

    // Fetch Data
    const [shippingRates, sizeChart] = await Promise.all([
        getShippingRates(),
        getSizeGuides()
    ]);

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] text-[#1b0e10] dark:text-white antialiased font-[family-name:var(--font-manrope)]">
            {/* Hero Section */}
            <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url('${heroImage}')` }}
                >
                    <div className="absolute inset-0 bg-black/40"></div>
                </div>
                {/* Content */}
                <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto flex flex-col items-center gap-6">
                    <span className="text-[#cf1736] text-xs font-bold uppercase tracking-[0.4em] mb-2 block">Concierge & Logistics</span>
                    <h1 className="text-5xl md:text-7xl font-medium tracking-tight leading-[1.1]">
                        {cmsContent.shipping_hero_title || "Fitting & Shipping"}
                    </h1>
                    <p className="text-lg md:text-xl font-medium text-white/90 leading-relaxed">
                        {cmsContent.shipping_hero_subtitle || "Ensuring the perfect acquisition of your next legacy piece. From precise measurements to insured global delivery, every detail is managed with artisan care."}
                    </p>
                </div>
            </div>

            <main className="flex-1 py-20 px-4">
                <div className="max-w-[1440px] mx-auto">
                    {/* Sizing Guide */}
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <span className="material-symbols-outlined text-[#cf1736] text-3xl">straighten</span>
                                <h2 className="text-4xl font-medium text-[#1b0e10] dark:text-white tracking-tight">The Perfect Fit</h2>
                            </div>
                            <p className="text-[#1b0e10]/80 dark:text-gray-400 leading-relaxed text-lg mb-10 font-medium">
                                A piece should feel like a second skin. Use our master guide below to determine your ideal size, or choose <strong className="text-[#cf1736]">Custom Order</strong> for a tailored commission.
                            </p>

                            <div className="space-y-8">
                                {[
                                    { title: 'Chest Measurement', desc: 'Measure around the fullest part of your chest, keeping the tape level under your arms.' },
                                    { title: 'Shoulder Width', desc: 'From the outer edge of one shoulder to the outer edge of the other, across the backbone.' },
                                    { title: 'Desired Length', desc: 'From the highest point of the shoulder down to your preferred waistline or hip.' },
                                ].map((tip, i) => (
                                    <div key={i} className="flex gap-6 items-start group">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[#cf1736] font-bold text-sm shrink-0 group-hover:bg-[#cf1736] group-hover:text-white transition-all shadow-sm">0{i + 1}</div>
                                        <div>
                                            <h4 className="font-medium text-[#1b0e10] dark:text-white text-lg tracking-tight mb-1">{tip.title}</h4>
                                            <p className="text-sm text-[#1b0e10]/60 dark:text-gray-400 leading-relaxed font-medium italic">"{tip.desc}"</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Size Guide Section */}
                        <SizeGuideSection sizeChart={sizeChart} />
                    </section>
                </div>
            </main>
        </div>
    );
}
