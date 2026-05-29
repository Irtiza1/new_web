import { supabase } from '@/lib/supabase';

const ACCESS_COOKIE = 'sb-access-token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function setAuthCookie(accessToken: string) {
    document.cookie = `${ACCESS_COOKIE}=${encodeURIComponent(accessToken)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearAuthCookie() {
    document.cookie = `${ACCESS_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export async function syncAuthCookieFromSession() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (token) {
        setAuthCookie(token);
    } else {
        clearAuthCookie();
    }
}

function oauthRedirectUrl(redirectTo: string) {
    const origin = window.location.origin;
    return `${origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;
}

export async function signInWithGoogle(redirectTo = '/account') {
    return supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: oauthRedirectUrl(redirectTo),
            queryParams: {
                access_type: 'offline',
                prompt: 'select_account',
            },
        },
    });
}

export { supabase as authClient };
