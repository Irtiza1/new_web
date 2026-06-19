'use client';

import { useEffect } from 'react';
import { authClient, setAuthCookie, clearAuthCookie } from '@/lib/auth/client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Automatically sync the Supabase session token to the browser cookie
        // whenever the token is refreshed or the auth state changes.
        const { data: { subscription } } = authClient.auth.onAuthStateChange((event, session) => {
            if (session?.access_token) {
                setAuthCookie(session.access_token);
            } else if (event === 'SIGNED_OUT') {
                clearAuthCookie();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return <>{children}</>;
}
