import { SupabaseClient, User } from '@supabase/supabase-js';

export async function upsertProfileForUser(
  supabase: SupabaseClient,
  user: User
) {
  const { full_name, role } = user.user_metadata ?? {};

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        full_name: full_name ?? null,
        role: (role as string) ?? 'general',
      },
      { onConflict: 'id' }
    );

  if (error) {
    console.error('Failed to upsert profile', error);
  }
}

export async function fetchUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<{ full_name: string | null; role: string } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Failed to fetch profile', error);
    return null;
  }

  return data;
}

export function getDisplayName(
  user: User | null,
  profile: { full_name: string | null; role: string } | null
): string | null {
  if (!user) return null;
  
  if (profile?.full_name) return profile.full_name;
  if (user.user_metadata?.full_name) return user.user_metadata.full_name;
  return user.email ?? null;
}

export function getUserRole(
  user: User | null,
  profile: { full_name: string | null; role: string } | null
): string {
  if (profile?.role) return profile.role;
  if (user?.user_metadata?.role) return user.user_metadata.role;
  return 'general';
}

