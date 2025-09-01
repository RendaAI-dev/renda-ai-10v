import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ReconnectRequest {
  instance_name: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Evolution reconnect request received');

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
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem reconectar o WhatsApp.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { instance_name }: ReconnectRequest = await req.json();

    if (!instance_name) {
      return new Response(
        JSON.stringify({ error: 'Nome da instância é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Trim whitespace from instance name
    const trimmedInstanceName = instance_name.trim();

    console.log('Reconnecting instance:', trimmedInstanceName);

    // Get Evolution API configuration
    const { data: config, error: configError } = await supabaseClient
      .from('poupeja_evolution_config')
      .select('*')
      .eq('instance_name', trimmedInstanceName)
      .maybeSingle();

    if (configError || !config) {
      throw new Error('Configuração da Evolution API não encontrada');
    }

    if (!config.is_active) {
      return new Response(
        JSON.stringify({ 
          error: 'Instância não está ativa. Ative a instância primeiro no painel admin.',
          instance_active: false 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Try to connect to Evolution API
    const evolutionUrl = config.api_url.trim().replace(/\/+$/, ''); // Remove trailing slashes and spaces
    const apiKey = config.api_key.trim();

    console.log('Connecting to Evolution API:', evolutionUrl);
    console.log('Using API key:', apiKey.substring(0, 8) + '...');
    console.log('Instance name:', trimmedInstanceName);

    // First, try to get instance status
    const statusResponse = await fetch(`${evolutionUrl}/instance/connectionState/${trimmedInstanceName}`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!statusResponse.ok) {
      throw new Error(`Evolution API não acessível: ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();
    console.log('Instance status:', statusData);

    // Check for connected status in different possible response formats
    let isConnected = false;
    let phoneNumber = null;

    // Format 1: { instance: { state: "open", instanceName: "renda-ai" } }
    if (statusData.instance?.state === 'open') {
      isConnected = true;
      phoneNumber = statusData.instance.instanceName || 'Conectado';
    }
    // Format 2: { state: "open" }
    else if (statusData.state === 'open') {
      isConnected = true;
      phoneNumber = statusData.phoneNumber || statusData.instanceName || 'Conectado';
    }

    if (isConnected) {
      console.log('Instance is connected, configuring webhook...');
      
      // Configure webhook URL
      const webhookUrl = `${supabaseUrl}/functions/v1/evolution-webhook`;
      
      try {
        const webhookResponse = await fetch(`${evolutionUrl}/webhook/set/${trimmedInstanceName}`, {
          method: 'POST',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            enabled: true,
            url: webhookUrl,
            webhookByEvents: true,
            events: [
              'CONNECTION_UPDATE',
              'MESSAGES_UPSERT',
              'MESSAGES_UPDATE', 
              'QRCODE_UPDATED',
              'INSTANCE_STATUS',
              'SEND_MESSAGE'
            ]
          }),
        });
        
        if (webhookResponse.ok) {
          console.log('Webhook configured successfully');
        } else {
          const webhookError = await webhookResponse.text();
          console.warn('Failed to configure webhook:', webhookError);
        }
      } catch (webhookError) {
        console.warn('Error configuring webhook:', webhookError);
      }

      // Update database status
      await supabaseClient
        .from('poupeja_evolution_config')
        .update({
          connection_status: 'connected',
          phone_connected: phoneNumber,
          last_connection_check: new Date().toISOString(),
          webhook_url: webhookUrl,
          qr_code: null
        })
        .eq('instance_name', trimmedInstanceName);

      return new Response(
        JSON.stringify({ 
          success: true, 
          already_connected: true,
          message: 'WhatsApp já está conectado e webhook configurado!',
          phone_number: phoneNumber
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // If not connected, try to generate QR code
    const connectResponse = await fetch(`${evolutionUrl}/instance/connect/${trimmedInstanceName}`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!connectResponse.ok) {
      const errorText = await connectResponse.text();
      console.error('Evolution API error response:', connectResponse.status, errorText);
      throw new Error(`Erro ao gerar QR Code: ${connectResponse.status} - ${errorText}`);
    }

    let connectData;
    try {
      const responseText = await connectResponse.text();
      console.log('Raw Evolution API response:', responseText);
      
      if (!responseText) {
        throw new Error('Evolution API retornou resposta vazia');
      }
      
      connectData = JSON.parse(responseText);
      console.log('Parsed connect response:', JSON.stringify(connectData, null, 2));
    } catch (jsonError) {
      console.error('Failed to parse Evolution API response as JSON:', jsonError);
      throw new Error('Evolution API retornou resposta inválida (não é JSON válido)');
    }

    // Update database with QR code or connection status
    const updateData: any = {
      last_connection_check: new Date().toISOString(),
    };

    if (connectData.code) {
      // QR Code generated
      updateData.qr_code = connectData.code;
      updateData.connection_status = 'pending';
      
      console.log('QR Code generated successfully');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          qrcode: connectData.code,
          message: 'QR Code gerado! Escaneie com seu WhatsApp.',
          qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(connectData.code)}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (connectData.state === 'open') {
      // Already connected
      updateData.connection_status = 'connected';
      updateData.phone_connected = connectData.phoneNumber || 'Conectado';
      updateData.qr_code = null;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          already_connected: true,
          message: 'WhatsApp conectado com sucesso!',
          phone_number: connectData.phoneNumber
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (connectData.qrcode) {
      // Different QR code format
      updateData.qr_code = connectData.qrcode;
      updateData.connection_status = 'pending';
      
      console.log('QR Code generated (alternative format)');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          qrcode: connectData.qrcode,
          message: 'QR Code gerado! Escaneie com seu WhatsApp.',
          qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(connectData.qrcode)}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (connectData.message && connectData.message.includes('QR')) {
      // Handle message-based QR response
      updateData.connection_status = 'pending';
      
      console.log('QR Code process initiated');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: connectData.message || 'Processo de conexão iniciado. Aguarde o QR Code ser gerado.',
          waiting_qr: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      console.error('Unexpected Evolution API response structure:', connectData);
      throw new Error(`Resposta inesperada da Evolution API: ${JSON.stringify(connectData)}`);
    }

    // Update database
    await supabaseClient
      .from('poupeja_evolution_config')
      .update(updateData)
      .eq('instance_name', trimmedInstanceName);

  } catch (error) {
    console.error('Error in evolution-reconnect function:', error);
    
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