import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    // This is a scheduled/service function — no user auth needed
    const base44 = createClientFromRequest(req);

    // Get all profiles inactive for 7+ days
    const profiles = await base44.asServiceRole.entities.UserProfile.list('-updated_date', 500);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const inactiveProfiles = profiles.filter(p => {
      if (!p.last_workout_date) return false;
      const lastDate = new Date(p.last_workout_date);
      return lastDate < sevenDaysAgo;
    });

    console.log(`${inactiveProfiles.length} utilisateurs inactifs trouvés`);

    let sent = 0;
    for (const profile of inactiveProfiles.slice(0, 50)) {
      // Get user email from User entity
      const users = await base44.asServiceRole.entities.User.filter({ id: profile.created_by_id });
      const user = users?.[0];
      if (!user?.email) continue;

      const daysSince = Math.floor((new Date() - new Date(profile.last_workout_date)) / 86400000);
      const firstName = profile.first_name || 'Champion';
      const streak = profile.streak_days || 0;

      const subject = streak > 0
        ? `🔥 ${firstName}, ton streak de ${streak} jours est en danger !`
        : `💪 ${firstName}, ça fait ${daysSince} jours... C'est le moment de revenir !`;

      const body = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:Inter,sans-serif;">
  <div style="max-width:540px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(135deg,#ea580c,#dc2626);border-radius:20px;padding:36px 32px;text-align:center;margin-bottom:20px;">
      <span style="font-size:48px;">${streak > 0 ? '🔥' : '💪'}</span>
      <h1 style="color:white;font-size:24px;font-weight:900;margin:12px 0 8px;">${streak > 0 ? `TON STREAK EST EN DANGER !` : `REVIENS DANS L'ARÈNE !`}</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">Tu manques à ton programme, ${firstName}</p>
    </div>

    <div style="background:white;border-radius:20px;padding:28px;margin-bottom:16px;box-shadow:0 4px 20px rgba(30,80,220,0.08);">
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
        ${streak > 0
          ? `Tu as un streak de <strong style="color:#ea580c;">${streak} jours</strong> qui risque de tomber ! Il te reste encore un peu de temps pour le sauvegarder.`
          : `Ça fait <strong>${daysSince} jours</strong> que tu n'as pas fait de séance. Ton corps attend ! Chaque jour de pause rend le retour plus difficile.`
        }
      </p>
      <a href="https://nationalfit.app" style="display:block;background:linear-gradient(135deg,#ea580c,#dc2626);color:white;text-align:center;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
        ${streak > 0 ? '🔥 Sauver mon streak maintenant' : '💪 Reprendre l\'entraînement'}
      </a>
    </div>

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:16px;padding:20px;margin-bottom:16px;">
      <p style="color:#c2410c;font-weight:700;font-size:14px;margin:0 0 8px;">💡 Pour te remotiver :</p>
      <ul style="color:#92400e;font-size:13px;line-height:1.8;margin:0;padding-left:16px;">
        <li>Démarre avec une séance courte (20 min)</li>
        <li>Consulte tes statistiques de progression</li>
        <li>Regarde tes records personnels</li>
      </ul>
    </div>

    <p style="text-align:center;color:#94a3b8;font-size:12px;">National Fit · <a href="https://nationalfit.app/parametres" style="color:#94a3b8;">Se désabonner</a></p>
  </div>
</body>
</html>`;

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({ to: user.email, subject, body });
        sent++;
      } catch (e) {
        console.error(`Erreur email pour ${user.email}:`, e.message);
      }
    }

    return Response.json({ success: true, sent, total: inactiveProfiles.length });
  } catch (error) {
    console.error('Erreur sendReactivationEmail:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});