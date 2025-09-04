import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function for logging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-REMINDER-LIMIT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    // Initialize Supabase client with auth header
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Initialize service client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get authenticated user
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData.user) {
      logStep("ERROR: User authentication failed", { error: userError?.message });
      throw new Error("User not authenticated");
    }

    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    // Get user's current reminder limit and usage
    const { data: limitResult, error: limitError } = await supabaseService
      .rpc('get_user_reminder_limit', { p_user_id: userId });

    if (limitError) {
      logStep("ERROR: Failed to get user reminder limit", { error: limitError.message });
      throw new Error("Failed to get reminder limit");
    }

    const { data: usageResult, error: usageError } = await supabaseService
      .rpc('get_current_month_usage', { p_user_id: userId });

    if (usageError) {
      logStep("ERROR: Failed to get current usage", { error: usageError.message });
      throw new Error("Failed to get current usage");
    }

    const limit = limitResult || 15;
    const usage = usageResult || 0;
    const remaining = Math.max(0, limit - usage);
    const canCreateReminder = usage < limit;

    logStep("Reminder stats calculated", {
      limit,
      usage,
      remaining,
      canCreateReminder
    });

    // Get user's subscription info
    const { data: subscription, error: subError } = await supabaseService
      .from("poupeja_subscriptions")
      .select("plan_type, status, current_period_end")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const planType = subscription?.plan_type || 'free';
    logStep("User plan info", { planType, hasActiveSubscription: !!subscription });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          canCreateReminder,
          limit,
          usage,
          remaining,
          planType,
          hasActiveSubscription: !!subscription,
          periodEnd: subscription?.current_period_end
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-reminder-limit", { message: errorMessage });
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});