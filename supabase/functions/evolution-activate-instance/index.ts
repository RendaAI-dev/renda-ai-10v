import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ActivateRequest {
  instance_name: string;
  activate: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Evolution activate instance request received');

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the user from the request (admin only)
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Verify admin access
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!userRole) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem ativar/desativar instâncias.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { instance_name, activate }: ActivateRequest = await req.json();

    if (!instance_name) {
      return new Response(
        JSON.stringify({ error: 'Nome da instância é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`${activate ? 'Activating' : 'Deactivating'} instance:`, instance_name);

    // Update instance status in database
    const { data: updatedConfig, error: updateError } = await supabaseClient
      .from('poupeja_evolution_config')
      .update({
        is_active: activate,
        updated_at: new Date().toISOString(),
        ...(activate ? {} : { 
          connection_status: 'disconnected', 
          qr_code: null, 
          phone_connected: null 
        })
      })
      .eq('instance_name', instance_name)
      .select()
      .maybeSingle();

    if (updateError) {
      throw new Error(`Erro ao atualizar instância: ${updateError.message}`);
    }

    if (!updatedConfig) {
      return new Response(
        JSON.stringify({ error: 'Instância não encontrada' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const message = activate 
      ? 'Instância ativada com sucesso! Agora você pode conectar o WhatsApp.'
      : 'Instância desativada com sucesso.';

    console.log(`Instance ${instance_name} ${activate ? 'activated' : 'deactivated'} successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        instance: updatedConfig,
        is_active: activate
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in evolution-activate-instance function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno do servidor'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});