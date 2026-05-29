import { supabaseAdmin } from '../supabase';

export type UserProfile = {
  user_id: string;
  full_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  bio?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

type ServerSession = {
  user?: {
    id?: string;
  };
};

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserProfile | null;
}

export async function upsertUserProfile(profile: UserProfile): Promise<UserProfile> {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .upsert(profile)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as UserProfile;
}

export async function createUserProfileIfMissing(userId: string, defaults: Partial<UserProfile> = {}): Promise<UserProfile> {
  const existing = await getUserProfile(userId);
  if (existing) return existing;

  const payload: UserProfile = {
    user_id: userId,
    display_name: defaults.display_name ?? null,
    full_name: defaults.full_name ?? null,
    avatar_url: defaults.avatar_url ?? null,
    phone: defaults.phone ?? null,
    bio: defaults.bio ?? null,
    metadata: defaults.metadata ?? {},
  };

  return await upsertUserProfile(payload);
}

export async function updateUserProfile(userId: string, patch: Partial<UserProfile>): Promise<UserProfile> {
  const safePatch: Partial<UserProfile> = {};

  if ('full_name' in patch) safePatch.full_name = patch.full_name;
  if ('display_name' in patch) safePatch.display_name = patch.display_name;
  if ('avatar_url' in patch) safePatch.avatar_url = patch.avatar_url;
  if ('phone' in patch) safePatch.phone = patch.phone;
  if ('bio' in patch) safePatch.bio = patch.bio;
  if ('metadata' in patch) safePatch.metadata = patch.metadata;

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .update(safePatch)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as UserProfile;
}

export async function getOwnProfile(serverSession?: ServerSession): Promise<UserProfile | null> {
  // Helper for server routes that have a session with user.id
  const userId = serverSession?.user?.id;
  if (!userId) return null;
  return getUserProfile(userId);
}
