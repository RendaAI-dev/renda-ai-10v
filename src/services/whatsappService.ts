import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppSettings {
  id: string;
  user_id: string;
  whatsapp_number?: string;
  whatsapp_verified: boolean;
  enable_reminders: boolean;
  default_reminder_times: number[];
  language: string;
  timezone: string;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  appointment_id?: string;
  whatsapp_number?: string;
  message_content?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplate {
  id: string;
  user_id?: string;
  template_type: 'reminder' | 'confirmation' | 'cancellation';
  title: string;
  message_content: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppQueueItem {
  id: string;
  user_id: string;
  appointment_id: string;
  whatsapp_number: string;
  message_content: string;
  scheduled_for: string;
  status: 'queued' | 'processing' | 'sent' | 'failed';
  priority: number;
  retry_count: number;
  max_retries: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

class WhatsAppService {
  // WhatsApp Settings
  async getSettings(): Promise<WhatsAppSettings | null> {
    const { data, error } = await supabase
      .from('poupeja_whatsapp_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data;
  }

  async updateSettings(settings: Partial<WhatsAppSettings>): Promise<WhatsAppSettings> {
    const { data, error } = await supabase
      .from('poupeja_whatsapp_settings')
      .upsert({
        ...settings,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Message Templates
  async getMessageTemplates(): Promise<MessageTemplate[]> {
    const { data, error } = await supabase
      .from('poupeja_message_templates')
      .select('*')
      .or('user_id.is.null,user_id.eq.' + (await supabase.auth.getUser()).data.user?.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return (data || []) as MessageTemplate[];
  }

  async createMessageTemplate(template: Omit<MessageTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<MessageTemplate> {
    const { data, error } = await supabase
      .from('poupeja_message_templates')
      .insert({
        ...template,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as MessageTemplate;
  }

  async updateMessageTemplate(template: MessageTemplate): Promise<MessageTemplate> {
    const { data, error } = await supabase
      .from('poupeja_message_templates')
      .update(template)
      .eq('id', template.id)
      .select()
      .single();

    if (error) throw error;
    return data as MessageTemplate;
  }

  async deleteMessageTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('poupeja_message_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Notification Logs
  async getNotificationLogs(): Promise<NotificationLog[]> {
    const { data, error } = await supabase
      .from('poupeja_notification_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as NotificationLog[];
  }

  async createNotificationLog(log: Omit<NotificationLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<NotificationLog> {
    const { data, error } = await supabase
      .from('poupeja_notification_logs')
      .insert({
        ...log,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as NotificationLog;
  }

  // WhatsApp Queue
  async addToQueue(queueItem: Omit<WhatsAppQueueItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<WhatsAppQueueItem> {
    const { data, error } = await supabase
      .from('poupeja_whatsapp_queue')
      .insert({
        ...queueItem,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as WhatsAppQueueItem;
  }

  async getQueueItems(): Promise<WhatsAppQueueItem[]> {
    const { data, error } = await supabase
      .from('poupeja_whatsapp_queue')
      .select('*')
      .order('scheduled_for', { ascending: true });

    if (error) throw error;
    return (data || []) as WhatsAppQueueItem[];
  }

  async updateQueueItem(id: string, updates: Partial<WhatsAppQueueItem>): Promise<WhatsAppQueueItem> {
    const { data, error } = await supabase
      .from('poupeja_whatsapp_queue')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as WhatsAppQueueItem;
  }

  // Send WhatsApp Message
  async sendWhatsAppMessage(phoneNumber: string, message: string, appointmentId?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
        body: {
          phoneNumber,
          message,
          appointmentId
        }
      });

      if (error) throw error;
      return { success: true, messageId: data?.messageId };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return { success: false, error: error.message };
    }
  }

  // Schedule Reminder
  async scheduleReminder(appointmentId: string, reminderTimes: number[]): Promise<void> {
    const settings = await this.getSettings();
    if (!settings?.enable_reminders || !settings?.whatsapp_number) {
      throw new Error('WhatsApp reminders not configured');
    }

    // Get appointment details
    const { data: appointment, error } = await supabase
      .from('poupeja_appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      throw new Error('Appointment not found');
    }

    // Get message template
    const templates = await this.getMessageTemplates();
    const reminderTemplate = templates.find(t => t.template_type === 'reminder' && t.is_default);
    
    if (!reminderTemplate) {
      throw new Error('Reminder template not found');
    }

    // Schedule messages for each reminder time
    for (const minutesBefore of reminderTimes) {
      const scheduledDate = new Date(appointment.appointment_date);
      scheduledDate.setMinutes(scheduledDate.getMinutes() - minutesBefore);

      // Don't schedule past reminders
      if (scheduledDate <= new Date()) continue;

      const message = this.formatMessageTemplate(reminderTemplate.message_content, appointment);

      await this.addToQueue({
        appointment_id: appointmentId,
        whatsapp_number: settings.whatsapp_number,
        message_content: message,
        scheduled_for: scheduledDate.toISOString(),
        status: 'queued',
        priority: 0,
        retry_count: 0,
        max_retries: 3
      });
    }
  }

  // Format message template with appointment data
  private formatMessageTemplate(template: string, appointment: any): string {
    const appointmentDate = new Date(appointment.appointment_date);
    const formattedDate = appointmentDate.toLocaleDateString('pt-BR');
    const formattedTime = appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return template
      .replace(/\{\{date\}\}/g, formattedDate)
      .replace(/\{\{time\}\}/g, formattedTime)
      .replace(/\{\{description\}\}/g, appointment.description || 'Sem descrição')
      .replace(/\{\{location\}\}/g, appointment.location || 'Local não informado')
      .replace(/\{\{title\}\}/g, appointment.title);
  }

  // Verify WhatsApp number
  async verifyWhatsAppNumber(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-whatsapp-number', {
        body: { phoneNumber }
      });

      if (error) throw error;
      
      if (data?.verified) {
        await this.updateSettings({
          whatsapp_number: phoneNumber,
          whatsapp_verified: true
        });
      }

      return { success: data?.verified };
    } catch (error) {
      console.error('Error verifying WhatsApp number:', error);
      return { success: false, error: error.message };
    }
  }
}

export const whatsappService = new WhatsAppService();