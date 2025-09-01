import { supabase } from '@/integrations/supabase/client';
import { notificationService } from './notificationService';

export interface N8NTriggerData {
  type: 'appointment_created' | 'appointment_reminder' | 'transaction_due' | 'transaction_reminder' | 'goal_progress' | 'goal_achieved' | 'budget_exceeded' | 'custom';
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  data: {
    id?: string;
    title: string;
    description?: string;
    amount?: number;
    date?: string;
    category?: string;
    status?: string;
    location?: string;
    metadata?: Record<string, any>;
  };
  message?: string;
  metadata?: {
    evolutionApi?: {
      apiUrl?: string;
      apiKey?: string;
      instance?: string;
    };
    [key: string]: any;
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

  // Method to reset the service (for debugging)
  reset() {
    console.log('=== N8N DEBUG: Resetting N8N service ===');
    this.config = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('=== N8N DEBUG: Initializing n8n service ===');
      
      // Try different approaches to get the settings
      console.log('=== N8N DEBUG: Attempting to fetch n8n settings ===');
      
      const { data: settings, error } = await supabase
        .from('poupeja_settings')
        .select('key, value, category')
        .eq('category', 'integrations');

      console.log('=== N8N DEBUG: Settings query result:', { settings, error });

      if (error) {
        console.error('=== N8N DEBUG: Error fetching settings:', error);
        
        // Try without RLS as a fallback for debugging
        console.log('=== N8N DEBUG: Attempting service role query ===');
        const { data: adminSettings, error: adminError } = await supabase
          .rpc('get_setting', { p_category: 'integrations', p_key: 'n8n_webhook_url' });
        
        console.log('=== N8N DEBUG: Admin query result:', { adminSettings, adminError });
        
        throw error;
      }

      if (settings && settings.length > 0) {
        console.log('=== N8N DEBUG: Processing settings:', settings);
        
        this.config = settings.reduce((acc, setting) => {
          console.log(`=== N8N DEBUG: Adding ${setting.key} = ${setting.value}`);
          acc[setting.key] = setting.value;
          return acc;
        }, {} as Record<string, string>);
      } else {
        console.log('=== N8N DEBUG: No settings found, checking with direct query ===');
        
        // Direct query to test
        const { data: directSettings, error: directError } = await supabase
          .from('poupeja_settings')
          .select('*')
          .ilike('key', '%n8n%');
          
        console.log('=== N8N DEBUG: Direct n8n query:', { directSettings, directError });
        
        this.config = {};
      }

      console.log('=== N8N DEBUG: Final config:', this.config);
      this.isInitialized = true;
    } catch (error) {
      console.error('=== N8N DEBUG: Failed to initialize N8N integration:', error);
      this.config = {};
      this.isInitialized = true; // Continue even if initialization fails
    }
  }

  async triggerAutomation(data: N8NTriggerData): Promise<boolean> {
    console.log('=== N8N DEBUG: triggerAutomation called with data:', data);
    
    await this.initialize();
    console.log('=== N8N DEBUG: Initialized, config:', this.config);

    if (!this.isEnabled()) {
      console.log('=== N8N DEBUG: N8N integration is disabled');
      console.log('=== N8N DEBUG: Config state:', {
        n8n_enabled: this.config?.n8n_enabled,
        n8n_webhook_url: this.config?.n8n_webhook_url ? 'SET' : 'NOT SET'
      });
      return false;
    }

    try {
      // Enhanced payload structure matching the corrected N8N flow
      const payload = {
        type: data.type,
        user: data.user,
        data: data.data,
        message: data.message,
        timestamp: new Date().toISOString(),
        source: 'poupeja',
        metadata: {
          ...data.metadata,
          evolutionApi: {
            apiUrl: data.metadata?.evolutionApi?.apiUrl || this.config.evolution_api_url || 'https://sua-evolution-api.com',
            apiKey: data.metadata?.evolutionApi?.apiKey || this.config.evolution_api_key || 'sua-api-key-aqui',
            instance: data.metadata?.evolutionApi?.instance || this.config.n8n_instance_name || 'sua-instancia'
          }
        }
      };

      console.log('=== N8N DEBUG: Enhanced payload for corrected flow:', payload);
      console.log('=== N8N DEBUG: Evolution API Config:', payload.metadata.evolutionApi);
      console.log('=== N8N DEBUG: Webhook URL:', this.config.n8n_webhook_url);

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

      console.log('=== N8N DEBUG: Response status:', response.status);
      console.log('=== N8N DEBUG: Response headers:', Object.fromEntries(response.headers));

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No response text');
        console.error('=== N8N DEBUG: Response error text:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const responseData = await response.json().catch(() => ({ success: true }));
      console.log('=== N8N DEBUG: N8N automation triggered successfully, response:', responseData);
      return true;

    } catch (error) {
      console.error('=== N8N DEBUG: Failed to trigger N8N automation:', error);
      if (error.name === 'AbortError') {
        console.error('=== N8N DEBUG: Request timed out after 10 seconds');
      }
      return false;
    }
  }

  // Specific automation triggers
  async onAppointmentCreated(appointment: any, user: any) {
    return this.triggerAutomation({
      type: 'appointment_created',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      data: {
        id: appointment.id,
        title: appointment.title,
        description: appointment.description,
        date: appointment.appointment_date,
        location: appointment.location,
        category: appointment.category
      }
    });
  }

  async onTransactionDue(transaction: any, user: any) {
    return this.triggerAutomation({
      type: 'transaction_due',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      data: {
        id: transaction.id,
        title: transaction.description,
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.scheduled_date
      }
    });
  }

  async onGoalProgress(goal: any, user: any, progressPercent: number) {
    const eventType = progressPercent >= 100 ? 'goal_achieved' : 'goal_progress';
    
    return this.triggerAutomation({
      type: eventType,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      data: {
        id: goal.id,
        title: goal.name,
        amount: goal.current_amount,
        metadata: {
          target_amount: goal.target_amount,
          progress_percent: progressPercent,
          remaining_amount: goal.target_amount - goal.current_amount
        }
      }
    });
  }

  async onBudgetExceeded(budget: any, user: any, exceededAmount: number) {
    return this.triggerAutomation({
      type: 'budget_exceeded',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      data: {
        id: budget.id,
        title: `Orçamento: ${budget.category_name || 'Geral'}`,
        amount: exceededAmount,
        metadata: {
          budget_amount: budget.amount,
          spent_amount: budget.amount + exceededAmount,
          period: budget.period
        }
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
      type: 'custom',
      user: {
        id: 'test-user',
        name: 'Usuário Teste',
        email: 'teste@teste.com',
        phone: '5511999999999'
      },
      data: {
        title: 'Teste de Conexão N8N',
        description: 'Este é um teste de conectividade com o fluxo corrigido'
      },
      message: '🧪 *Teste de Conexão*\\n\\nOlá Usuário Teste!\\n\\nEste é um teste de conectividade do N8N com o PoupeJá.\\n\\n✅ Se você receber esta mensagem, a integração está funcionando!\\n\\n💡 *PoupeJá - Sistema de Teste*'
    });
  }
}

export const n8nIntegrationService = N8NIntegrationService.getInstance();