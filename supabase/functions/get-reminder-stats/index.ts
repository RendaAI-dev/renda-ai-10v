import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface ReminderStats {
  totalUsers: number;
  activeReminders: number;
  totalMonthlyUsage: number;
  planDistribution: {
    basic: { users: number; usage: number; limit: number };
    pro: { users: number; usage: number; limit: number };
  };
  currentMonth: {
    monthKey: string;
    totalUsage: number;
    totalUsers: number;
  };
  limits: {
    basic: number;
    pro: number;
  };
  appointmentsWithReminders: number;
  recentActivity: {
    lastReminderSent: string | null;
    totalActiveUsers: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('Invalid authentication')
    }

    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || roleData?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    // Get current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Get all subscriptions
    const { data: subscriptions } = await supabaseClient
      .from('poupeja_subscriptions')
      .select('*')
      .eq('status', 'active')

    // Get reminder usage for current month
    const { data: reminderUsage } = await supabaseClient
      .from('poupeja_reminder_usage')
      .select('*')
      .eq('month_year', currentMonth)

    // Get compromissos ativos com lembretes habilitados
    const { data: appointmentsData } = await supabaseClient
      .from('poupeja_appointments')
      .select('id, user_id, reminder_enabled, status, appointment_date')
      .eq('reminder_enabled', true)
      .eq('status', 'pending')
      .gte('appointment_date', new Date().toISOString())

    // Get total number of users
    const { count: totalUsers } = await supabaseClient
      .from('poupeja_users')
      .select('*', { count: 'exact', head: true })

    // Get reminder limits from settings
    const { data: basicLimitSetting } = await supabaseClient
      .from('poupeja_settings')
      .select('value')
      .eq('category', 'pricing')
      .eq('key', 'reminder_limit_basic')
      .single()

    const { data: proLimitSetting } = await supabaseClient
      .from('poupeja_settings')
      .select('value')
      .eq('category', 'pricing')
      .eq('key', 'reminder_limit_pro')
      .single()

    const basicLimit = parseInt(basicLimitSetting?.value || '15')
    const proLimit = parseInt(proLimitSetting?.value || '100')

    // Process plan distribution - contar usuários por plano corretamente
    const totalSubscriptions = subscriptions?.length || 0
    const basicUsers = Math.max(0, (totalUsers || 0) - totalSubscriptions) // Usuários sem subscrição = basic
    const proUsers = subscriptions?.filter(s => s.plan_type?.includes('pro')).length || 0

    // Process monthly usage by plan
    let basicUsage = 0
    let proUsage = 0

    if (reminderUsage && subscriptions) {
      for (const usage of reminderUsage) {
        const userSubscription = subscriptions.find(s => s.user_id === usage.user_id)
        if (userSubscription && userSubscription.plan_type?.includes('pro')) {
          proUsage += usage.reminders_used || 0
        } else {
          basicUsage += usage.reminders_used || 0
        }
      }
    }

    // Calcular métricas adicionais
    const totalUsageThisMonth = basicUsage + proUsage
    const activeReminders = appointmentsData?.length || 0 // Compromissos com lembretes habilitados
    const totalActiveUsers = new Set(appointmentsData?.map(a => a.user_id) || []).size
    const lastReminderSent = reminderUsage && reminderUsage.length > 0 
      ? reminderUsage.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]?.updated_at
      : null

    const stats: ReminderStats = {
      totalUsers: totalUsers || 0,
      activeReminders,
      totalMonthlyUsage: totalUsageThisMonth,
      planDistribution: {
        basic: { users: basicUsers, usage: basicUsage, limit: basicLimit },
        pro: { users: proUsers, usage: proUsage, limit: proLimit }
      },
      currentMonth: {
        monthKey: currentMonth,
        totalUsage: totalUsageThisMonth,
        totalUsers: reminderUsage?.length || 0
      },
      limits: {
        basic: basicLimit,
        pro: proLimit,
      },
      appointmentsWithReminders: appointmentsData?.length || 0,
      recentActivity: {
        lastReminderSent,
        totalActiveUsers
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: stats
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in get-reminder-stats:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})