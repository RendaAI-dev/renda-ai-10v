import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get Evolution API config
    const { data: evolutionConfig } = await supabase
      .from('poupeja_evolution_config')
      .select('*')
      .eq('is_active', true)
      .single()

    if (!evolutionConfig) {
      throw new Error('Evolution API não configurada ou desativada')
    }

    // Get current time and calculate reminder windows
    const now = new Date()
    const reminders = [
      { minutes: 15, window: 5 },
      { minutes: 30, window: 5 },
      { minutes: 60, window: 5 },
      { minutes: 1440, window: 30 }, // 24 horas com janela de 30 min
    ]

    const processedAppointments = []

    // Para cada janela de lembrete
    for (const reminder of reminders) {
      const targetTime = new Date(now.getTime() + reminder.minutes * 60000)
      const windowStart = new Date(targetTime.getTime() - reminder.window * 60000)
      const windowEnd = new Date(targetTime.getTime() + reminder.window * 60000)

      // Buscar compromissos nesta janela
      const { data: appointments } = await supabase
        .from('poupeja_appointments')
        .select(`
          *,
          user:auth.users!user_id (
            id,
            email
          )
        `)
        .eq('status', 'pending')
        .eq('reminder_enabled', true)
        .gte('appointment_date', windowStart.toISOString())
        .lte('appointment_date', windowEnd.toISOString())

      if (!appointments || appointments.length === 0) continue

      for (const appointment of appointments) {
        // Verificar se já foi enviado lembrete para este tempo
        const { data: existingLog } = await supabase
          .from('poupeja_notification_logs')
          .select('id')
          .eq('appointment_id', appointment.id)
          .eq('reminder_time_minutes', reminder.minutes)
          .eq('status', 'sent')
          .single()

        if (existingLog) continue // Já foi enviado

        // Buscar configurações do WhatsApp do usuário
        const { data: whatsappSettings } = await supabase
          .from('poupeja_whatsapp_settings')
          .select('*')
          .eq('user_id', appointment.user_id)
          .single()

        if (!whatsappSettings?.whatsapp_number || !whatsappSettings?.enable_reminders) {
          console.log(`Usuário ${appointment.user_id} sem WhatsApp configurado ou desabilitado`)
          continue
        }

        // Verificar horário silencioso
        if (isInQuietHours(now, whatsappSettings)) {
          console.log(`Horário silencioso para usuário ${appointment.user_id}`)
          continue
        }

        // Buscar template apropriado
        const templateType = getTemplateType(reminder.minutes)
        const { data: template } = await supabase
          .from('poupeja_message_templates')
          .select('*')
          .eq('template_type', templateType)
          .eq('is_active', true)
          .single()

        if (!template) {
          console.error(`Template ${templateType} não encontrado`)
          continue
        }

        // Formatar mensagem
        const message = formatMessage(template.content, appointment)

        // Enviar via Evolution API
        const sendResult = await sendWhatsAppMessage(
          evolutionConfig,
          whatsappSettings.whatsapp_number,
          message
        )

        // Registrar log
        await supabase
          .from('poupeja_notification_logs')
          .insert({
            user_id: appointment.user_id,
            appointment_id: appointment.id,
            notification_type: 'whatsapp_reminder',
            channel: 'whatsapp',
            status: sendResult.success ? 'sent' : 'failed',
            reminder_time_minutes: reminder.minutes,
            recipient: whatsappSettings.whatsapp_number,
            message_content: message,
            message_id: sendResult.messageId,
            error_message: sendResult.error,
            sent_at: sendResult.success ? new Date().toISOString() : null,
            metadata: sendResult.metadata || {}
          })

        processedAppointments.push({
          appointment_id: appointment.id,
          reminder_minutes: reminder.minutes,
          status: sendResult.success ? 'sent' : 'failed',
          error: sendResult.error
        })

        // Atualizar status do compromisso se foi o último lembrete
        if (reminder.minutes === 15 && sendResult.success) {
          await supabase
            .from('poupeja_appointments')
            .update({ reminder_sent: true })
            .eq('id', appointment.id)
        }
      }
    }

    // Processar fila de mensagens pendentes
    await processMessageQueue(supabase, evolutionConfig)

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedAppointments.length,
        appointments: processedAppointments,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erro ao processar lembretes:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Funções auxiliares

function isInQuietHours(now: Date, settings: any): boolean {
  if (!settings.quiet_hours_start || !settings.quiet_hours_end) return false
  
  const currentTime = now.getHours() * 60 + now.getMinutes()
  const startTime = parseTime(settings.quiet_hours_start)
  const endTime = parseTime(settings.quiet_hours_end)
  
  if (startTime < endTime) {
    return currentTime >= startTime && currentTime < endTime
  } else {
    // Horário atravessa meia-noite
    return currentTime >= startTime || currentTime < endTime
  }
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

function getTemplateType(minutes: number): string {
  if (minutes <= 30) return 'reminder_30min'
  if (minutes <= 60) return 'reminder_custom'
  return 'reminder_24h'
}

function formatMessage(template: string, appointment: any): string {
  const date = new Date(appointment.appointment_date)
  const replacements = {
    '{title}': appointment.title || 'Compromisso',
    '{date}': date.toLocaleDateString('pt-BR'),
    '{time}': date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    '{location}': appointment.location || 'Local não especificado',
    '{description}': appointment.description || 'Sem descrição'
  }
  
  let message = template
  for (const [key, value] of Object.entries(replacements)) {
    message = message.replace(new RegExp(key, 'g'), value)
  }
  
  return message
}

async function sendWhatsAppMessage(
  config: any,
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string; metadata?: any }> {
  try {
    const response = await fetch(
      `${config.api_url}/message/sendText/${config.instance_name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.api_key
        },
        body: JSON.stringify({
          number: phoneNumber,
          text: message,
          delay: 1000 // Delay de 1 segundo entre mensagens
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Evolution API error: ${error}`)
    }

    const result = await response.json()
    return {
      success: true,
      messageId: result.key?.id || result.messageId,
      metadata: result
    }
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error)
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao enviar mensagem'
    }
  }
}

async function processMessageQueue(supabase: any, evolutionConfig: any) {
  // Processar mensagens pendentes na fila
  const { data: queuedMessages } = await supabase
    .from('poupeja_message_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(10)

  if (!queuedMessages || queuedMessages.length === 0) return

  for (const msg of queuedMessages) {
    // Atualizar status para processando
    await supabase
      .from('poupeja_message_queue')
      .update({ status: 'processing' })
      .eq('id', msg.id)

    const result = await sendWhatsAppMessage(
      evolutionConfig,
      msg.recipient_number,
      msg.message_content
    )

    if (result.success) {
      await supabase
        .from('poupeja_message_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', msg.id)
    } else {
      const newRetryCount = msg.retry_count + 1
      await supabase
        .from('poupeja_message_queue')
        .update({
          status: newRetryCount >= msg.max_retries ? 'failed' : 'pending',
          retry_count: newRetryCount,
          error_message: result.error
        })
        .eq('id', msg.id)
    }
  }
}