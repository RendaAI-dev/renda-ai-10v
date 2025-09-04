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

    // Get analytics data
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Total users
    const { count: totalUsers } = await supabaseClient
      .from('poupeja_users')
      .select('*', { count: 'exact', head: true })

    // New users last 30 days
    const { count: newUsers30d } = await supabaseClient
      .from('poupeja_users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Active users last 7 days (users who logged in recently)
    const { count: activeUsers7d } = await supabaseClient
      .from('poupeja_users')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', sevenDaysAgo.toISOString())

    // Active subscriptions
    const { data: activeSubscriptions } = await supabaseClient
      .from('poupeja_subscriptions')
      .select('*')
      .eq('status', 'active')

    // Total revenue calculation (assuming $9.99 monthly, $99.99 annual)
    let totalRevenue = 0
    let monthlyRevenue = 0
    activeSubscriptions?.forEach(sub => {
      if (sub.plan_type === 'monthly') {
        totalRevenue += 9.99
        monthlyRevenue += 9.99
      } else if (sub.plan_type === 'annual') {
        totalRevenue += 99.99
        monthlyRevenue += 8.33 // Annual divided by 12
      }
    })

    // Conversion rate
    const conversionRate = totalUsers ? (activeSubscriptions?.length || 0) / totalUsers * 100 : 0

    // Growth data for chart (last 30 days)
    const { data: dailyGrowth } = await supabaseClient
      .from('poupeja_users')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // Process daily growth data
    const growthData = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dayStr = date.toISOString().split('T')[0]
      
      const usersOnDay = dailyGrowth?.filter(user => 
        user.created_at.startsWith(dayStr)
      ).length || 0

      growthData.push({
        date: dayStr,
        users: usersOnDay,
        day: date.getDate()
      })
    }

    const analytics = {
      totalUsers: totalUsers || 0,
      newUsers30d: newUsers30d || 0,
      activeUsers7d: activeUsers7d || 0,
      activeSubscriptions: activeSubscriptions?.length || 0,
      conversionRate: Math.round(conversionRate * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      growthData
    }

    return new Response(JSON.stringify(analytics), {
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