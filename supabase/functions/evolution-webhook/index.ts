import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Tipos de eventos da Evolution API
interface EvolutionWebhookEvent {
  instance: string
  event: string
  data?: any
  apikey?: string
  destination?: string
  date_time?: string
  sender?: string
  server_url?: string
  type?: string
}

interface ConnectionUpdate {
  instance: string
  state: 'open' | 'close' | 'connecting'
  statusReason?: number
}

interface QRCodeUpdate {
  instance: string
  qrcode: string
  count: number
  expires: number
}

interface MessageUpsert {
  instance: string
  data: {
    key: {
      remoteJid: string
      fromMe: boolean
      id: string
    }
    message: {
      conversation?: string
      extendedTextMessage?: {
        text: string
      }
    }
    messageTimestamp: string
    pushName?: string
  }
}

interface InstanceStatus {
  instance: string
  status: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse do body
    const webhookData: EvolutionWebhookEvent = await req.json()
    console.log('Webhook recebido:', {
      event: webhookData.event,
      instance: webhookData.instance,
      timestamp: new Date().toISOString()
    })

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Processar eventos baseado no tipo
    let result = { success: true, processed: false, message: '' }

    switch (webhookData.event) {
      case 'connection.update':
        result = await handleConnectionUpdate(supabase, webhookData)
        break

      case 'qrcode.updated':
        result = await handleQRCodeUpdate(supabase, webhookData)
        break

      case 'messages.upsert':
        result = await handleMessageUpsert(supabase, webhookData)
        break

      case 'messages.update':
        result = await handleMessageUpdate(supabase, webhookData)
        break

      case 'instance.status':
        result = await handleInstanceStatus(supabase, webhookData)
        break

      case 'send.message':
        result = await handleMessageSent(supabase, webhookData)
        break

      default:
        console.log(`Evento não processado: ${webhookData.event}`)
        result = {
          success: true,
          processed: false,
          message: `Evento ${webhookData.event} não possui handler`
        }
    }

    // Registrar o webhook recebido
    await logWebhookEvent(supabase, webhookData, result)

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erro no webhook:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro ao processar webhook' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// ========== HANDLERS DE EVENTOS ==========

async function handleConnectionUpdate(
  supabase: any,
  event: EvolutionWebhookEvent
): Promise<any> {
  try {
    const data = event.data as ConnectionUpdate
    const connectionStatus = data.state === 'open' ? 'connected' : 
                           data.state === 'close' ? 'disconnected' : 
                           'connecting'

    // Atualizar status da conexão
    const { error } = await supabase
      .from('poupeja_evolution_config')
      .update({
        connection_status: connectionStatus,
        last_connection_check: new Date().toISOString(),
        phone_connected: data.state === 'open' ? event.sender : null,
        metadata: {
          ...event,
          updated_at: new Date().toISOString()
        }
      })
      .eq('instance_name', event.instance)

    if (error) throw error

    // Se desconectou, limpar QR Code
    if (data.state === 'close') {
      await supabase
        .from('poupeja_evolution_config')
        .update({
          qr_code: null,
          phone_connected: null
        })
        .eq('instance_name', event.instance)
    }

    // Notificar usuários se a conexão caiu
    if (data.state === 'close') {
      await notifyAdminsConnectionLost(supabase, event.instance)
    }

    return {
      success: true,
      processed: true,
      message: `Conexão atualizada para: ${connectionStatus}`
    }
  } catch (error) {
    console.error('Erro ao processar connection.update:', error)
    return {
      success: false,
      processed: false,
      message: error.message
    }
  }
}

async function handleQRCodeUpdate(
  supabase: any,
  event: EvolutionWebhookEvent
): Promise<any> {
  try {
    const data = event.data as QRCodeUpdate

    // Atualizar QR Code no banco
    const { error } = await supabase
      .from('poupeja_evolution_config')
      .update({
        qr_code: data.qrcode,
        connection_status: 'pending',
        metadata: {
          qr_count: data.count,
          qr_expires: data.expires,
          updated_at: new Date().toISOString()
        }
      })
      .eq('instance_name', event.instance)

    if (error) throw error

    return {
      success: true,
      processed: true,
      message: 'QR Code atualizado'
    }
  } catch (error) {
    console.error('Erro ao processar qrcode.updated:', error)
    return {
      success: false,
      processed: false,
      message: error.message
    }
  }
}

async function handleMessageUpsert(
  supabase: any,
  event: EvolutionWebhookEvent
): Promise<any> {
  try {
    // Primeiro, vamos verificar a estrutura dos dados
    console.log('Raw event data:', JSON.stringify(event, null, 2))
    
    // Os dados podem estar diretamente em event.data ou aninhados
    const messageData = event.data || event
    console.log('Message data structure:', JSON.stringify(messageData, null, 2))
    
    // Tentar extrair os dados de forma defensiva
    let key, message, pushName
    
    if (messageData.data && messageData.data.key) {
      // Estrutura aninhada: event.data.data.key
      key = messageData.data.key
      message = messageData.data.message
      pushName = messageData.data.pushName
    } else if (messageData.key) {
      // Estrutura direta: event.data.key
      key = messageData.key
      message = messageData.message
      pushName = messageData.pushName
    } else {
      console.error('Could not find message key in event data')
      return {
        success: false,
        processed: false,
        message: 'Invalid message structure - no key found'
      }
    }

    // Verificar se key existe
    if (!key || !key.remoteJid) {
      console.error('Message key is missing remoteJid')
      return {
        success: false,
        processed: false,
        message: 'Message key is invalid or missing remoteJid'
      }
    }

    // Ignorar mensagens enviadas por nós mesmos
    if (key.fromMe) {
      return {
        success: true,
        processed: false,
        message: 'Mensagem própria ignorada'
      }
    }

    // Extrair texto da mensagem
    const text = message.conversation || 
                message.extendedTextMessage?.text || 
                ''

    // Extrair número do remetente
    const senderNumber = key.remoteJid.replace('@s.whatsapp.net', '')

    // Verificar se é uma resposta a um lembrete
    if (text.toLowerCase().includes('confirmar') || 
        text.toLowerCase().includes('ok') ||
        text.toLowerCase().includes('ciente')) {
      
      // Buscar compromisso mais próximo do usuário
      const { data: userSettings } = await supabase
        .from('poupeja_whatsapp_settings')
        .select('user_id')
        .eq('whatsapp_number', senderNumber)
        .maybeSingle()

      if (userSettings) {
        // Buscar próximo compromisso
        const { data: appointment } = await supabase
          .from('poupeja_appointments')
          .select('*')
          .eq('user_id', userSettings.user_id)
          .eq('status', 'pending')
          .gte('appointment_date', new Date().toISOString())
          .order('appointment_date', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (appointment) {
          // Registrar confirmação
          await supabase
            .from('poupeja_notification_logs')
            .insert({
              user_id: userSettings.user_id,
              appointment_id: appointment.id,
              notification_type: 'user_confirmation',
              channel: 'whatsapp',
              status: 'delivered',
              recipient: senderNumber,
              message_content: text,
              metadata: {
                push_name: pushName,
                message_id: key.id,
                confirmed_at: new Date().toISOString()
              }
            })

          // Enviar mensagem de confirmação
          await sendConfirmationReply(event.instance, key.remoteJid, appointment)
        }
      }
    }

    // Verificar comandos especiais
    const commands = await processUserCommands(supabase, text, senderNumber, event.instance)
    
    return {
      success: true,
      processed: true,
      message: 'Mensagem processada',
      commands_executed: commands
    }
  } catch (error) {
    console.error('Erro ao processar messages.upsert:', error)
    return {
      success: false,
      processed: false,
      message: error.message
    }
  }
}

async function handleMessageUpdate(
  supabase: any,
  event: EvolutionWebhookEvent
): Promise<any> {
  try {
    // Processar atualizações de status de mensagem (lida, entregue, etc)
    const { data } = event

    if (data.update?.status) {
      // Atualizar status no log de notificações
      await supabase
        .from('poupeja_notification_logs')
        .update({
          status: mapMessageStatus(data.update.status),
          delivered_at: data.update.status >= 3 ? new Date().toISOString() : null,
          read_at: data.update.status >= 4 ? new Date().toISOString() : null,
          metadata: {
            evolution_status: data.update.status,
            updated_at: new Date().toISOString()
          }
        })
        .eq('message_id', data.key.id)
    }

    return {
      success: true,
      processed: true,
      message: 'Status da mensagem atualizado'
    }
  } catch (error) {
    console.error('Erro ao processar messages.update:', error)
    return {
      success: false,
      processed: false,
      message: error.message
    }
  }
}

async function handleInstanceStatus(
  supabase: any,
  event: EvolutionWebhookEvent
): Promise<any> {
  try {
    const data = event.data as InstanceStatus

    // Atualizar status da instância
    await supabase
      .from('poupeja_evolution_config')
      .update({
        connection_status: data.status === 'online' ? 'connected' : 'disconnected',
        last_connection_check: new Date().toISOString()
      })
      .eq('instance_name', event.instance)

    return {
      success: true,
      processed: true,
      message: `Status da instância: ${data.status}`
    }
  } catch (error) {
    console.error('Erro ao processar instance.status:', error)
    return {
      success: false,
      processed: false,
      message: error.message
    }
  }
}

async function handleMessageSent(
  supabase: any,
  event: EvolutionWebhookEvent
): Promise<any> {
  try {
    // Registrar que a mensagem foi enviada com sucesso
    const { data } = event

    if (data.key?.id) {
      await supabase
        .from('poupeja_notification_logs')
        .update({
          message_id: data.key.id,
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('metadata->>temp_id', data.tempId)
    }

    return {
      success: true,
      processed: true,
      message: 'Envio de mensagem registrado'
    }
  } catch (error) {
    console.error('Erro ao processar send.message:', error)
    return {
      success: false,
      processed: false,
      message: error.message
    }
  }
}

// ========== FUNÇÕES AUXILIARES ==========

async function processUserCommands(
  supabase: any,
  text: string,
  senderNumber: string,
  instance: string
): Promise<string[]> {
  const commands: string[] = []
  const lowerText = text.toLowerCase().trim()

  // Comando: PARAR - desativar lembretes
  if (lowerText === 'parar' || lowerText === 'stop') {
    await supabase
      .from('poupeja_whatsapp_settings')
      .update({ enable_reminders: false })
      .eq('whatsapp_number', senderNumber)
    
    await sendTextMessage(
      instance,
      senderNumber + '@s.whatsapp.net',
      '🔕 Lembretes desativados. Envie ATIVAR para reativar.'
    )
    commands.push('PARAR')
  }

  // Comando: ATIVAR - reativar lembretes
  if (lowerText === 'ativar' || lowerText === 'start') {
    await supabase
      .from('poupeja_whatsapp_settings')
      .update({ enable_reminders: true })
      .eq('whatsapp_number', senderNumber)
    
    await sendTextMessage(
      instance,
      senderNumber + '@s.whatsapp.net',
      '✅ Lembretes ativados! Você receberá notificações dos seus compromissos.'
    )
    commands.push('ATIVAR')
  }

  // Comando: AGENDA - listar próximos compromissos
  if (lowerText === 'agenda' || lowerText === 'compromissos') {
    const { data: userSettings } = await supabase
      .from('poupeja_whatsapp_settings')
      .select('user_id')
      .eq('whatsapp_number', senderNumber)
      .maybeSingle()

    if (userSettings) {
      const { data: appointments } = await supabase
        .from('poupeja_appointments')
        .select('*')
        .eq('user_id', userSettings.user_id)
        .eq('status', 'pending')
        .gte('appointment_date', new Date().toISOString())
        .order('appointment_date', { ascending: true })
        .limit(5)

      let message = '📅 *Seus Próximos Compromissos:*\n\n'
      
      if (appointments && appointments.length > 0) {
        appointments.forEach((apt: any, index: number) => {
          const date = new Date(apt.appointment_date)
          message += `${index + 1}. *${apt.title}*\n`
          message += `   📍 ${apt.location || 'Local não especificado'}\n`
          message += `   🕐 ${date.toLocaleString('pt-BR')}\n\n`
        })
      } else {
        message += 'Você não tem compromissos agendados.'
      }

      await sendTextMessage(
        instance,
        senderNumber + '@s.whatsapp.net',
        message
      )
      commands.push('AGENDA')
    }
  }

  // Comando: AJUDA - mostrar comandos disponíveis
  if (lowerText === 'ajuda' || lowerText === 'help' || lowerText === 'comandos') {
    const helpMessage = `🤖 *Comandos Disponíveis:*

📋 *AGENDA* - Ver próximos compromissos
🔕 *PARAR* - Desativar lembretes
✅ *ATIVAR* - Ativar lembretes
❓ *AJUDA* - Ver esta mensagem

_Renda AI - Sistema Financeiro Pessoal_`

    await sendTextMessage(
      instance,
      senderNumber + '@s.whatsapp.net',
      helpMessage
    )
    commands.push('AJUDA')
  }

  return commands
}

async function sendTextMessage(instance: string, number: string, text: string) {
  try {
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL')
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY')

    const response = await fetch(
      `${evolutionUrl}/message/sendText/${instance}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey!
        },
        body: JSON.stringify({
          number: number,
          text: text,
          delay: 1000
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Erro ao enviar mensagem: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return null
  }
}

async function sendConfirmationReply(instance: string, remoteJid: string, appointment: any) {
  const date = new Date(appointment.appointment_date)
  const message = `✅ *Compromisso Confirmado!*

📌 ${appointment.title}
📅 ${date.toLocaleDateString('pt-BR')}
🕐 ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}

Obrigado por confirmar!`

  await sendTextMessage(instance, remoteJid, message)
}

function mapMessageStatus(evolutionStatus: number): string {
  switch (evolutionStatus) {
    case 0: return 'pending'
    case 1: return 'sent'
    case 2: return 'sent'
    case 3: return 'delivered'
    case 4: return 'read'
    case 5: return 'failed'
    default: return 'unknown'
  }
}

async function notifyAdminsConnectionLost(supabase: any, instance: string) {
  // Buscar admins
  const { data: admins } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin')

  if (admins && admins.length > 0) {
    // Aqui você pode enviar email ou outra notificação
    console.log('Notificar admins sobre conexão perdida:', instance)
  }
}

async function logWebhookEvent(
  supabase: any,
  event: EvolutionWebhookEvent,
  result: any
) {
  try {
    // Criar log do webhook
    await supabase
      .from('poupeja_webhook_logs')
      .insert({
        instance: event.instance,
        event_type: event.event,
        success: result.success,
        processed: result.processed,
        message: result.message,
        payload: event,
        error_message: result.success ? null : result.message
      })
  } catch (error) {
    console.error('Erro ao registrar log do webhook:', error)
  }
}