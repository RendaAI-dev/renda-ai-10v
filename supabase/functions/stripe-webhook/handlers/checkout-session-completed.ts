import type { SubscriptionData } from "../types.ts";

export async function handleCheckoutSessionCompleted(
  event: any,
  stripe: any,
  supabase: any
): Promise<void> {
  console.log("Processing checkout session completed:", event.id);
  
  const session = event.data.object;
  const authUserId = session.metadata?.user_id;

  if (!authUserId) {
    console.error("No user ID in metadata", { sessionId: session.id });
    throw new Error("No user ID in metadata");
  }
  
  // Get the poupeja_users ID from the auth user ID
  const { data: poupejaUser, error: userError } = await supabase
    .from('poupeja_users')
    .select('id')
    .eq('id', authUserId) // poupeja_users.id = auth.users.id
    .single();
    
  if (userError || !poupejaUser) {
    console.error("Failed to find poupeja user", { authUserId, error: userError });
    throw new Error(`User not found in poupeja_users table: ${userError?.message || 'Unknown error'}`);
  }
  
  const userId = poupejaUser.id;
  console.log("Processing subscription for verified user");

  // Check for existing active subscription before processing the new one
  const { data: existingSubscriptions } = await supabase
    .from('poupeja_subscriptions')
    .select('stripe_subscription_id, status')
    .eq('user_id', userId)
    .neq('stripe_subscription_id', session.subscription);

  if (existingSubscriptions && existingSubscriptions.length > 0) {
    console.log(`Found ${existingSubscriptions.length} existing subscriptions for user ${userId}`);
    
    // Cancel old subscriptions in Stripe
    for (const oldSub of existingSubscriptions) {
      if (oldSub.status === 'active') {
        try {
          await stripe.subscriptions.cancel(oldSub.stripe_subscription_id);
          console.log(`Canceled old subscription in Stripe: ${oldSub.stripe_subscription_id}`);
          
          // Update status in database
          await supabase
            .from('poupeja_subscriptions')
            .update({ status: 'canceled', cancel_at_period_end: false })
            .eq('stripe_subscription_id', oldSub.stripe_subscription_id);
        } catch (cancelError) {
          console.error(`Failed to cancel old subscription ${oldSub.stripe_subscription_id}:`, cancelError);
          // Don't throw here, continue with new subscription creation
        }
      }
    }
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  
  // Map the new price IDs to plan types using the edge function config
  const priceId = subscription.items.data[0].price.id;
  let planType;
  
  try {
    // Fetch plan configurations from database directly
    const { data: planConfigData } = await supabase
      .from('poupeja_settings')
      .select('value')
      .eq('key', 'plan_config')
      .single();
    
    if (planConfigData?.value) {
      const planConfig = JSON.parse(planConfigData.value);
      if (priceId === planConfig.prices?.monthly?.priceId) {
        planType = "monthly";
      } else if (priceId === planConfig.prices?.annual?.priceId) {
        planType = "annual";
      } else {
        console.warn(`Unknown price ID: ${priceId}. Using interval fallback.`);
        planType = subscription.items.data[0].price.recurring?.interval === 'year' ? "annual" : "monthly";
      }
    } else {
      // Fallback to interval detection
      planType = subscription.items.data[0].price.recurring?.interval === 'year' ? "annual" : "monthly";
    }
  } catch (error) {
    console.error('Error fetching plan config, using interval fallback:', error);
    // Check interval as final fallback
    planType = subscription.items.data[0].price.recurring?.interval === 'year' ? "annual" : "monthly";
  }

  console.log(`Processing subscription for price ID: ${priceId}, plan type: ${planType}`);
  console.log(`Subscription status from Stripe: ${subscription.status}`);

  // Use actual subscription status from Stripe instead of assuming "active"
  const subscriptionStatus = subscription.status; // This could be: incomplete, incomplete_expired, trialing, active, past_due, canceled, or unpaid

  // Delete any existing subscriptions for this user before inserting the new one
  await supabase
    .from("poupeja_subscriptions")
    .delete()
    .eq('user_id', userId);

  // Insert the new subscription
  const { error: insertError } = await supabase.from("poupeja_subscriptions").insert({
    user_id: userId,
    stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription,
    status: subscriptionStatus, // Use actual status from Stripe
    plan_type: planType,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end
  });

  if (insertError) {
    console.error("Failed to insert subscription:", insertError);
    throw new Error(`Failed to create subscription record: ${insertError.message}`);
  }

  console.log(`Subscription created/updated with plan ${planType} and status ${subscriptionStatus}`);
}