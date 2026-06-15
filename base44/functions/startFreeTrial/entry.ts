import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const profiles = await base44.entities.UserProfile.list();
    const profile = profiles?.[0];

    if (!profile) {
      return Response.json({ error: 'Profil introuvable' }, { status: 404 });
    }

    if (profile.trial_started_at) {
      return Response.json({ error: 'Essai gratuit déjà utilisé' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const expiresAt = addDays(7);

    await base44.entities.UserProfile.update(profile.id, {
      is_premium: true,
      subscription_status: 'premium',
      subscription_plan: 'trial',
      subscription_end_date: expiresAt,
      premium_expires_at: expiresAt,
      premium_source: 'trial',
      trial_started_at: now,
      trial_ends_at: expiresAt,
    });

    return Response.json({ success: true, expiresAt });
  } catch (error) {
    console.error('Free trial error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});