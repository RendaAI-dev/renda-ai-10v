import { supabase } from '@/integrations/supabase/client';
import { notificationService } from './notificationService';

export interface N8NTriggerData {
  event: 'appointment_created' | 'transaction_due' | 'goal_progress' | 'payment_reminder' | 'budget_exceeded';
  userId: string;
  data: {
    id: string;
    title: string;
    description?: string;
    amount?: number;
    date?: string;
    category?: string;
    status?: string;
    metadata?: Record<string, any>;
  };
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  automationRules?: {
    sendWhatsApp?: boolean;
    sendEmail?: boolean;
    reminderMinutes?: number;
    priority?: 'low' | 'medium' | 'high';
  };
}

class N8NIntegrationService {
  private static instance: N8NIntegrationService;
  private config: any = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): N8NIntegrationService {
    if (!N8NIntegrationService.instance) {
      N8NIntegrationService.instance = new N8NIntegrationService();
    }
    return N8NIntegrationService.instance;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      const { data: settings } = await supabase
        .from('poupeja_settings')
        .select('key, value')
        .eq('category', 'integrations')
        .in('key', ['n8n_webhook_url', 'n8n_enabled', 'n8n_api_key', 'n8n_instance_name']);

      if (settings) {
        this.config = settings.reduce((acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {} as Record<string, string>);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize N8N integration:', error);
    }
  }

  async triggerAutomation(data: N8NTriggerData): Promise<boolean> {
    await this.initialize();

    if (!this.isEnabled()) {
      console.log('N8N integration is disabled');
      return false;
    }

    try {
      const payload = {
        event: data.event,
        timestamp: new Date().toISOString(),
        source: 'poupeja',
        user: data.user,
        data: data.data,
        automationRules: data.automationRules || {},
        config: {
          evolutionApi: {
            instance: this.config.n8n_instance_name,
            apiUrl: this.config.evolution_api_url
          }
        }
      };

      console.log('Triggering N8N automation:', payload);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(this.config.n8n_webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.n8n_api_key && { 
            'Authorization': `Bearer ${this.config.n8n_api_key}` 
          })
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('N8N automation triggered successfully');
      return true;

    } catch (error) {
      console.error('Failed to trigger N8N automation:', error);
      return false;
    }
  }

  // Specific automation triggers
  async onAppointmentCreated(appointment: any, user: any) {
    return this.triggerAutomation({
      event: 'appointment_created',
      userId: user.id,
      data: {
        id: appointment.id,
        title: appointment.title,
        description: appointment.description,
        date: appointment.appointment_date,
        category: appointment.category,
        status: appointment.status
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      automationRules: {
        sendWhatsApp: appointment.reminder_enabled,
        reminderMinutes: appointment.reminder_times?.[0] || 60,
        priority: 'medium'
      }
    });
  }

  async onTransactionDue(transaction: any, user: any) {
    return this.triggerAutomation({
      event: 'transaction_due',
      userId: user.id,
      data: {
        id: transaction.id,
        title: transaction.description,
        amount: transaction.amount,
        date: transaction.scheduled_date,
        status: transaction.status
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      automationRules: {
        sendWhatsApp: transaction.reminder_enabled,
        reminderMinutes: transaction.reminder_time || 60,
        priority: 'high'
      }
    });
  }

  async onGoalProgress(goal: any, user: any, progressPercent: number) {
    const priority = progressPercent >= 90 ? 'high' : progressPercent >= 50 ? 'medium' : 'low';
    
    return this.triggerAutomation({
      event: 'goal_progress',
      userId: user.id,
      data: {
        id: goal.id,
        title: goal.name,
        amount: goal.current_amount,
        metadata: {
          target_amount: goal.target_amount,
          progress_percent: progressPercent,
          remaining_amount: goal.target_amount - goal.current_amount
        }
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      automationRules: {
        sendWhatsApp: progressPercent >= 25, // Send WhatsApp for significant progress
        priority
      }
    });
  }

  async onBudgetExceeded(budget: any, user: any, exceededAmount: number) {
    return this.triggerAutomation({
      event: 'budget_exceeded',
      userId: user.id,
      data: {
        id: budget.id,
        title: `Orçamento: ${budget.category_name || 'Geral'}`,
        amount: exceededAmount,
        metadata: {
          budget_amount: budget.amount,
          spent_amount: budget.amount + exceededAmount,
          period: budget.period
        }
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      automationRules: {
        sendWhatsApp: true,
        priority: 'high'
      }
    });
  }

  private isEnabled(): boolean {
    return this.config?.n8n_enabled === 'true' && !!this.config?.n8n_webhook_url;
  }

  // Test connection method
  async testConnection(): Promise<boolean> {
    await this.initialize();
    
    if (!this.isEnabled()) {
      throw new Error('N8N integration is not enabled or configured');
    }

    return this.triggerAutomation({
      event: 'appointment_created',
      userId: 'test-user',
      data: {
        id: 'test-id',
        title: 'Teste de Conexão N8N',
        description: 'Este é um teste de conectividade'
      },
      user: {
        id: 'test-user',
        name: 'Usuário Teste',
        email: 'teste@teste.com',
        phone: '5511999999999'
      },
      automationRules: {
        sendWhatsApp: false,
        priority: 'low'
      }
    });
  }
}

export const n8nIntegrationService = N8NIntegrationService.getInstance();