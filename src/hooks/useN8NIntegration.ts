import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface N8NWebhookData {
  type: 'appointment_reminder' | 'transaction_reminder' | 'payment_due' | 'goal_achieved' | 'custom';
  user: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  data: {
    title: string;
    description?: string;
    amount?: number;
    date?: string;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
  };
  message: string;
  metadata?: Record<string, any>;
}

export interface N8NConfig {
  webhookUrl: string;
  apiKey?: string;
  instanceName?: string;
  enabled: boolean;
}

export const useN8NIntegration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<N8NConfig | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const { data: settings } = await supabase
        .from('poupeja_settings')
        .select('key, value')
        .in('key', ['n8n_webhook_url', 'n8n_api_key', 'n8n_instance_name', 'n8n_enabled'])
        .eq('category', 'integrations');

      if (settings) {
        const configMap = settings.reduce((acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {} as Record<string, string>);

        setConfig({
          webhookUrl: configMap.n8n_webhook_url || '',
          apiKey: configMap.n8n_api_key || '',
          instanceName: configMap.n8n_instance_name || '',
          enabled: configMap.n8n_enabled === 'true'
        });
      }
    } catch (error) {
      console.error('Error loading N8N config:', error);
    }
  }, []);

  const saveConfig = useCallback(async (newConfig: N8NConfig) => {
    setIsLoading(true);
    try {
      const settings = [
        { key: 'n8n_webhook_url', value: newConfig.webhookUrl },
        { key: 'n8n_api_key', value: newConfig.apiKey || '' },
        { key: 'n8n_instance_name', value: newConfig.instanceName || '' },
        { key: 'n8n_enabled', value: newConfig.enabled.toString() }
      ];

      for (const setting of settings) {
        await supabase.rpc('upsert_setting', {
          p_category: 'integrations',
          p_key: setting.key,
          p_value: setting.value,
          p_description: `N8N integration ${setting.key}`
        });
      }

      setConfig(newConfig);
      toast({
        title: 'Configuração salva',
        description: 'Configurações do N8N foram atualizadas com sucesso.'
      });
    } catch (error) {
      console.error('Error saving N8N config:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações do N8N.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const triggerWebhook = useCallback(async (data: N8NWebhookData) => {
    if (!config?.enabled || !config.webhookUrl) {
      throw new Error('N8N integration not configured or disabled');
    }

    setIsLoading(true);
    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
        },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
          source: 'poupeja'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json().catch(() => ({ success: true }));
      
      toast({
        title: 'Webhook enviado',
        description: 'Dados enviados para o N8N com sucesso.'
      });

      return result;
    } catch (error) {
      console.error('Error triggering N8N webhook:', error);
      toast({
        title: 'Erro no webhook',
        description: 'Falha ao enviar dados para o N8N.',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const testConnection = useCallback(async () => {
    if (!config?.webhookUrl) {
      toast({
        title: 'Erro',
        description: 'Configure a URL do webhook primeiro.',
        variant: 'destructive'
      });
      return false;
    }

    try {
      await triggerWebhook({
        type: 'custom',
        user: {
          id: 'test',
          name: 'Teste',
          phone: '5511999999999',
          email: 'teste@teste.com'
        },
        data: {
          title: 'Teste de Conexão',
          description: 'Este é um teste de conexão com o N8N'
        },
        message: 'Teste de conexão realizado com sucesso!'
      });
      return true;
    } catch {
      return false;
    }
  }, [config?.webhookUrl, triggerWebhook]);

  return {
    config,
    isLoading,
    loadConfig,
    saveConfig,
    triggerWebhook,
    testConnection
  };
};