import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14';

const PRICE_IDS = {
  monthly: 'price_1TbRGbJINEbRzgPciMHqE1rw',
  yearly: 'price_1TbRGfJINEbRzgPcfomTwhK0',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { plan, successUrl, cancelUrl } = await req.json();

    if (!plan || !PRICE_IDS[plan]) {
      return Response.json({ error: 'Plan invalide. Choisir: monthly ou yearly' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Chercher ou créer un customer Stripe
    const profiles = await base44.entities.UserProfile.list();
    const profile = profiles?.[0];
    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name || user.email,
        metadata: { base44_user_id: user.id, base44_user_email: user.email },
      });
      customerId = customer.id;
      // Sauvegarder immédiatement le customer ID
      if (profile) {
        await base44.entities.UserProfile.update(profile.id, { stripe_customer_id: customerId });
      }
    }

    const metadata = {
      base44_app_id: Deno.env.get('BASE44_APP_ID'),
      user_id: user.id,
      user_email: user.email,
      plan,
    };

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      success_url: successUrl || `${req.headers.get('origin')}/parametres?success=1`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/pricing?canceled=1`,
      metadata,
      subscription_data: { metadata },
    });

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});