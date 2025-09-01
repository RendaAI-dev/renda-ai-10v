import { useState, useCallback } from 'react';
import { whatsappService } from '@/services/whatsappService';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  title: string;
  description?: string;
  appointment_date: string;
  location?: string;
  user_id: string;
}

export const useWhatsAppNotifications = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Schedule reminders for a new appointment
  const scheduleAppointmentReminders = useCallback(async (appointment: Appointment) => {
    try {
      setLoading(true);

      // Get user's WhatsApp settings
      const settings = await whatsappService.getSettings();
      
      if (!settings?.enable_reminders || !settings?.whatsapp_number || !settings?.whatsapp_verified) {
        console.log('WhatsApp reminders not configured for appointment:', appointment.id);
        return { success: false, reason: 'not_configured' };
      }

      // Schedule reminders using the default reminder times
      await whatsappService.scheduleReminder(
        appointment.id,
        settings.default_reminder_times || [30, 1440] // Default: 30 min and 24h before
      );

      toast({
        title: 'Lembretes Agendados',
        description: `Lembretes WhatsApp configurados para "${appointment.title}"`,
      });

      return { success: true };
    } catch (error) {
      console.error('Error scheduling WhatsApp reminders:', error);
      toast({
        title: 'Erro ao Agendar Lembretes',
        description: error.message || 'Falha ao configurar lembretes WhatsApp',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Send immediate WhatsApp notification
  const sendImmediateNotification = useCallback(async (
    phoneNumber: string,
    message: string,
    appointmentId?: string
  ) => {
    try {
      setLoading(true);
      
      const result = await whatsappService.sendWhatsAppMessage(phoneNumber, message, appointmentId);
      
      if (result.success) {
        toast({
          title: 'Mensagem Enviada',
          description: 'Notificação WhatsApp enviada com sucesso',
        });
      } else {
        toast({
          title: 'Erro no Envio',
          description: result.error || 'Falha ao enviar mensagem WhatsApp',
          variant: 'destructive',
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error sending immediate WhatsApp notification:', error);
      toast({
        title: 'Erro no Envio',
        description: 'Falha ao enviar notificação WhatsApp',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Send appointment confirmation
  const sendAppointmentConfirmation = useCallback(async (appointment: Appointment) => {
    try {
      const settings = await whatsappService.getSettings();
      
      if (!settings?.whatsapp_number || !settings?.whatsapp_verified) {
        return { success: false, reason: 'not_configured' };
      }

      // Get confirmation template
      const templates = await whatsappService.getMessageTemplates();
      const confirmationTemplate = templates.find(t => t.template_type === 'appointment_confirmation' && t.is_system);
      
      if (!confirmationTemplate) {
        return { success: false, reason: 'template_not_found' };
      }

      // Format message with appointment details
      const appointmentDate = new Date(appointment.appointment_date);
      const formattedDate = appointmentDate.toLocaleDateString('pt-BR');
      const formattedTime = appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const message = confirmationTemplate.content
        .replace(/\{\{date\}\}/g, formattedDate)
        .replace(/\{\{time\}\}/g, formattedTime)
        .replace(/\{\{description\}\}/g, appointment.description || 'Sem descrição')
        .replace(/\{\{location\}\}/g, appointment.location || 'Local não informado')
        .replace(/\{\{title\}\}/g, appointment.title);

      return await sendImmediateNotification(settings.whatsapp_number, message, appointment.id);
    } catch (error) {
      console.error('Error sending appointment confirmation:', error);
      return { success: false, error: error.message };
    }
  }, [sendImmediateNotification]);

  // Send appointment cancellation
  const sendAppointmentCancellation = useCallback(async (appointment: Appointment) => {
    try {
      const settings = await whatsappService.getSettings();
      
      if (!settings?.whatsapp_number || !settings?.whatsapp_verified) {
        return { success: false, reason: 'not_configured' };
      }

      // Get cancellation template
      const templates = await whatsappService.getMessageTemplates();
      const cancellationTemplate = templates.find(t => t.template_type === 'appointment_cancellation' && t.is_system);
      
      if (!cancellationTemplate) {
        return { success: false, reason: 'template_not_found' };
      }

      // Format message with appointment details
      const appointmentDate = new Date(appointment.appointment_date);
      const formattedDate = appointmentDate.toLocaleDateString('pt-BR');
      const formattedTime = appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const message = cancellationTemplate.content
        .replace(/\{\{date\}\}/g, formattedDate)
        .replace(/\{\{time\}\}/g, formattedTime)
        .replace(/\{\{description\}\}/g, appointment.description || 'Sem descrição')
        .replace(/\{\{location\}\}/g, appointment.location || 'Local não informado')
        .replace(/\{\{title\}\}/g, appointment.title);

      return await sendImmediateNotification(settings.whatsapp_number, message, appointment.id);
    } catch (error) {
      console.error('Error sending appointment cancellation:', error);
      return { success: false, error: error.message };
    }
  }, [sendImmediateNotification]);

  return {
    loading,
    scheduleAppointmentReminders,
    sendImmediateNotification,
    sendAppointmentConfirmation,
    sendAppointmentCancellation,
  };
};