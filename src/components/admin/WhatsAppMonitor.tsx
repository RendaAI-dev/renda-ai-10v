import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  WifiOff, 
  Wifi, 
  QrCode, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Activity,
  Send,
  Database
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface EvolutionConfig {
  id: string;
  instance_name: string;
  api_url: string;
  connection_status: string;
  last_connection_check?: string;
  qr_code?: string;
  phone_connected?: string;
  metadata?: any;
}

interface WebhookLog {
  id: string;
  instance: string;
  event_type: string;
  success: boolean;
  processed: boolean;
  message?: string;
  payload?: any;
  created_at: string;
}

interface NotificationStats {
  total_sent: number;
  total_failed: number;
  total_pending: number;
  sent_today: number;
  sent_this_week: number;
  sent_this_month: number;
}

export default function WhatsAppMonitor() {
  const { toast } = useToast();
  const [config, setConfig] = useState<EvolutionConfig | null>(null);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total_sent: 0,
    total_failed: 0,
    total_pending: 0,
    sent_today: 0,
    sent_this_week: 0,
    sent_this_month: 0
  });
  const [loading, setLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [testNumber, setTestNumber] = useState('');
  const [testMessage, setTestMessage] = useState('🔔 Teste de integração Renda AI com WhatsApp!');
  const [sendingTest, setSendingTest] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadData();
    
    // Auto refresh a cada 10 segundos
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadData(true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      // Carregar configuração
      const { data: configData } = await supabase
        .from('poupeja_evolution_config')
        .select('*')
        .maybeSingle();

      if (configData) {
        setConfig(configData);
      }

      // Carregar logs do webhook
      const { data: logsData } = await supabase
        .from('poupeja_webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsData) {
        setWebhookLogs(logsData);
      }

      // Carregar estatísticas
      await loadStats();

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      if (!silent) {
        toast({
          title: "Erro",
          description: "Erro ao carregar dados de monitoramento",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Total de notificações
      const { count: totalSent } = await supabase
        .from('poupeja_notification_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent');

      const { count: totalFailed } = await supabase
        .from('poupeja_notification_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed');

      const { count: totalPending } = await supabase
        .from('poupeja_message_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Enviadas hoje
      const { count: sentToday } = await supabase
        .from('poupeja_notification_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent')
        .gte('sent_at', today.toISOString());

      // Enviadas esta semana
      const { count: sentWeek } = await supabase
        .from('poupeja_notification_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent')
        .gte('sent_at', weekAgo.toISOString());

      // Enviadas este mês
      const { count: sentMonth } = await supabase
        .from('poupeja_notification_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent')
        .gte('sent_at', monthAgo.toISOString());

      setStats({
        total_sent: totalSent || 0,
        total_failed: totalFailed || 0,
        total_pending: totalPending || 0,
        sent_today: sentToday || 0,
        sent_this_week: sentWeek || 0,
        sent_this_month: sentMonth || 0
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleReconnect = async () => {
    if (!config) return;
    
    try {
      setReconnecting(true);
      
      // Chamar edge function para reconectar
      const { data, error } = await supabase.functions.invoke('evolution-reconnect', {
        body: {
          instance_name: config.instance_name
        }
      });

      if (error) throw error;

      if (data?.qrcode) {
        toast({
          title: "QR Code gerado!",
          description: "Escaneie com seu WhatsApp para conectar"
        });
        loadData();
      } else {
        toast({
          title: "Erro",
          description: "Erro ao gerar QR Code",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao reconectar:', error);
      toast({
        title: "Erro",
        description: "Erro ao tentar reconectar",
        variant: "destructive"
      });
    } finally {
      setReconnecting(false);
    }
  };

  const handleSendTest = async () => {
    if (!testNumber || !testMessage || !config) {
      toast({
        title: "Erro",
        description: "Preencha o número e a mensagem",
        variant: "destructive"
      });
      return;
    }

    try {
      setSendingTest(true);
      
      // Formatar número
      const cleanNumber = testNumber.replace(/\D/g, '');
      const fullNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;

      // Enviar através da edge function
      const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
        body: {
          recipient_number: fullNumber,
          message_content: testMessage,
          notification_type: 'test_message',
          channel: 'whatsapp'
        }
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Mensagem de teste enviada!"
      });
      setTestNumber('');
    } catch (error) {
      console.error('Erro ao enviar teste:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem de teste",
        variant: "destructive"
      });
    } finally {
      setSendingTest(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Conectado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Aguardando</Badge>;
      case 'disconnected':
        return <Badge className="bg-red-100 text-red-800"><WifiOff className="h-3 w-3 mr-1" />Desconectado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('message')) return <MessageSquare className="h-4 w-4" />;
    if (eventType.includes('connection')) return <Wifi className="h-4 w-4" />;
    if (eventType.includes('qrcode')) return <QrCode className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Status */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Monitor WhatsApp
              </CardTitle>
              <CardDescription>
                Gerencie a conexão e monitore as mensagens
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(config?.connection_status || 'disconnected')}
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Instância</p>
              <p className="font-medium">{config?.instance_name || 'Não configurado'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Número Conectado</p>
              <p className="font-medium">{config?.phone_connected || 'Nenhum'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Última Verificação</p>
              <p className="font-medium">
                {config?.last_connection_check 
                  ? new Date(config.last_connection_check).toLocaleString('pt-BR')
                  : 'Nunca'}
              </p>
            </div>
          </div>

          {/* QR Code se desconectado */}
          {config?.connection_status === 'pending' && config?.qr_code && (
            <Alert className="mt-4">
              <QrCode className="h-4 w-4" />
              <AlertTitle>Escaneie o QR Code</AlertTitle>
              <AlertDescription>
                <div className="mt-4 flex flex-col items-center">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(config.qr_code)}`}
                    alt="QR Code WhatsApp"
                    className="border rounded"
                  />
                  <p className="text-sm text-center mt-2">
                    Abra o WhatsApp → Configurações → Aparelhos conectados → Conectar
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Botão Reconectar se desconectado */}
          {config?.connection_status === 'disconnected' && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Conexão Perdida</AlertTitle>
              <AlertDescription>
                <Button
                  onClick={handleReconnect}
                  disabled={reconnecting}
                  className="mt-2"
                  size="sm"
                >
                  {reconnecting ? 'Reconectando...' : 'Reconectar WhatsApp'}
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Enviadas</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.total_sent}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Falhas</CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.total_failed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pendentes</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.total_pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hoje</CardDescription>
            <CardTitle className="text-2xl">{stats.sent_today}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Semana</CardDescription>
            <CardTitle className="text-2xl">{stats.sent_this_week}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mês</CardDescription>
            <CardTitle className="text-2xl">{stats.sent_this_month}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs com Logs e Teste */}
      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logs">Logs do Webhook</TabsTrigger>
          <TabsTrigger value="test">Enviar Teste</TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Eventos Recentes</CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="auto-refresh" className="text-sm">
                    Auto-refresh
                  </Label>
                  <input
                    id="auto-refresh"
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {webhookLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Database className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>Nenhum evento registrado ainda</p>
                    </div>
                  ) : (
                    webhookLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        <div className="flex items-center gap-3">
                          {getEventIcon(log.event_type)}
                          <div>
                            <p className="font-medium text-sm">{log.event_type}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(log.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {log.success ? (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Sucesso
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Falha
                            </Badge>
                          )}
                          {log.processed && (
                            <Badge variant="outline">Processado</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Mensagem de Teste</CardTitle>
              <CardDescription>
                Teste a integração enviando uma mensagem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-number">
                  Número do WhatsApp
                </Label>
                <Input
                  id="test-number"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={testNumber}
                  onChange={(e) => setTestNumber(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Digite apenas o número com DDD (sem código do país)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-message">
                  Mensagem
                </Label>
                <Textarea
                  id="test-message"
                  rows={4}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Digite sua mensagem de teste..."
                />
              </div>

              <Button 
                onClick={handleSendTest}
                disabled={sendingTest || !config || config.connection_status !== 'connected'}
                className="w-full"
              >
                {sendingTest ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Teste
                  </>
                )}
              </Button>

              {config?.connection_status !== 'connected' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    WhatsApp não está conectado. Conecte primeiro para enviar mensagens.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes do Log */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Detalhes do Evento</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLog(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Evento</p>
                  <p className="font-mono">{selectedLog.event_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Data/Hora</p>
                  <p>{new Date(selectedLog.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <div className="flex gap-2 mt-1">
                    {selectedLog.success && <Badge variant="outline" className="text-green-600">Sucesso</Badge>}
                    {selectedLog.processed && <Badge variant="outline">Processado</Badge>}
                  </div>
                </div>
                {selectedLog.message && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Mensagem</p>
                    <p>{selectedLog.message}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Payload</p>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}