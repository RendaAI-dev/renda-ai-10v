import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function for logging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-REMINDER-STATS] ${step}${detailsStr}`);
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

    // Get current month stats
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format
    
    // Get user's reminder limit
    const { data: limitResult, error: limitError } = await supabaseService
      .rpc('get_user_reminder_limit', { p_user_id: userId });

    if (limitError) {
      logStep("ERROR: Failed to get user reminder limit", { error: limitError.message });
      throw new Error("Failed to get reminder limit");
    }

    // Get current month usage
    const { data: usageResult, error: usageError } = await supabaseService
      .rpc('get_current_month_usage', { p_user_id: userId });

    if (usageError) {
      logStep("ERROR: Failed to get current usage", { error: usageError.message });
      throw new Error("Failed to get current usage");
    }

    // Get usage history (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().substring(0, 7);

    const { data: usageHistory, error: historyError } = await supabaseService
      .from("poupeja_reminder_usage")
      .select("month_year, reminders_used")
      .eq("user_id", userId)
      .gte("month_year", sixMonthsAgoStr)
      .order("month_year", { ascending: false });

    if (historyError) {
      logStep("Warning: Failed to get usage history", { error: historyError.message });
    }

    // Get subscription info
    const { data: subscription, error: subError } = await supabaseService
      .from("poupeja_subscriptions")
      .select("plan_type, status, current_period_end, reminder_limit")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const limit = limitResult || 15;
    const usage = usageResult || 0;
    const remaining = Math.max(0, limit - usage);
    const planType = subscription?.plan_type || 'free';
    const usagePercentage = limit > 0 ? Math.round((usage / limit) * 100) : 0;

    // Generate monthly breakdown for chart
    const monthlyBreakdown = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substring(0, 7);
      
      const monthUsage = usageHistory?.find(h => h.month_year === monthKey);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      monthlyBreakdown.push({
        month: monthName,
        monthKey,
        used: monthUsage?.reminders_used || 0,
        limit: limit
      });
    }

    logStep("Stats calculated successfully", {
      limit,
      usage,
      remaining,
      usagePercentage,
      planType,
      historyCount: usageHistory?.length || 0
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          currentMonth: {
            usage,
            limit,
            remaining,
            usagePercentage,
            canCreateReminder: usage < limit
          },
          subscription: {
            planType,
            hasActiveSubscription: !!subscription,
            periodEnd: subscription?.current_period_end
          },
          history: {
            monthlyBreakdown,
            totalMonths: usageHistory?.length || 0
          },
          insights: {
            averageMonthlyUsage: usageHistory?.length > 0 
              ? Math.round(usageHistory.reduce((sum, h) => sum + h.reminders_used, 0) / usageHistory.length)
              : 0,
            maxMonthlyUsage: usageHistory?.length > 0
              ? Math.max(...usageHistory.map(h => h.reminders_used))
              : 0,
            isNearLimit: usagePercentage >= 80,
            shouldUpgrade: planType.includes('monthly') && usagePercentage >= 90
          }
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in get-reminder-stats", { message: errorMessage });
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