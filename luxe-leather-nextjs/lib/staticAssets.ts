export const STATIC_ASSET_DEFAULTS = {
    home_hero_image: '',
    login_hero_image: '',
    signup_hero_image: '',
    shipping_hero_image: '',
    bespoke_hero_image: '',
    product_fallback_image: '',
    featured_product_fallback_image: '',
    story_sourcing_image: '',
    story_stitching_image: '',
    story_founder_image: '',
    story_cta_image: '',
} as const;

export type StaticAssetKey = keyof typeof STATIC_ASSET_DEFAULTS;

export function staticAsset(settings: Record<string, string>, key: StaticAssetKey): string {
    return settings[key] || STATIC_ASSET_DEFAULTS[key];
}
