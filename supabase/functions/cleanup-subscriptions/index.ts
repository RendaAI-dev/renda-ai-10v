import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting subscription cleanup process");
    
    // Initialize Supabase service client
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get Stripe secret key from database
    const { data: stripeKeyData, error: stripeKeyError } = await supabaseService
      .from("poupeja_settings")
      .select("value, encrypted")
      .eq("category", "stripe")
      .eq("key", "stripe_secret_key")
      .single();

    if (stripeKeyError || !stripeKeyData?.value) {
      throw new Error("Stripe secret key not found in database");
    }

    // Decode key if encrypted
    let stripeSecretKey = stripeKeyData.value;
    if (stripeKeyData.encrypted) {
      stripeSecretKey = atob(stripeSecretKey);
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Find users with multiple active subscriptions in our database
    const { data: duplicateUsers, error: queryError } = await supabaseService
      .from("poupeja_subscriptions")
      .select("user_id")
      .eq("status", "active");

    if (queryError) {
      throw new Error(`Failed to query subscriptions: ${queryError.message}`);
    }

    // Group by user_id to find duplicates
    const userCounts = {};
    duplicateUsers?.forEach(sub => {
      userCounts[sub.user_id] = (userCounts[sub.user_id] || 0) + 1;
    });

    const usersWithDuplicates = Object.keys(userCounts).filter(userId => userCounts[userId] > 1);
    
    console.log(`Found ${usersWithDuplicates.length} users with duplicate active subscriptions`);

    let cleanedCount = 0;

    for (const userId of usersWithDuplicates) {
      try {
        // Get all subscriptions for this user
        const { data: userSubscriptions } = await supabaseService
          .from("poupeja_subscriptions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (!userSubscriptions || userSubscriptions.length <= 1) continue;

        console.log(`Processing user ${userId} with ${userSubscriptions.length} subscriptions`);

        // Keep the most recent subscription, check others in Stripe
        const mostRecent = userSubscriptions[0];
        const oldSubscriptions = userSubscriptions.slice(1);

        for (const oldSub of oldSubscriptions) {
          try {
            // Check if subscription still exists and is active in Stripe
            const stripeSubscription = await stripe.subscriptions.retrieve(oldSub.stripe_subscription_id);
            
            if (stripeSubscription.status === "active") {
              // Cancel in Stripe
              await stripe.subscriptions.cancel(oldSub.stripe_subscription_id);
              console.log(`Canceled subscription ${oldSub.stripe_subscription_id} in Stripe`);
            }

            // Remove from our database
            await supabaseService
              .from("poupeja_subscriptions")
              .delete()
              .eq("id", oldSub.id);

            console.log(`Removed subscription ${oldSub.stripe_subscription_id} from database`);
            cleanedCount++;

          } catch (stripeError) {
            console.log(`Subscription ${oldSub.stripe_subscription_id} not found in Stripe, removing from database`);
            
            // Remove from database even if not found in Stripe
            await supabaseService
              .from("poupeja_subscriptions")
              .delete()
              .eq("id", oldSub.id);
            
            cleanedCount++;
          }
        }

        // Verify the remaining subscription is still valid in Stripe
        try {
          const remainingStripeSubscription = await stripe.subscriptions.retrieve(mostRecent.stripe_subscription_id);
          
          if (remainingStripeSubscription.status !== "active") {
            // Update status in our database
            await supabaseService
              .from("poupeja_subscriptions")
              .update({ status: remainingStripeSubscription.status })
              .eq("id", mostRecent.id);
            
            console.log(`Updated status for subscription ${mostRecent.stripe_subscription_id} to ${remainingStripeSubscription.status}`);
          }
        } catch (stripeError) {
          console.log(`Most recent subscription ${mostRecent.stripe_subscription_id} not found in Stripe, removing`);
          
          await supabaseService
            .from("poupeja_subscriptions")
            .delete()
            .eq("id", mostRecent.id);
          
          cleanedCount++;
        }

      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
      }
    }

    console.log(`Cleanup completed. Removed ${cleanedCount} duplicate subscriptions`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup completed successfully`,
        usersProcessed: usersWithDuplicates.length,
        subscriptionsRemoved: cleanedCount
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
