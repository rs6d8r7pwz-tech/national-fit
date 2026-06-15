import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const dryRun = payload?.dryRun === true;
    const now = new Date();

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ subscription_status: 'premium' }, '-updated_date', 500);
    const expiredProfiles = profiles.filter((profile) => {
      const expiresAt = profile.premium_expires_at || profile.subscription_end_date || profile.trial_ends_at;
      return expiresAt && new Date(expiresAt) <= now;
    });

    if (!dryRun) {
      for (const profile of expiredProfiles) {
        await base44.asServiceRole.entities.UserProfile.update(profile.id, {
          is_premium: false,
          subscription_status: 'free',
          subscription_plan: null,
          premium_source: null,
        });
      }
    }

    return Response.json({ success: true, expired: expiredProfiles.length, dryRun });
  } catch (error) {
    console.error('Premium expiration error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});