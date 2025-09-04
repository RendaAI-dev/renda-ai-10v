import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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

    // Verify admin access
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid user')
    }

    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || roleData?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    // Get all subscriptions
    const { data: subscriptions } = await supabaseClient
      .from('poupeja_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    // Active subscriptions
    const activeSubscriptions = subscriptions?.filter(sub => sub.status === 'active') || []

    // Plan distribution
    const monthlyActive = activeSubscriptions.filter(sub => sub.plan_type === 'monthly').length
    const annualActive = activeSubscriptions.filter(sub => sub.plan_type === 'annual').length

    // All time subscriptions by plan
    const monthlyTotal = subscriptions?.filter(sub => sub.plan_type === 'monthly').length || 0
    const annualTotal = subscriptions?.filter(sub => sub.plan_type === 'annual').length || 0

    // Revenue by plan (active subscriptions)
    const monthlyRevenue = monthlyActive * 9.99
    const annualRevenue = annualActive * 99.99
    const totalRevenue = monthlyRevenue + annualRevenue

    // Average revenue per user
    const arpu = activeSubscriptions.length > 0 ? 
      totalRevenue / activeSubscriptions.length : 0

    // Plan conversion trends (last 12 weeks)
    const planTrendData = []
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i * 7 + 7))
      const weekEnd = new Date()
      weekEnd.setDate(weekEnd.getDate() - (i * 7))

      const weekSubscriptions = subscriptions?.filter(sub => {
        const createdAt = new Date(sub.created_at)
        return createdAt >= weekStart && createdAt < weekEnd
      }) || []

      const weekMonthly = weekSubscriptions.filter(sub => sub.plan_type === 'monthly').length
      const weekAnnual = weekSubscriptions.filter(sub => sub.plan_type === 'annual').length

      planTrendData.push({
        week: `Sem ${12 - i}`,
        monthly: weekMonthly,
        annual: weekAnnual,
        total: weekMonthly + weekAnnual,
        date: weekStart.toISOString().split('T')[0]
      })
    }

    // Plan performance comparison
    const planPerformance = [
      {
        plan: 'Monthly',
        activeSubscriptions: monthlyActive,
        totalSubscriptions: monthlyTotal,
        revenue: monthlyRevenue,
        averageValue: 9.99,
        conversionRate: monthlyTotal > 0 ? (monthlyActive / monthlyTotal) * 100 : 0
      },
      {
        plan: 'Annual',
        activeSubscriptions: annualActive,
        totalSubscriptions: annualTotal,
        revenue: annualRevenue,
        averageValue: 99.99,
        conversionRate: annualTotal > 0 ? (annualActive / annualTotal) * 100 : 0
      }
    ]

    // Upgrade/downgrade analysis (simplified)
    const planChanges = subscriptions?.filter(sub => {
      // Check if user has multiple subscriptions (indicating plan changes)
      const userSubs = subscriptions.filter(s => s.user_id === sub.user_id)
      return userSubs.length > 1
    }) || []

    const planAnalytics = {
      activePlans: {
        monthly: monthlyActive,
        annual: annualActive,
        total: activeSubscriptions.length
      },
      revenue: {
        monthly: Math.round(monthlyRevenue * 100) / 100,
        annual: Math.round(annualRevenue * 100) / 100,
        total: Math.round(totalRevenue * 100) / 100,
        arpu: Math.round(arpu * 100) / 100
      },
      distribution: [
        { name: 'Monthly', value: monthlyActive, color: '#4ECDC4' },
        { name: 'Annual', value: annualActive, color: '#2C6E7F' }
      ],
      planPerformance,
      planTrendData,
      planChanges: planChanges.length,
      mostPopular: monthlyActive >= annualActive ? 'monthly' : 'annual'
    }

    return new Response(JSON.stringify(planAnalytics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})