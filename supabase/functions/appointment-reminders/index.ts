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
    // Inicializa o cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Configurações do webhook N8N
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL') ?? ''
    
    // Horário atual
    const now = new Date()
    const nowTime = now.getTime()
    
    console.log(`Verificando lembretes em: ${now.toISOString()}`)

    // Busca compromissos que precisam de lembretes
    // Inclui join com a tabela users para pegar o telefone
    const { data: appointments, error } = await supabaseClient
      .from('poupeja_appointments')
      .select(`
        *,
        users!inner(
          id,
          email,
          phone,
          name
        )
      `)
      .eq('status', 'pending')
      .eq('reminder_enabled', true)
      .eq('reminder_sent', false)
      .gte('appointment_date', now.toISOString())
      .lte('appointment_date', new Date(nowTime + 24 * 60 * 60 * 1000).toISOString()) // Próximas 24 horas
      .order('appointment_date', { ascending: true })

    if (error) {
      console.error('Erro ao buscar compromissos:', error)
      throw error
    }

    console.log(`Encontrados ${appointments?.length || 0} compromissos para verificar`)

    const remindersToSend = []
    const appointmentsToUpdate = []

    // Verifica cada compromisso
    for (const appointment of appointments || []) {
      const appointmentDate = new Date(appointment.appointment_date)
      const appointmentTime = appointmentDate.getTime()
      const minutesUntilAppointment = Math.floor((appointmentTime - nowTime) / 60000)
      
      console.log(`Compromisso: ${appointment.title} - ${minutesUntilAppointment} minutos até o evento`)

      // Verifica cada tempo de lembrete configurado
      for (const reminderTimeStr of appointment.reminder_times || ['15']) {
        const reminderMinutes = parseInt(reminderTimeStr)
        
        // Verifica se está na janela de tempo para enviar o lembrete
        // Considera uma janela de 5 minutos para evitar perder lembretes
        if (minutesUntilAppointment <= reminderMinutes && 
            minutesUntilAppointment >= (reminderMinutes - 5)) {
          
          console.log(`Lembrete deve ser enviado: ${appointment.title} - ${reminderMinutes} minutos antes`)
          
          remindersToSend.push({
            appointment: appointment,
            reminderMinutes: reminderMinutes,
            minutesUntil: minutesUntilAppointment,
            user: appointment.users
          })
          
          appointmentsToUpdate.push(appointment.id)
          
          break // Envia apenas um lembrete por vez
        }
      }
    }

    console.log(`${remindersToSend.length} lembretes para enviar`)

    // Marca compromissos como lembrete enviado (antes de enviar para evitar duplicatas)
    if (appointmentsToUpdate.length > 0) {
      const { error: updateError } = await supabaseClient
        .from('poupeja_appointments')
        .update({ 
          reminder_sent: true,
          updated_at: new Date().toISOString()
        })
        .in('id', appointmentsToUpdate)
      
      if (updateError) {
        console.error('Erro ao atualizar status dos lembretes:', updateError)
      }
    }

    // Envia cada lembrete para o N8N
    const sendResults = []
    for (const reminder of remindersToSend) {
      try {
        // Prepara o payload para o N8N
        const payload = {
          type: 'appointment_reminder',
          reminder: {
            appointmentId: reminder.appointment.id,
            title: reminder.appointment.title,
            description: reminder.appointment.description,
            appointmentDate: reminder.appointment.appointment_date,
            location: reminder.appointment.location,
            category: reminder.appointment.category,
            reminderMinutes: reminder.reminderMinutes,
            minutesUntil: reminder.minutesUntil
          },
          user: {
            id: reminder.user.id,
            name: reminder.user.name || '',
            email: reminder.user.email || '',
            phone: reminder.user.phone || ''
          },
          metadata: {
            sentAt: new Date().toISOString(),
            environment: Deno.env.get('ENVIRONMENT') || 'production'
          }
        }

        console.log(`Enviando lembrete para N8N: ${reminder.appointment.title}`)

        const response = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        })

        sendResults.push({
          appointmentId: reminder.appointment.id,
          title: reminder.appointment.title,
          success: response.ok,
          status: response.status
        })

        if (!response.ok) {
          console.error(`Erro ao enviar lembrete: ${response.status} - ${await response.text()}`)
        }
      } catch (error) {
        console.error(`Erro ao processar lembrete ${reminder.appointment.id}:`, error)
        sendResults.push({
          appointmentId: reminder.appointment.id,
          title: reminder.appointment.title,
          success: false,
          error: error.message
        })
      }
    }

    // Retorna resultado
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      checked: appointments?.length || 0,
      sent: remindersToSend.length,
      results: sendResults
    }

    console.log('Processamento concluído:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Erro na função:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 400 
      }
    )
  }
})