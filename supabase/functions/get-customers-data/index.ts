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

    // Get all customers with their subscription data
    const { data: users } = await supabaseClient
      .from('poupeja_users')
      .select(`
        id,
        name,
        email,
        phone,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    // Get all subscriptions
    const { data: subscriptions } = await supabaseClient
      .from('poupeja_subscriptions')
      .select('*')

    // Combine user and subscription data
    const customersData = users?.map(user => {
      // Find most recent subscription for this user
      const userSubscriptions = subscriptions?.filter(sub => sub.user_id === user.id) || []
      const activeSubscription = userSubscriptions.find(sub => sub.status === 'active')
      const latestSubscription = userSubscriptions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]

      return {
        id: user.id,
        name: user.name || 'Sem nome',
        email: user.email,
        phone: user.phone || '-',
        registeredAt: user.created_at,
        lastActivity: user.updated_at,
        subscriptionStatus: activeSubscription?.status || 'sem_assinatura',
        planType: activeSubscription?.plan_type || '-',
        subscriptionStart: activeSubscription?.created_at || null,
        subscriptionEnd: activeSubscription?.current_period_end || null,
        subscriptionValue: activeSubscription ? 
          (activeSubscription.plan_type === 'monthly' ? 9.99 : 99.99) : 0,
        hasEverSubscribed: userSubscriptions.length > 0,
        subscriptionCount: userSubscriptions.length,
        cancelAtPeriodEnd: activeSubscription?.cancel_at_period_end || false
      }
    }) || []

    // Calculate summary stats
    const totalCustomers = customersData.length
    const activeSubscribers = customersData.filter(c => c.subscriptionStatus === 'active').length
    const monthlySubscribers = customersData.filter(c => 
      c.subscriptionStatus === 'active' && c.planType === 'monthly'
    ).length
    const annualSubscribers = customersData.filter(c => 
      c.subscriptionStatus === 'active' && c.planType === 'annual'
    ).length
    const neverSubscribed = customersData.filter(c => !c.hasEverSubscribed).length

    const summary = {
      totalCustomers,
      activeSubscribers,
      monthlySubscribers,
      annualSubscribers,
      neverSubscribed,
      conversionRate: totalCustomers > 0 ? 
        Math.round((activeSubscribers / totalCustomers) * 10000) / 100 : 0
    }

    return new Response(JSON.stringify({
      customers: customersData,
      summary
    }), {
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