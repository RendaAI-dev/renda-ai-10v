import { useState, useEffect } from 'react';
import { whatsappService, WhatsAppSettings } from '@/services/whatsappService';
import { useToast } from '@/hooks/use-toast';

export const useWhatsAppSettings = () => {
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await whatsappService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching WhatsApp settings:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar configurações do WhatsApp',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<WhatsAppSettings>) => {
    try {
      const updatedSettings = await whatsappService.updateSettings(updates);
      setSettings(updatedSettings);
      toast({
        title: 'Sucesso',
        description: 'Configurações do WhatsApp atualizadas',
      });
      return updatedSettings;
    } catch (error) {
      console.error('Error updating WhatsApp settings:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar configurações do WhatsApp',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const verifyWhatsAppNumber = async (phoneNumber: string) => {
    try {
      const result = await whatsappService.verifyWhatsAppNumber(phoneNumber);
      if (result.success) {
        await fetchSettings(); // Refresh settings after verification
        toast({
          title: 'Sucesso',
          description: 'Número WhatsApp verificado com sucesso',
        });
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Falha na verificação do número WhatsApp',
          variant: 'destructive',
        });
      }
      return result;
    } catch (error) {
      console.error('Error verifying WhatsApp number:', error);
      toast({
        title: 'Erro',
        description: 'Falha na verificação do número WhatsApp',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  const toggleReminders = async () => {
    const currentEnabled = settings?.enable_reminders ?? false;
    await updateSettings({ enable_reminders: !currentEnabled });
  };

  const updateReminderTimes = async (times: number[]) => {
    await updateSettings({ default_reminder_times: times });
  };

  const updateQuietHours = async (start: string, end: string) => {
    await updateSettings({ 
      quiet_hours_start: start, 
      quiet_hours_end: end 
    });
  };

  return {
    settings,
    loading,
    updateSettings,
    verifyWhatsAppNumber,
    toggleReminders,
    updateReminderTimes,
    updateQuietHours,
    refreshSettings: fetchSettings,
  };
};