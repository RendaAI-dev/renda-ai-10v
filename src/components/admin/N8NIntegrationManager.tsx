import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Webhook, 
  Settings, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Zap,
  Database
} from 'lucide-react';
import { useN8NIntegration, type N8NConfig } from '@/hooks/useN8NIntegration';
import { toast } from '@/hooks/use-toast';

const N8NIntegrationManager: React.FC = () => {
  const { config, isLoading, loadConfig, saveConfig, testConnection } = useN8NIntegration();
  const [formData, setFormData] = useState<N8NConfig>({
    webhookUrl: '',
    apiKey: '',
    instanceName: '',
    enabled: false
  });
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleSave = async () => {
    if (formData.enabled && !formData.webhookUrl) {
      toast({
        title: 'Erro',
        description: 'URL do webhook é obrigatória quando a integração está ativada.',
        variant: 'destructive'
      });
      return;
    }

    await saveConfig(formData);
  };

  const handleTest = async () => {
    setIsTesting(true);
    const success = await testConnection();
    
    toast({
      title: success ? 'Teste realizado' : 'Falha no teste',
      description: success 
        ? 'Conexão com N8N funcionando corretamente!'
        : 'Verifique as configurações e tente novamente.',
      variant: success ? 'default' : 'destructive'
    });
    
    setIsTesting(false);
  };

  const integrationFeatures = [
    {
      icon: MessageSquare,
      title: 'WhatsApp Automático',
      description: 'Envio automático de lembretes via WhatsApp'
    },
    {
      icon: Database,
      title: 'Sincronização Supabase',
      description: 'Dados sincronizados em tempo real'
    },
    {
      icon: Zap,
      title: 'Workflows Personalizados',
      description: 'Automações customizadas no N8N'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            <CardTitle>Integração N8N + Evolution API</CardTitle>
          </div>
          <CardDescription>
            Configure a integração completa entre N8N, Supabase e Evolution API para automações avançadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="enabled">Ativar Integração</Label>
              <p className="text-sm text-muted-foreground">
                Habilitar automações via N8N
              </p>
            </div>
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, enabled: checked }))
              }
            />
          </div>

          <Separator />

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">URL do Webhook N8N *</Label>
              <Input
                id="webhookUrl"
                placeholder="https://seu-n8n.com/webhook/poupeja-integration"
                value={formData.webhookUrl}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instanceName">Nome da Instância Evolution API</Label>
              <Input
                id="instanceName"
                placeholder="poupeja-instance"
                value={formData.instanceName}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, instanceName: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key (Opcional)</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Chave de API para autenticação"
                value={formData.apiKey}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, apiKey: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="flex-1"
            >
              <Settings className="mr-2 h-4 w-4" />
              {isLoading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleTest}
              disabled={!formData.webhookUrl || isTesting}
            >
              <TestTube className="mr-2 h-4 w-4" />
              {isTesting ? 'Testando...' : 'Testar'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={formData.enabled ? 'default' : 'secondary'}>
              {formData.enabled ? (
                <CheckCircle className="mr-1 h-3 w-3" />
              ) : (
                <XCircle className="mr-1 h-3 w-3" />
              )}
              {formData.enabled ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recursos da Integração</CardTitle>
          <CardDescription>
            Funcionalidades disponíveis com a integração N8N
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {integrationFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <feature.icon className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <h4 className="font-medium">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default N8NIntegrationManager;