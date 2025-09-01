import { supabase } from '@/integrations/supabase/client';

export interface Appointment {
  id?: string;
  user_id?: string;
  title: string;
  description?: string;
  appointment_date: string;
  category: string;
  location?: string;
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  status: 'pending' | 'completed' | 'cancelled';
  reminder_enabled: boolean;
  reminder_times?: number[];
  reminder_sent?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WhatsAppSettings {
  id?: string;
  user_id?: string;
  whatsapp_number?: string;
  whatsapp_verified: boolean;
  enable_reminders: boolean;
  default_reminder_times: number[];
  language: string;
  timezone: string;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export interface NotificationLog {
  id: string;
  appointment_id: string;
  notification_type: string;
  channel: string;
  status: string;
  reminder_time_minutes: number;
  recipient: string;
  message_content: string;
  sent_at?: string;
  created_at: string;
}

class AppointmentsService {
  // ========== APPOINTMENTS ==========
  
  async getAppointments(userId: string) {
    const { data, error } = await supabase
      .from('poupeja_appointments')
      .select('*')
      .eq('user_id', userId)
      .order('appointment_date', { ascending: true });

    if (error) throw error;
    return data;
  }

  async getUpcomingAppointments(userId: string) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('poupeja_appointments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('appointment_date', now)
      .order('appointment_date', { ascending: true })
      .limit(10);

    if (error) throw error;
    return data;
  }

  async getAppointmentById(id: string) {
    const { data, error } = await supabase
      .from('poupeja_appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createAppointment(appointment: Appointment) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('poupeja_appointments')
      .insert({
        ...appointment,
        user_id: userData.user.id,
        reminder_times: appointment.reminder_times || [30, 1440]
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateAppointment(id: string, appointment: Partial<Appointment>) {
    const { data, error } = await supabase
      .from('poupeja_appointments')
      .update(appointment)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAppointment(id: string) {
    const { error } = await supabase
      .from('poupeja_appointments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async completeAppointment(id: string) {
    return this.updateAppointment(id, { status: 'completed' });
  }

  async cancelAppointment(id: string) {
    return this.updateAppointment(id, { status: 'cancelled' });
  }

  // ========== WHATSAPP SETTINGS ==========

  async getWhatsAppSettings(userId: string): Promise<WhatsAppSettings | null> {
    const { data, error } = await supabase
      .from('poupeja_whatsapp_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async saveWhatsAppSettings(settings: Partial<WhatsAppSettings>) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const existingSettings = await this.getWhatsAppSettings(userData.user.id);

    if (existingSettings) {
      // Update
      const { data, error } = await supabase
        .from('poupeja_whatsapp_settings')
        .update(settings)
        .eq('user_id', userData.user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('poupeja_whatsapp_settings')
        .insert({
          ...settings,
          user_id: userData.user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  async verifyWhatsAppNumber(number: string): Promise<boolean> {
    // Validação básica do formato
    const phoneRegex = /^[0-9]{10,15}$/;
    const cleanNumber = number.replace(/\D/g, '');
    
    if (!phoneRegex.test(cleanNumber)) {
      throw new Error('Número de WhatsApp inválido');
    }

    // Aqui você pode adicionar uma chamada para verificar o número via Evolution API
    // Por enquanto, apenas salva como verificado
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    await this.saveWhatsAppSettings({
      whatsapp_number: cleanNumber,
      whatsapp_verified: true
    });

    return true;
  }

  // ========== NOTIFICATION LOGS ==========

  async getNotificationLogs(userId: string, appointmentId?: string) {
    let query = supabase
      .from('poupeja_notification_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (appointmentId) {
      query = query.eq('appointment_id', appointmentId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getRecentNotifications(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('poupeja_notification_logs')
      .select(`
        *,
        appointment:poupeja_appointments(title, appointment_date)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // ========== MESSAGE TEMPLATES ==========

  async getMessageTemplates() {
    const { data, error } = await supabase
      .from('poupeja_message_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data;
  }

  // ========== STATISTICS ==========

  async getAppointmentStats(userId: string) {
    const now = new Date().toISOString();
    
    // Total de compromissos
    const { count: totalCount } = await supabase
      .from('poupeja_appointments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Compromissos pendentes
    const { count: pendingCount } = await supabase
      .from('poupeja_appointments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('appointment_date', now);

    // Compromissos concluídos
    const { count: completedCount } = await supabase
      .from('poupeja_appointments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Notificações enviadas
    const { count: notificationsSent } = await supabase
      .from('poupeja_notification_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'sent');

    return {
      total: totalCount || 0,
      pending: pendingCount || 0,
      completed: completedCount || 0,
      notificationsSent: notificationsSent || 0
    };
  }

  // ========== CALENDAR HELPERS ==========

  async getAppointmentsByDateRange(userId: string, startDate: Date, endDate: Date) {
    const { data, error } = await supabase
      .from('poupeja_appointments')
      .select('*')
      .eq('user_id', userId)
      .gte('appointment_date', startDate.toISOString())
      .lte('appointment_date', endDate.toISOString())
      .order('appointment_date');

    if (error) throw error;
    return data;
  }

  async getMonthlyAppointments(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    return this.getAppointmentsByDateRange(userId, startDate, endDate);
  }
}

export const appointmentsService = new AppointmentsService();