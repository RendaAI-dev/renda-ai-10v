interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
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
}

export const notificationService = NotificationService.getInstance();