import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface WhatsAppNotificationRequest {
  type: 'appointment_reminder' | 'transaction_reminder';
  user: {
    phone: string;
    name: string;
  };
  appointment?: {
    title: string;
    date: string;
    location?: string;
    minutesUntil: number;
  };
  transaction?: {
    type: 'income' | 'expense';
    amount: number;
    description: string;
    minutesUntil: number;
  };
  message: string;
  webhookUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const body: WhatsAppNotificationRequest = await req.json();
    const { webhookUrl, ...notificationData } = body;

    console.log('Sending WhatsApp notification:', notificationData);

    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    // Send data to N8N webhook
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });

    if (!n8nResponse.ok) {
      throw new Error(`N8N webhook failed: ${n8nResponse.status} ${n8nResponse.statusText}`);
    }

    const result = await n8nResponse.json().catch(() => ({ success: true }));
    
    console.log('WhatsApp notification sent successfully:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'WhatsApp notification sent successfully',
        result 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error sending WhatsApp notification:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);