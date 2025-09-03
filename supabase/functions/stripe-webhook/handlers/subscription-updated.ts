import type { SubscriptionData } from "../types.ts";

export async function handleSubscriptionUpdated(
  event: any,
  stripe: any,
  supabase: any
): Promise<void> {
  const subscription = event.data.object;
  console.log("Processing subscription update:", JSON.stringify(subscription));
  
  try {
    // First, find the user_id using subscription or customer metadata
    let userId = subscription.metadata?.user_id;
    
    if (!userId) {
      // If not in subscription metadata, check customer
      const customer = await stripe.customers.retrieve(subscription.customer);
      userId = customer.metadata?.user_id;
    }
    
    if (!userId) {
      // Last resort: search the table by stripe_subscription_id
      const { data: existingSubscription } = await supabase
        .from("poupeja_subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", subscription.id)
        .single();
      
      userId = existingSubscription?.user_id;
    }
    
    if (!userId) {
      console.error(`No user_id found for subscription ${subscription.id}`);
      return;
    }
    
    // Verify the user exists in poupeja_users table and get the correct ID
    const { data: poupejaUser, error: userError } = await supabase
      .from('poupeja_users')
      .select('id')
      .eq('id', userId) // poupeja_users.id = auth.users.id
      .single();
      
    if (userError || !poupejaUser) {
      console.error(`User not found in poupeja_users table for userId: ${userId}`, { error: userError });
      return;
    }
    
    const verifiedUserId = poupejaUser.id;
    console.log(`Found and verified user for subscription ${subscription.id}`);
    
    // Prepare update/insert data
    const subscriptionData: any = {
      user_id: verifiedUserId, // Use verified user ID
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end
    };
    
    // Add timestamps from subscription object directly
    if (subscription.current_period_start) {
      subscriptionData.current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
      console.log(`Setting current_period_start: ${subscriptionData.current_period_start}`);
    }
    
    if (subscription.current_period_end) {
      subscriptionData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
      console.log(`Setting current_period_end: ${subscriptionData.current_period_end}`);
    }
    
    // Add logic to update plan_type based on price
    if (subscription.items && subscription.items.data && subscription.items.data.length > 0) {
      const priceId = subscription.items.data[0].price.id;
      const interval = subscription.items.data[0].price.recurring?.interval;
      
      console.log(`[SUBSCRIPTION-UPDATED] Price details:`, {
        priceId,
        interval,
        recurring: subscription.items.data[0].price.recurring
      });
      
      // Try to get plan_type from settings first
      let planType;
      try {
        const { data: planConfigData } = await supabase
          .from('poupeja_settings')
          .select('value')
          .eq('key', 'plan_config')
          .single();
        
        if (planConfigData?.value) {
          const planConfig = JSON.parse(planConfigData.value);
          console.log(`[SUBSCRIPTION-UPDATED] Plan config from DB:`, planConfig);
          
          if (priceId === planConfig.prices?.monthly?.priceId) {
            planType = "monthly";
          } else if (priceId === planConfig.prices?.annual?.priceId) {
            planType = "annual";
          } else {
            console.warn(`[SUBSCRIPTION-UPDATED] Unknown price ID: ${priceId}. Using interval fallback.`);
            planType = interval === 'year' ? "annual" : "monthly";
          }
        } else {
          // Fallback to interval detection
          planType = interval === 'year' ? "annual" : "monthly";
        }
      } catch (error) {
        console.error('[SUBSCRIPTION-UPDATED] Error fetching plan config, using interval fallback:', error);
        planType = interval === 'year' ? "annual" : "monthly";
      }
      
      console.log(`[SUBSCRIPTION-UPDATED] Final plan type determined: ${planType} for price ${priceId} with interval ${interval}`);
      
      if (planType) {
        subscriptionData.plan_type = planType;
        console.log(`[SUBSCRIPTION-UPDATED] Setting plan_type to ${planType} for subscription ${subscription.id}`);
      }
    }
    
    // Check for multiple subscriptions for the same user
    const { data: existingSubscriptions } = await supabase
      .from("poupeja_subscriptions")
      .select('stripe_subscription_id, status, created_at')
      .eq('user_id', verifiedUserId)
      .order('created_at', { ascending: false });

    if (existingSubscriptions && existingSubscriptions.length > 1) {
      console.log(`Found ${existingSubscriptions.length} subscriptions for user ${verifiedUserId}`);
      
      // Keep only the most recent subscription, cancel others in Stripe
      const mostRecent = existingSubscriptions[0];
      const oldSubscriptions = existingSubscriptions.slice(1);
      
      for (const oldSub of oldSubscriptions) {
        if (oldSub.stripe_subscription_id !== subscription.id && oldSub.status === 'active') {
          try {
            await stripe.subscriptions.cancel(oldSub.stripe_subscription_id);
            console.log(`Canceled old subscription in Stripe: ${oldSub.stripe_subscription_id}`);
          } catch (cancelError) {
            console.error(`Failed to cancel old subscription ${oldSub.stripe_subscription_id}:`, cancelError);
          }
        }
      }
      
      // Delete old subscription records from database
      await supabase
        .from("poupeja_subscriptions")
        .delete()
        .eq('user_id', verifiedUserId)
        .neq('stripe_subscription_id', subscription.id);
    }

    // Use UPSERT to update or insert the subscription
    const upsertResult = await supabase.from("poupeja_subscriptions")
      .upsert(subscriptionData, { 
        onConflict: 'stripe_subscription_id',
        ignoreDuplicates: false 
      });
    
    console.log("Upsert result:", JSON.stringify(upsertResult));
    
    if (upsertResult.error) {
      throw new Error(`Supabase upsert error: ${upsertResult.error.message}`);
    }
    
    console.log(`Subscription upserted successfully: ${subscription.id}`);
  } catch (updateError) {
    console.error("Error updating subscription:", updateError);
    throw updateError;
  }
}