import { supabase } from '@/integrations/supabase/client';

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

interface WhatsAppNotificationData {
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
}

export class NotificationService {
  private static instance: NotificationService;
  private permissionGranted = false;

  private constructor() {
    this.init();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async init() {
    if ('Notification' in window) {
      this.permissionGranted = Notification.permission === 'granted';
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permissionGranted = true;
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    this.permissionGranted = permission === 'granted';
    return this.permissionGranted;
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.permissionGranted) {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/pwa-icons/icon-192x192.png',
        badge: '/pwa-icons/icon-192x192.png',
        ...options,
      });

      // Auto close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  isPermissionGranted(): boolean {
    return this.permissionGranted && Notification.permission === 'granted';
  }

  async showReminderNotification(
    transactionType: 'income' | 'expense',
    amount: number,
    description: string,
    minutesUntil: number
  ): Promise<void> {
    const typeText = transactionType === 'income' ? 'Receita' : 'Despesa';
    const timeText = this.formatTimeUntil(minutesUntil);
    
    const title = `💰 Lembrete: ${typeText} ${timeText}`;
    const body = `${description} - R$ ${amount.toFixed(2)}`;

    await this.showNotification(title, {
      body,
      tag: `reminder-${Date.now()}`,
      requireInteraction: true,
    });
  }

  private formatTimeUntil(minutes: number): string {
    if (minutes <= 0) return 'agora';
    if (minutes < 60) return `em ${minutes} minutos`;
    if (minutes < 1440) return `em ${Math.round(minutes / 60)} horas`;
    return `em ${Math.round(minutes / 1440)} dias`;
  }

  async sendWhatsAppNotification(data: WhatsAppNotificationData): Promise<boolean> {
    try {
      // Get N8N webhook URL from settings
      const { data: settingsData, error } = await supabase.functions.invoke('get-public-settings', {
        body: { category: 'whatsapp' }
      });

      if (error) {
        console.error('Error fetching WhatsApp settings:', error);
        return false;
      }

      const webhookUrl = settingsData?.settings?.n8n_webhook_url;
      const whatsappEnabled = settingsData?.settings?.whatsapp_enabled === 'true';

      if (!whatsappEnabled || !webhookUrl) {
        console.log('WhatsApp notifications disabled or webhook URL not configured');
        return false;
      }

      // Send to N8N via edge function
      const { data: result, error: functionError } = await supabase.functions.invoke('send-whatsapp-notification', {
        body: {
          ...data,
          webhookUrl
        }
      });

      if (functionError) {
        console.error('Error sending WhatsApp notification:', functionError);
        return false;
      }

      console.log('WhatsApp notification sent successfully:', result);
      return true;

    } catch (error) {
      console.error('Error in sendWhatsAppNotification:', error);
      return false;
    }
  }

  async showAppointmentReminderNotification(
    appointment: any,
    minutesUntil: number,
    userPhone?: string,
    userName?: string
  ): Promise<void> {
    const timeText = this.formatTimeUntil(minutesUntil);
    const title = `📅 Lembrete: ${appointment.title} ${timeText}`;
    const body = `${appointment.description || ''} ${appointment.location ? `- ${appointment.location}` : ''}`.trim();

    // Send browser notification
    await this.showNotification(title, {
      body,
      tag: `appointment-${appointment.id}-${Date.now()}`,
      requireInteraction: true,
    });

    // Send WhatsApp notification if user data is available
    if (userPhone && userName) {
      await this.sendWhatsAppNotification({
        type: 'appointment_reminder',
        user: {
          phone: userPhone,
          name: userName
        },
        appointment: {
          title: appointment.title,
          date: appointment.appointmentDate,
          location: appointment.location,
          minutesUntil
        },
        message: `${title}\n${body}`
      });
    }
  }

  async showTransactionReminderNotification(
    transactionType: 'income' | 'expense',
    amount: number,
    description: string,
    minutesUntil: number,
    userPhone?: string,
    userName?: string
  ): Promise<void> {
    const typeText = transactionType === 'income' ? 'Receita' : 'Despesa';
    const timeText = this.formatTimeUntil(minutesUntil);
    const title = `💰 Lembrete: ${typeText} ${timeText}`;
    const body = `${description} - R$ ${amount.toFixed(2)}`;

    // Send browser notification
    await this.showReminderNotification(transactionType, amount, description, minutesUntil);

    // Send WhatsApp notification if user data is available
    if (userPhone && userName) {
      await this.sendWhatsAppNotification({
        type: 'transaction_reminder',
        user: {
          phone: userPhone,
          name: userName
        },
        transaction: {
          type: transactionType,
          amount,
          description,
          minutesUntil
        },
        message: `${title}\n${body}`
      });
    }
  }
}

export const notificationService = NotificationService.getInstance();