import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Brain, Send, Database, MessageCircle, Clock, User, Target, Wallet } from 'lucide-react';

interface MCPContext {
  userProfile: {
    name: string;
    email: string;
    phone: string;
  };
  recentTransactions: Array<{
    type: 'income' | 'expense';
    amount: number;
    description: string;
    date: string;
  }>;
  activeGoals: Array<{
    name: string;
    target_amount: number;
    current_amount: number;
    progress: number;
  }>;
  activeBudgets: Array<{
    amount: number;
    period: string;
    category: string;
  }>;
}

const MCPTestInterface: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [eventType, setEventType] = useState<string>('goal_progress');
  const [userName, setUserName] = useState('João Silva');
  const [userPhone, setUserPhone] = useState('11999999999');
  const [userEmail, setUserEmail] = useState('joao@exemplo.com');
  const [eventData, setEventData] = useState('{"title": "Viagem Europa", "progress": 75}');
  const [webhookUrl, setWebhookUrl] = useState('https://sua-instancia-n8n.com/webhook/poupeja-mcp-webhook');
  const [response, setResponse] = useState<any>(null);
  const [mcpContext, setMcpContext] = useState<MCPContext | null>(null);

  // Gerar contexto MCP simulado
  const generateMCPContext = (): MCPContext => {
    return {
      userProfile: {
        name: userName,
        email: userEmail,
        phone: userPhone
      },
      recentTransactions: [
        {
          type: 'expense',
          amount: -150.50,
          description: 'Supermercado Extra',
          date: '2025-01-25'
        },
        {
          type: 'income',
          amount: 3500.00,
          description: 'Salário',
          date: '2025-01-20'
        },
        {
          type: 'expense',
          amount: -85.30,
          description: 'Combustível',
          date: '2025-01-18'
        }
      ],
      activeGoals: [
        {
          name: 'Viagem para Europa',
          target_amount: 8000.00,
          current_amount: 6000.00,
          progress: 75
        },
        {
          name: 'Reserva de Emergência',
          target_amount: 10000.00,
          current_amount: 4200.00,
          progress: 42
        }
      ],
      activeBudgets: [
        {
          amount: 1500.00,
          period: 'monthly',
          category: 'Alimentação'
        },
        {
          amount: 800.00,
          period: 'monthly',
          category: 'Transporte'
        }
      ]
    };
  };

  // Enviar teste para webhook N8N
  const sendTestWebhook = async () => {
    setIsLoading(true);
    setResponse(null);
    
    try {
      // Gerar contexto MCP
      const context = generateMCPContext();
      setMcpContext(context);

      // Preparar payload
      const payload = {
        type: eventType,
        user: {
          id: `test-${Date.now()}`,
          name: userName,
          phone: userPhone,
          email: userEmail
        },
        data: JSON.parse(eventData),
        metadata: {
          evolutionApi: {
            apiUrl: 'https://evolution-api.example.com',
            apiKey: 'test-api-key',
            instance: 'test-instance'
          }
        },
        timestamp: new Date().toISOString()
      };

      console.log('🚀 Enviando payload MCP:', payload);

      // Simular resposta (em produção, faria chamada real)
      const mockResponse = {
        success: true,
        message: 'Mensagem AI personalizada enviada com sucesso',
        data: {
          user_id: payload.user.id,
          phone: payload.user.phone,
          message_sent: getSimulatedAIMessage(eventType, payload.data),
          event_type: eventType,
          timestamp: new Date().toISOString(),
          processing_time_ms: Math.floor(Math.random() * 1000) + 500,
          context_used: {
            transactions_count: context.recentTransactions.length,
            goals_count: context.activeGoals.length,
            budgets_count: context.activeBudgets.length
          }
        }
      };

      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1500));

      setResponse(mockResponse);

      toast({
        title: 'Teste MCP Realizado',
        description: 'Mensagem AI gerada com contexto personalizado'
      });

    } catch (error) {
      console.error('Erro no teste MCP:', error);
      
      const errorResponse = {
        success: false,
        message: 'Erro no processamento MCP',
        error: {
          type: 'TestError',
          message: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      };

      setResponse(errorResponse);

      toast({
        title: 'Erro no Teste',
        description: 'Falha ao processar teste MCP',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simular mensagem IA baseada no contexto
  const getSimulatedAIMessage = (type: string, data: any): string => {
    const firstName = userName.split(' ')[0];
    
    switch (type) {
      case 'appointment_reminder':
        return `Oi ${firstName}! 📅 Lembrete: você tem "${data.title}" hoje. Não esqueça de registrar os gastos no PoupeJá! 💙`;
      
      case 'transaction_due':
        return `${firstName}, está na hora! 💳 ${data.description} de R$ ${data.amount} vence hoje. Já está no seu orçamento? 📊`;
      
      case 'goal_progress':
        return `🎉 Parabéns ${firstName}! Você está ${data.progress}% mais perto da sua meta "${data.title}". Continue assim! 💪`;
      
      case 'goal_achieved':
        return `🏆 INCRÍVEL! ${firstName}, você conquistou sua meta "${data.title}"! Que tal criar uma nova meta no PoupeJá? 🚀`;
      
      case 'budget_exceeded':
        return `⚠️ Opa ${firstName}! Seu orçamento de ${data.category} passou do limite. Que tal revisar os gastos no PoupeJá? 📱`;
      
      default:
        return `Oi ${firstName}! 👋 ${data.description || 'Temos uma atualização para você no PoupeJá!'} Confira o app! 📱💙`;
    }
  };

  // Templates de dados por tipo de evento
  const getEventDataTemplate = (type: string): string => {
    const templates = {
      appointment_reminder: '{"title": "Consulta Médica", "date": "2025-01-27T14:30:00Z", "location": "Hospital ABC"}',
      transaction_due: '{"description": "Conta de Luz", "amount": 120.50, "due_date": "2025-01-27"}',
      goal_progress: '{"title": "Viagem Europa", "progress": 75, "amount": 6000}',
      goal_achieved: '{"title": "Reserva Emergência", "amount": 10000}',
      budget_exceeded: '{"category": "Alimentação", "limit": 1500, "spent": 1650}',
      custom: '{"description": "Mensagem personalizada", "priority": "medium"}'
    };
    
    return templates[type as keyof typeof templates] || templates.custom;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>Teste MCP + OpenAI + Supabase</CardTitle>
          </div>
          <CardDescription>
            Teste a integração completa com Model Context Protocol, gerando mensagens IA personalizadas
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuração do Teste */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuração do Teste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventType">Tipo de Evento</Label>
              <Select value={eventType} onValueChange={(value) => {
                setEventType(value);
                setEventData(getEventDataTemplate(value));
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointment_reminder">
                    📅 Lembrete de Compromisso
                  </SelectItem>
                  <SelectItem value="transaction_due">
                    💳 Transação Vencendo
                  </SelectItem>
                  <SelectItem value="goal_progress">
                    🎯 Progresso de Meta
                  </SelectItem>
                  <SelectItem value="goal_achieved">
                    🏆 Meta Alcançada
                  </SelectItem>
                  <SelectItem value="budget_exceeded">
                    ⚠️ Orçamento Excedido
                  </SelectItem>
                  <SelectItem value="custom">
                    ✨ Mensagem Personalizada
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Nome do Usuário</Label>
                <Input
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="João Silva"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="userPhone">Telefone</Label>
                  <Input
                    id="userPhone"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="11999999999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userEmail">Email</Label>
                  <Input
                    id="userEmail"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="joao@exemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventData">Dados do Evento (JSON)</Label>
                <Textarea
                  id="eventData"
                  value={eventData}
                  onChange={(e) => setEventData(e.target.value)}
                  placeholder="Dados do evento em formato JSON"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">URL do Webhook N8N</Label>
                <Input
                  id="webhookUrl"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://n8n.com/webhook/poupeja-mcp-webhook"
                />
              </div>
            </div>

            <Button 
              onClick={sendTestWebhook} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Processando MCP...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Teste MCP
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Contexto MCP */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-4 w-4" />
              Contexto MCP Gerado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mcpContext ? (
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profile">
                    <User className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="transactions">
                    <Wallet className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="goals">
                    <Target className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="budgets">💰</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-2">
                  <div className="text-sm space-y-1">
                    <p><strong>Nome:</strong> {mcpContext.userProfile.name}</p>
                    <p><strong>Email:</strong> {mcpContext.userProfile.email}</p>
                    <p><strong>Telefone:</strong> {mcpContext.userProfile.phone}</p>
                  </div>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-2">
                  {mcpContext.recentTransactions.map((t, i) => (
                    <div key={i} className="text-sm border-l-2 border-primary/20 pl-2">
                      <p className="font-medium">
                        {t.type === 'income' ? '+' : ''}R$ {t.amount.toFixed(2)}
                      </p>
                      <p className="text-muted-foreground">{t.description} • {t.date}</p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="goals" className="space-y-2">
                  {mcpContext.activeGoals.map((g, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-medium">{g.name}</p>
                      <div className="flex justify-between text-muted-foreground">
                        <span>R$ {g.current_amount.toFixed(2)} / R$ {g.target_amount.toFixed(2)}</span>
                        <Badge variant="secondary">{g.progress}%</Badge>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="budgets" className="space-y-2">
                  {mcpContext.activeBudgets.map((b, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-medium">{b.category}</p>
                      <p className="text-muted-foreground">
                        R$ {b.amount.toFixed(2)} / {b.period}
                      </p>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Execute um teste para ver o contexto MCP gerado
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resultado do Teste */}
      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Resultado do Teste
              <Badge variant={response.success ? "default" : "destructive"}>
                {response.success ? 'Sucesso' : 'Erro'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="message" className="w-full">
              <TabsList>
                <TabsTrigger value="message">Mensagem IA</TabsTrigger>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="raw">JSON Raw</TabsTrigger>
              </TabsList>

              <TabsContent value="message" className="space-y-4">
                {response.success ? (
                  <div className="space-y-3">
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <p className="font-mono text-sm">
                        📱 <strong>WhatsApp:</strong> {response.data?.message_sent}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Usuário:</strong> {response.data?.user_id}</p>
                        <p><strong>Telefone:</strong> {response.data?.phone}</p>
                      </div>
                      <div>
                        <p><strong>Tipo:</strong> {response.data?.event_type}</p>
                        <p><strong>Tempo:</strong> {response.data?.processing_time_ms}ms</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-destructive/5 p-4 rounded-lg border border-destructive/20">
                    <p className="text-destructive font-medium">{response.message}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {response.error?.message}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details" className="space-y-2">
                {response.success && (
                  <div className="space-y-2 text-sm">
                    <p><strong>Contexto Utilizado:</strong></p>
                    <ul className="list-disc list-inside text-muted-foreground ml-2">
                      <li>{response.data?.context_used?.transactions_count} transações recentes</li>
                      <li>{response.data?.context_used?.goals_count} metas ativas</li>
                      <li>{response.data?.context_used?.budgets_count} orçamentos ativos</li>
                    </ul>
                    <p><strong>Timestamp:</strong> {response.data?.timestamp}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="raw">
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MCPTestInterface;