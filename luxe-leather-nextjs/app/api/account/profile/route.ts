import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth/server';
import { apiHandler } from '@/lib/middleware/apiHandler';
import {
    createUserProfileIfMissing,
    updateUserProfile,
    type UserProfile,
} from '@/lib/services/userProfileService';

export const dynamic = 'force-dynamic';

const nullableText = (max: number) => z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional();

const profileUpdateSchema = z.object({
    full_name: nullableText(120),
    display_name: nullableText(80),
    avatar_url: nullableText(500),
    phone: nullableText(40),
    bio: nullableText(500),
    metadata: z.record(z.string(), z.unknown()).optional(),
}).strict();

function fallbackDisplayName(email?: string): string {
    return email?.split('@')[0] || 'Luxe customer';
}

function normalizeText(value: string | null | undefined): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return value.trim() || null;
}

function normalizePatch(data: z.infer<typeof profileUpdateSchema>): Partial<UserProfile> {
    return {
        ...(data.full_name !== undefined && { full_name: normalizeText(data.full_name) }),
        ...(data.display_name !== undefined && { display_name: normalizeText(data.display_name) }),
        ...(data.avatar_url !== undefined && { avatar_url: normalizeText(data.avatar_url) }),
        ...(data.phone !== undefined && { phone: normalizeText(data.phone) }),
        ...(data.bio !== undefined && { bio: normalizeText(data.bio) }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
    };
}

export const GET = apiHandler(async (req: NextRequest) => {
    const user = await getAuthUser(req);
    if (!user || typeof user === 'string') {
        throw new Response('Unauthorized', { status: 401 });
    }

    const profile = await createUserProfileIfMissing(user.id, {
        display_name: fallbackDisplayName(user.email),
    });

    return NextResponse.json({
        success: true,
        data: profile,
    });
});

export const PUT = apiHandler(async (req: NextRequest) => {
    const user = await getAuthUser(req);
    if (!user || typeof user === 'string') {
        throw new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const patch = normalizePatch(profileUpdateSchema.parse(body));

    await createUserProfileIfMissing(user.id, {
        display_name: fallbackDisplayName(user.email),
    });

    const profile = await updateUserProfile(user.id, patch);

    return NextResponse.json({
        success: true,
        data: profile,
        message: 'Profile updated successfully',
    });
});
