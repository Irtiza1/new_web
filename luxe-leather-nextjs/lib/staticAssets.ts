export const STATIC_ASSET_DEFAULTS = {
    home_hero_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD663YQ9A3yCTD5ey9kXXjD2nNHR8t7_sLSr9pizcD4Ai5LZfqqKiZz8zyYNLGjhITo-Z05zCLpeLUJwAbqCICLNGO_KilvL65Qu-FKP5cmYRl4JBFK7k-3CzTHAzUTXnx21a6yXnPEDhsFh8I1xbgex4o4t8SYYq9qpJraotJZhmiRNI_bnKTgiLqMPpnV3CxPjLoWJ6ma68eRBMqoaUlXn2Zy2B_fQo09l7vqGPJwsnOPAHIsSj7-eSGjKyVbu7bHY_I5SD-QBRgT',
    login_hero_image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1600&auto=format&fit=crop',
    signup_hero_image: 'https://images.unsplash.com/photo-1511401139252-f158d3209c17?q=80&w=1200&auto=format&fit=crop',
    shipping_hero_image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2000&auto=format&fit=crop',
    bespoke_hero_image: '/images/custom_orders_hero.png',
    product_fallback_image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2000&auto=format&fit=crop',
    featured_product_fallback_image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5',
    story_sourcing_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjtiaK7tCTCU__1xs3wJGwKj_sMvqRg5QZYSoAKgVnyyZYQDJUGSucijpU1yyJALdEXJ7LFMZxc2qlRAIVeNwx93vd6hfH3ngg55FVqEOxqIRYDOgmWFmcDroHpKwbMWhvmi_la6X-edUHtAktxcPLP9RJictqlMGiNgbnhVC73l1Kt_SXE_4OOLfRt0BXZ1Jwuf05bGRKxqUd7zaiZ7Q-koaaH0UOdd6ektH4dnSQrs8cPllyn2adV5uqsg9jcKUlyD2I_HG-aoWO',
    story_stitching_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZ97uyqtye-GSN8F2Pz2jDdqjmslLzFGyDwwSjfkudpcoOLU1-PekxtHsWGH0i5anHveMKBT_l4_PbbRGBsQCzxEFNebh2IvS1aMJDKoh6O7nTstC2oGPNIwSOHg2cndlCT5WKyaGfVJiArEWlepP7ymRquuMNh64-bhDEyeOx3DuytNJwOGylxdCFyHMCWjzzZ6rvRgPSkzRXdsAWEZJgVypM2_1xaVXwC627bhfsExrf6Co2K8E1VbozKW86D-hp-SmwtMz5Qw5G',
    story_founder_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMX4majIUk6fUlkseIJ8dgepBwt1zoDRR8OUtr63kTKy2q_oXahzNMXxmI539AsaC0PRuOlqq4_b4Dk4ekhBzR9E3Eu6HOspyESOTi_01GLyUK-JfL2hxQPtwehuc0HkD_UfcOrETWU4TF1HPb3bz-buzYGEwJ-iMx9uhFfSNw5tqEJn6MFIX2Szic6c91RJKNPoPl4bFf8h7VcObDIJh4sC0kzQYcVsXGph6r0Le84ob5uW9VyrCY-azd_nlBkYU1WkuCuvOHePPE',
    story_cta_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGzSV6bS6T4fzxyUkVEXsY1l6Kbaukv26zjCOdbUURssex3g3-smR2f72179m_GDb5vtxMXKyWSFs9b1IcZnh5tkk7h7SiaCXYXS98BVtbJ0CR8b6jVTXRG-cRlIbTtPWvF6c-2MUwqpa4UrNr5v1EXAZlaFwLmn3bMMcXxRqgy1GALj0TSNl_-TyAoultuGKeVTim-VWlSjf_9QlzNVtox_qtzP382Q1Q9G21Fkf-TFCf1XTTsyQrCkH4hIIDqXRGttrYV8774Wg2',
} as const;

export type StaticAssetKey = keyof typeof STATIC_ASSET_DEFAULTS;

export function staticAsset(settings: Record<string, string>, key: StaticAssetKey): string {
    return settings[key] || STATIC_ASSET_DEFAULTS[key];
}
