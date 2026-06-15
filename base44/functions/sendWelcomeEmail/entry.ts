import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, firstName } = await req.json();

    if (!email) return Response.json({ error: 'Email requis' }, { status: 400 });

    const subject = `🏋️ Bienvenue sur National Fit, ${firstName || 'Champion'} !`;
    const body = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:Inter,sans-serif;">
  <div style="max-width:540px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(135deg,#1e50dc,#dc2626);border-radius:20px;padding:40px 32px;text-align:center;margin-bottom:24px;">
      <div style="background:rgba(255,255,255,0.2);border-radius:16px;width:64px;height:64px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:32px;font-weight:900;color:white;font-family:serif;">N</span>
      </div>
      <h1 style="color:white;font-size:28px;font-weight:900;margin:0 0 8px;letter-spacing:2px;">NATIONAL FIT</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">Ton coach sportif IA personnel</p>
    </div>

    <div style="background:white;border-radius:20px;padding:32px;margin-bottom:16px;box-shadow:0 4px 20px rgba(30,80,220,0.08);">
      <h2 style="color:#1e3a8a;font-size:22px;font-weight:800;margin:0 0 12px;">Bienvenue, ${firstName || 'Champion'} ! 🎉</h2>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Tu viens de rejoindre la communauté National Fit. Ton coach IA est prêt à t'accompagner vers tes objectifs.
      </p>

      <div style="background:#f0f4ff;border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="color:#1e3a8a;font-weight:700;font-size:14px;margin:0 0 12px;">🚀 Pour commencer :</p>
        <ol style="color:#475569;font-size:14px;line-height:1.8;margin:0;padding-left:20px;">
          <li>Complète ton profil avec tes mensurations</li>
          <li>Génère ton premier programme personnalisé</li>
          <li>Lance ta première séance guidée</li>
        </ol>
      </div>

      <a href="https://nationalfit.app" style="display:block;background:linear-gradient(135deg,#1e50dc,#1d4ed8);color:white;text-align:center;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;margin-bottom:12px;">
        🏋️ Accéder à l'app
      </a>
    </div>

    <div style="background:white;border-radius:20px;padding:24px;margin-bottom:16px;">
      <p style="color:#1e3a8a;font-weight:700;font-size:14px;margin:0 0 12px;">💪 Ce qui t'attend :</p>
      <div style="display:grid;gap:8px;">
        ${[
          ['🤖', 'Programmes IA ultra-personnalisés'],
          ['🥗', 'Plans alimentaires adaptés à tes objectifs'],
          ['📊', 'Suivi de ta progression en temps réel'],
          ['🔥', 'Streak et gamification pour rester motivé'],
        ].map(([icon, text]) => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#f8fafc;border-radius:8px;">
            <span style="font-size:18px;">${icon}</span>
            <span style="color:#475569;font-size:13px;">${text}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <p style="text-align:center;color:#94a3b8;font-size:12px;">National Fit · Coach IA Personnel<br/>Tu reçois cet email car tu viens de t'inscrire.</p>
  </div>
</body>
</html>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject,
      body,
    });

    console.log(`Email de bienvenue envoyé à ${email}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Erreur sendWelcomeEmail:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});