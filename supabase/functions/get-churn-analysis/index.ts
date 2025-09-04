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

    // Get churn analysis data
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // All subscriptions
    const { data: allSubscriptions } = await supabaseClient
      .from('poupeja_subscriptions')
      .select('*')

    // Active subscriptions
    const activeSubscriptions = allSubscriptions?.filter(sub => sub.status === 'active') || []

    // Cancelled subscriptions in last 30 days
    const cancelledLast30d = allSubscriptions?.filter(sub => 
      sub.status === 'cancelled' && 
      new Date(sub.updated_at) >= thirtyDaysAgo
    ) || []

    // Cancelled subscriptions in last 90 days
    const cancelledLast90d = allSubscriptions?.filter(sub => 
      sub.status === 'cancelled' && 
      new Date(sub.updated_at) >= ninetyDaysAgo
    ) || []

    // Total ever had subscription
    const totalEverSubscribed = allSubscriptions?.length || 0

    // Calculate churn rates
    const churnRate30d = totalEverSubscribed > 0 ? 
      (cancelledLast30d.length / totalEverSubscribed) * 100 : 0

    const churnRate90d = totalEverSubscribed > 0 ? 
      (cancelledLast90d.length / totalEverSubscribed) * 100 : 0

    // Average customer lifetime (in days)
    const avgLifetime = allSubscriptions?.reduce((acc, sub) => {
      const start = new Date(sub.created_at)
      const end = sub.status === 'active' ? new Date() : new Date(sub.updated_at)
      const lifetime = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      return acc + lifetime
    }, 0) || 0

    const avgCustomerLifetime = totalEverSubscribed > 0 ? 
      Math.round(avgLifetime / totalEverSubscribed) : 0

    // Retention rate
    const retentionRate = totalEverSubscribed > 0 ? 
      (activeSubscriptions.length / totalEverSubscribed) * 100 : 0

    // Users at risk (no recent activity)
    const { data: usersAtRisk } = await supabaseClient
      .from('poupeja_users')
      .select('id, name, email, updated_at')
      .lt('updated_at', thirtyDaysAgo.toISOString())
      .limit(10)

    // Churn trend data (last 12 weeks)
    const churnTrendData = []
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i * 7 + 7))
      const weekEnd = new Date()
      weekEnd.setDate(weekEnd.getDate() - (i * 7))

      const weekCancellations = allSubscriptions?.filter(sub => {
        const updatedAt = new Date(sub.updated_at)
        return sub.status === 'cancelled' && 
               updatedAt >= weekStart && 
               updatedAt < weekEnd
      }).length || 0

      churnTrendData.push({
        week: `Sem ${12 - i}`,
        churnCount: weekCancellations,
        date: weekStart.toISOString().split('T')[0]
      })
    }

    const churnAnalysis = {
      churnRate30d: Math.round(churnRate30d * 100) / 100,
      churnRate90d: Math.round(churnRate90d * 100) / 100,
      retentionRate: Math.round(retentionRate * 100) / 100,
      avgCustomerLifetime,
      cancelledLast30d: cancelledLast30d.length,
      cancelledLast90d: cancelledLast90d.length,
      activeSubscriptions: activeSubscriptions.length,
      totalEverSubscribed,
      usersAtRisk: usersAtRisk || [],
      churnTrendData
    }

    return new Response(JSON.stringify(churnAnalysis), {
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