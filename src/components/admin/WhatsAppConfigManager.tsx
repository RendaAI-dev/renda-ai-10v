import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Webhook, Settings, TestTube } from 'lucide-react';

interface WhatsAppConfig {
  whatsapp_enabled: boolean;
  n8n_webhook_url: string;
  test_phone: string;
}

const WhatsAppConfigManager: React.FC = () => {
  const [config, setConfig] = useState<WhatsAppConfig>({
    whatsapp_enabled: true,
    n8n_webhook_url: 'https://n8n-webhook.rendaai.com.br/webhook/renda',
    test_phone: '+5537998743075',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-admin-settings', {
        body: { category: 'whatsapp' }
      });

      if (error) throw error;

      if (data?.settings) {
        setConfig({
          whatsapp_enabled: data.settings.whatsapp_enabled === 'true',
          n8n_webhook_url: data.settings.n8n_webhook_url || '',
          test_phone: data.settings.test_phone || '',
        });
      }
    } catch (error) {
      console.error('Error fetching WhatsApp config:', error);
      toast.error('Erro ao carregar configurações do WhatsApp');
    }
  };

  const saveConfig = async () => {
    setIsLoading(true);
    try {
      const settings = {
        whatsapp_enabled: config.whatsapp_enabled.toString(),
        n8n_webhook_url: config.n8n_webhook_url,
        test_phone: config.test_phone,
      };

      const { error } = await supabase.functions.invoke('update-admin-settings', {
        body: {
          category: 'whatsapp',
          settings
        }
      });

      if (error) throw error;

      toast.success('Configurações do WhatsApp salvas com sucesso!');
    } catch (error) {
      console.error('Error saving WhatsApp config:', error);
      toast.error('Erro ao salvar configurações do WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = async () => {
    if (!config.n8n_webhook_url) {
      toast.error('Configure a URL do webhook N8N primeiro');
      return;
    }

    if (!config.test_phone) {
      toast.error('Configure um telefone de teste primeiro');
      return;
    }

    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
        body: {
          type: 'appointment_reminder',
          user: {
            phone: config.test_phone,
            name: 'Usuário Teste'
          },
          appointment: {
            title: 'Teste de Notificação',
            date: new Date().toISOString(),
            location: 'Sistema PoupeJá',
            minutesUntil: 0
          },
          message: '🧪 Esta é uma mensagem de teste do sistema PoupeJá!\n\nSe você recebeu esta mensagem, a integração WhatsApp + N8N está funcionando corretamente.',
          webhookUrl: config.n8n_webhook_url
        }
      });

      if (error) throw error;

      toast.success('Notificação de teste enviada! Verifique o WhatsApp.');
    } catch (error) {
      console.error('Error testing notification:', error);
      toast.error('Erro ao enviar notificação de teste');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Configurações WhatsApp + N8N
        </CardTitle>
        <CardDescription>
          Configure a integração com N8N para envio de notificações via WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable WhatsApp */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Ativar Notificações WhatsApp</Label>
            <p className="text-sm text-muted-foreground">
              Habilite o envio de notificações via WhatsApp através do N8N
            </p>
          </div>
          <Switch
            checked={config.whatsapp_enabled}
            onCheckedChange={(checked) => 
              setConfig(prev => ({ ...prev, whatsapp_enabled: checked }))
            }
          />
        </div>

        {/* N8N Webhook URL */}
        <div className="space-y-2">
          <Label htmlFor="webhook-url" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            URL do Webhook N8N
          </Label>
          <Input
            id="webhook-url"
            type="url"
            placeholder="https://seu-n8n.com/webhook/whatsapp"
            value={config.n8n_webhook_url}
            onChange={(e) => 
              setConfig(prev => ({ ...prev, n8n_webhook_url: e.target.value }))
            }
          />
          <p className="text-sm text-muted-foreground">
            URL do webhook criado no N8N para receber as notificações
          </p>
        </div>

        {/* Test Phone */}
        <div className="space-y-2">
          <Label htmlFor="test-phone" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Telefone para Teste
          </Label>
          <Input
            id="test-phone"
            type="tel"
            placeholder="+5511999999999"
            value={config.test_phone}
            onChange={(e) => 
              setConfig(prev => ({ ...prev, test_phone: e.target.value }))
            }
          />
          <p className="text-sm text-muted-foreground">
            Número de telefone para enviar mensagens de teste (formato: +5511999999999)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={saveConfig}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {isLoading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>

          <Button
            variant="outline"
            onClick={testNotification}
            disabled={isTesting || !config.whatsapp_enabled}
            className="flex items-center gap-2"
          >
            <TestTube className="h-4 w-4" />
            {isTesting ? 'Testando...' : 'Testar Notificação'}
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium">Como configurar:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Crie um workflow no N8N com um trigger de webhook</li>
            <li>Configure o WhatsApp Business API no N8N</li>
            <li>Cole a URL do webhook N8N no campo acima</li>
            <li>Ative as notificações WhatsApp</li>
            <li>Teste com um número de telefone válido</li>
          </ol>
          
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-sm">
              <strong>Payload do N8N:</strong> O sistema enviará dados no formato JSON com informações do usuário, compromisso/transação e mensagem formatada.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppConfigManager;