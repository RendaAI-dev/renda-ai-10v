import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface WhatsAppRequest {
  recipient_number?: string;
  phoneNumber?: string;
  message_content?: string;
  message?: string;
  appointmentId?: string;
  notification_type?: string;
  channel?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Get the user from the request
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const requestBody: WhatsAppRequest = await req.json();
    
    // Support both field naming conventions
    const phoneNumber = requestBody.recipient_number || requestBody.phoneNumber;
    const message = requestBody.message_content || requestBody.message;
    const appointmentId = requestBody.appointmentId;

    console.log('Request body received:', requestBody);

    if (!phoneNumber || !message) {
      return new Response(
        JSON.stringify({ 
          error: 'Phone number and message are required',
          received: {
            phoneNumber: !!phoneNumber,
            message: !!message,
            requestBody
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Sending WhatsApp message:', { 
      phoneNumber, 
      messageLength: message.length,
      appointmentId,
      userId: user.id
    });

    // Format phone number (remove special characters, add country code if needed)
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55')) {
      if (formattedPhone.length === 11) {
        formattedPhone = '55' + formattedPhone;
      } else if (formattedPhone.length === 10) {
        formattedPhone = '55' + formattedPhone;
      }
    }

    console.log('Formatted phone:', formattedPhone);

    // Get Evolution API configuration
    const { data: evolutionConfig, error: configError } = await supabaseClient
      .from('poupeja_evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    console.log('Evolution config:', evolutionConfig, 'Error:', configError);

    if (!evolutionConfig || configError) {
      throw new Error(`Evolution API não configurada: ${configError?.message || 'Nenhuma configuração ativa encontrada'}`);
    }

    // Prepare message for Evolution API
    const messagePayload = {
      number: formattedPhone,
      textMessage: {
        text: message
      }
    };

    console.log('Sending to Evolution API:', {
      url: `${evolutionConfig.api_url}/message/sendText/${evolutionConfig.instance_name}`,
      phone: formattedPhone,
      payload: messagePayload
    });

    try {
      // Send message through Evolution API
      const evolutionResponse = await fetch(
        `${evolutionConfig.api_url}/message/sendText/${evolutionConfig.instance_name}`,
        {
          method: 'POST',
          headers: {
            'apikey': evolutionConfig.api_key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messagePayload),
        }
      );

      console.log('Evolution response status:', evolutionResponse.status);

      if (!evolutionResponse.ok) {
        const errorText = await evolutionResponse.text();
        console.error('Evolution API error:', evolutionResponse.status, errorText);
        throw new Error(`Erro na Evolution API: ${evolutionResponse.status} - ${errorText}`);
      }

      const evolutionResult = await evolutionResponse.json();
      console.log('Evolution API response:', evolutionResult);

      const messageId = evolutionResult.key?.id || crypto.randomUUID();
      const sentAt = new Date().toISOString();

      // Log the notification attempt
      const { error: logError } = await supabaseClient
        .from('poupeja_notification_logs')
        .insert({
          user_id: user.id,
          appointment_id: appointmentId,
          notification_type: requestBody.notification_type || 'manual',
          channel: 'whatsapp',
          recipient: formattedPhone,
          message_content: message,
          message_id: messageId,
          status: 'sent',
          sent_at: sentAt,
          metadata: {
            evolution_response: evolutionResult,
            phone_formatted: formattedPhone,
            original_phone: phoneNumber
          }
        });

      if (logError) {
        console.error('Error logging notification:', logError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          messageId,
          status: 'sent',
          timestamp: sentAt,
          evolutionResponse: evolutionResult,
          formattedPhone
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      throw new Error(`Erro ao conectar com Evolution API: ${fetchError.message}`);
    }

  } catch (error) {
    console.error('Error in send-whatsapp-notification function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});