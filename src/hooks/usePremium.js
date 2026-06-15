import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function usePremium() {
  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
    initialData: [],
  });

  const profile = profiles?.[0];
  const expiresAt = profile?.premium_expires_at || profile?.subscription_end_date || profile?.trial_ends_at;
  const isNotExpired = !expiresAt || new Date(expiresAt) > new Date();
  const isPremium = (profile?.is_premium === true || profile?.subscription_status === 'premium') && isNotExpired;

  return { isPremium, profile };
}