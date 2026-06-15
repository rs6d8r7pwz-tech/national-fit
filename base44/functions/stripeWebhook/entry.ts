import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14';

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const planFromSubscription = (subscription) => {
  const interval = subscription?.items?.data?.[0]?.price?.recurring?.interval;
  return interval === 'year' ? 'yearly' : 'monthly';
};

const expiryForPlan = (plan) => addDays(plan === 'yearly' ? 365 : 30);

const findProfile = async (base44, { userId, userEmail, customerId }) => {
  if (userId) {
    const byUserId = await base44.asServiceRole.entities.UserProfile.filter({ created_by_id: userId });
    if (byUserId?.length > 0) return byUserId[0];
  }

  if (customerId) {
    const byCustomer = await base44.asServiceRole.entities.UserProfile.filter({ stripe_customer_id: customerId });
    if (byCustomer?.length > 0) return byCustomer[0];
  }

  if (userEmail) {
    const byEmail = await base44.asServiceRole.entities.UserProfile.filter({ created_by: userEmail });
    if (byEmail?.length > 0) return byEmail[0];
  }

  return null;
};

const activatePremium = async (base44, profile, { plan, customerId, expiresAt }) => {
  await base44.asServiceRole.entities.UserProfile.update(profile.id, {
    is_premium: true,
    subscription_status: 'premium',
    subscription_plan: plan,
    stripe_customer_id: customerId,
    subscription_end_date: expiresAt,
    premium_expires_at: expiresAt,
    premium_source: 'stripe',
  });
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      const userEmail = session.metadata?.user_email;
      const plan = session.metadata?.plan;
      const customerId = session.customer;

      if ((userId || userEmail) && plan) {
        const profile = await findProfile(base44, { userId, userEmail, customerId });
        if (profile) {
          await activatePremium(base44, profile, {
            plan,
            customerId,
            expiresAt: expiryForPlan(plan),
          });
          console.log(`✅ Premium activé: ${userEmail || userId} → ${plan}`);
        } else {
          console.warn(`⚠️ Profil non trouvé pour: ${userEmail || userId}`);
        }
      }
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      const subscriptionId = invoice.subscription;
      const profile = await findProfile(base44, { customerId });

      if (profile && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const plan = planFromSubscription(subscription);
        await activatePremium(base44, profile, {
          plan,
          customerId,
          expiresAt: expiryForPlan(plan),
        });
        console.log(`♻️ Premium renouvelé pour customer: ${customerId} → ${plan}`);
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const status = subscription.status;
      const profile = await findProfile(base44, { customerId });

      if (profile) {
        const isActive = status === 'active' || status === 'trialing';
        if (isActive) {
          const plan = planFromSubscription(subscription);
          await activatePremium(base44, profile, {
            plan,
            customerId,
            expiresAt: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : expiryForPlan(plan),
          });
        } else {
          await base44.asServiceRole.entities.UserProfile.update(profile.id, {
            is_premium: false,
            subscription_status: 'free',
            subscription_plan: null,
            premium_source: null,
          });
        }
        console.log(`🔄 Abonnement mis à jour pour customer: ${customerId} → ${status}`);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const profile = await findProfile(base44, { customerId });

      if (profile) {
        await base44.asServiceRole.entities.UserProfile.update(profile.id, {
          is_premium: false,
          subscription_status: 'free',
          subscription_plan: null,
          premium_source: null,
        });
        console.log(`❌ Abonnement annulé pour customer: ${customerId}`);
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err.message);
  }

  return Response.json({ received: true });
});