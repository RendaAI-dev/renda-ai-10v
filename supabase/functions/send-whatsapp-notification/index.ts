import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface WhatsAppRequest {
  phoneNumber: string;
  message: string;
  appointmentId?: string;
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

    const { phoneNumber, message, appointmentId }: WhatsAppRequest = await req.json();

    if (!phoneNumber || !message) {
      return new Response(
        JSON.stringify({ error: 'Phone number and message are required' }),
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
    if (formattedPhone.startsWith('55')) {
      formattedPhone = formattedPhone;
    } else if (formattedPhone.length === 11) {
      formattedPhone = '55' + formattedPhone;
    } else if (formattedPhone.length === 10) {
      formattedPhone = '55' + formattedPhone;
    }

    // In a real implementation, you would integrate with a WhatsApp API service
    // For now, we'll simulate the sending and log the notification
    
    const messageId = crypto.randomUUID();
    const sentAt = new Date().toISOString();

    // Log the notification attempt
    const { error: logError } = await supabaseClient
      .from('poupeja_notification_logs')
      .insert({
        user_id: user.id,
        appointment_id: appointmentId,
        whatsapp_number: formattedPhone,
        message_content: message,
        status: 'sent', // In real implementation, this would be 'pending' initially
        sent_at: sentAt,
      });

    if (logError) {
      console.error('Error logging notification:', logError);
    }

    // TODO: Replace this simulation with actual WhatsApp API integration
    // Examples of WhatsApp Business API services:
    // - Twilio WhatsApp API
    // - Meta WhatsApp Business API
    // - Other WhatsApp Business Solution Providers
    
    // For now, we simulate a successful send
    console.log('WhatsApp message simulated:', {
      to: formattedPhone,
      message: message.substring(0, 100) + '...',
      messageId,
      timestamp: sentAt
    });

    // Update the log with delivery status (simulated)
    setTimeout(async () => {
      await supabaseClient
        .from('poupeja_notification_logs')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('whatsapp_number', formattedPhone)
        .eq('sent_at', sentAt);
    }, 1000);

    return new Response(
      JSON.stringify({
        success: true,
        messageId,
        status: 'sent',
        timestamp: sentAt,
        // In development, show that this is simulated
        note: 'This is a simulated WhatsApp send. Integrate with a real WhatsApp API service for production.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

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