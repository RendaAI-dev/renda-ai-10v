import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface VerifyRequest {
  phoneNumber: string;
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

    const { phoneNumber }: VerifyRequest = await req.json();

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Verifying WhatsApp number:', { phoneNumber, userId: user.id });

    // Format phone number
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55') && (formattedPhone.length === 10 || formattedPhone.length === 11)) {
      formattedPhone = '55' + formattedPhone;
    }

    // Basic phone number validation
    const isValidFormat = /^55\d{10,11}$/.test(formattedPhone);
    
    if (!isValidFormat) {
      return new Response(
        JSON.stringify({
          verified: false,
          error: 'Formato de número inválido. Use o formato: +55 11 99999-9999'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // TODO: In a real implementation, you would:
    // 1. Send a verification code via WhatsApp API
    // 2. Store the verification code temporarily
    // 3. Return a challenge that the user needs to complete
    // 4. Have a separate endpoint to confirm the verification code
    
    // For now, we'll simulate a simple verification
    // In production, integrate with WhatsApp Business API or similar service
    
    console.log('WhatsApp number verification simulated for:', formattedPhone);

    // Simulate verification success (in real implementation, this would be conditional)
    const verified = true;
    
    if (verified) {
      // Primeiro, verificar se já existe um registro para este usuário
      const { data: existingSettings } = await supabaseClient
        .from('poupeja_whatsapp_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let updateError;

      if (existingSettings) {
        // Atualizar registro existente
        const { error } = await supabaseClient
          .from('poupeja_whatsapp_settings')
          .update({
            whatsapp_number: formattedPhone,
            whatsapp_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        updateError = error;
      } else {
        // Criar novo registro
        const { error } = await supabaseClient
          .from('poupeja_whatsapp_settings')
          .insert({
            user_id: user.id,
            whatsapp_number: formattedPhone,
            whatsapp_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        updateError = error;
      }

      if (updateError) {
        console.error('Error updating WhatsApp settings:', updateError);
        throw new Error('Failed to update WhatsApp settings');
      }
    }

    return new Response(
      JSON.stringify({
        verified,
        phoneNumber: formattedPhone,
        // In development, show that this is simulated
        note: 'This is a simulated verification. Integrate with WhatsApp Business API for production.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in verify-whatsapp-number function:', error);
    
    return new Response(
      JSON.stringify({
        verified: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});