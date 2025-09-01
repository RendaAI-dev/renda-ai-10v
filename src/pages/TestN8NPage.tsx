import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MainLayout from "@/components/layout/MainLayout";
import { n8nIntegrationService } from "@/services/n8nIntegrationService";
import { getCurrentUser, updateUserProfile } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";

export const TestN8NPage: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      setPhoneInput(user?.phone || "");
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePhone = async () => {
    if (!phoneInput.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um número de telefone",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedUser = await updateUserProfile({ phone: phoneInput });
      if (updatedUser) {
        setCurrentUser(updatedUser);
        setEditingPhone(false);
        toast({
          title: "Telefone atualizado",
          description: "Telefone foi atualizado com sucesso!",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar telefone",
        description: "Não foi possível atualizar o telefone",
        variant: "destructive",
      });
    }
  };

  const testN8NConnection = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      console.log('=== N8N TEST: Starting connection test ===');
      
      // Reset the N8N service to reload configurations
      n8nIntegrationService.reset();
      
      // Get current user first (reload to ensure fresh data)
      const user = await getCurrentUser();
      console.log('=== N8N TEST: Current user:', user);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      if (!user.phone) {
        throw new Error('Usuário não possui telefone configurado. Configure um telefone primeiro.');
      }

      // Test with a sample appointment
      const testResult = await n8nIntegrationService.onAppointmentCreated(
        {
          id: 'test-appointment-' + Date.now(),
          title: 'Teste de Integração N8N',
          description: 'Este é um teste para verificar se a integração com n8n está funcionando',
          appointment_date: new Date().toISOString(),
          category: 'meeting',
          status: 'pending',
          reminder_enabled: true,
          reminder_times: [15, 60]
        },
        user
      );

      console.log('=== N8N TEST: Test result:', testResult);
      
      setResult({
        success: testResult,
        user: user,
        timestamp: new Date().toISOString()
      });

      if (testResult) {
        toast({
          title: "Teste N8N Realizado",
          description: "Integração N8N testada com sucesso!",
        });
      } else {
        toast({
          title: "Teste N8N Falhou",
          description: "A integração N8N não está funcionando corretamente.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('=== N8N TEST: Error during test:', error);
      setResult({
        success: false,
        error: error.message || 'Erro desconhecido',
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Erro no Teste N8N",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Teste N8N">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando dados do usuário...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Teste N8N">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Teste de Integração N8N</h1>
              <p className="text-muted-foreground">Teste a conexão com o sistema N8N</p>
            </div>
          </div>

          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Usuário Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentUser ? (
                <div className="space-y-3">
                  <div>
                    <strong>Nome:</strong> {currentUser.name}
                  </div>
                  <div>
                    <strong>Email:</strong> {currentUser.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>Telefone:</strong> 
                    {editingPhone ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="Digite o telefone (ex: 5531999999999)"
                          className="w-64"
                        />
                        <Button onClick={updatePhone} size="sm">Salvar</Button>
                        <Button onClick={() => setEditingPhone(false)} variant="outline" size="sm">Cancelar</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{currentUser.phone || "Não configurado"}</span>
                        {currentUser.phone ? (
                          <Badge variant="default">✓ Configurado</Badge>
                        ) : (
                          <Badge variant="destructive">⚠ Necessário para N8N</Badge>
                        )}
                        <Button onClick={() => setEditingPhone(true)} variant="outline" size="sm">
                          {currentUser.phone ? "Editar" : "Configurar"}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {!currentUser.phone && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 text-sm">
                        ⚠️ <strong>Telefone necessário:</strong> Para testar a integração N8N, você precisa configurar um número de telefone.
                        Use o formato: <code>5531999999999</code> (código do país + DDD + número)
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum usuário logado</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teste de Conexão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Clique no botão abaixo para testar se a integração com N8N está funcionando corretamente.
                O teste criará um compromisso fictício e tentará enviar para o N8N.
              </p>
              
              <Button 
                onClick={testN8NConnection} 
                disabled={testing || !currentUser?.phone}
                className="w-full sm:w-auto"
              >
                {testing ? 'Testando...' : 'Testar Conexão N8N'}
              </Button>

              {!currentUser?.phone && (
                <p className="text-sm text-muted-foreground">
                  Configure um telefone primeiro para habilitar o teste
                </p>
              )}

              {result && (
                <div className="mt-6 p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-semibold">Resultado do Teste</h3>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Sucesso" : "Falha"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Timestamp:</strong> {result.timestamp}
                    </div>
                    
                    {result.user && (
                      <div>
                        <strong>Usuário:</strong> {result.user.name} ({result.user.email})
                        <br />
                        <strong>Telefone:</strong> {result.user.phone || 'Não informado'}
                      </div>
                    )}
                    
                    {result.error && (
                      <div className="text-destructive">
                        <strong>Erro:</strong> {result.error}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usuários Disponíveis no Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Usuários com telefone configurado:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>fernando.c123.456@gmail.com (Tel: 3798743075)</li>
                  <li>rendaaiapp@gmail.com (Tel: 37998743011)</li>
                  <li>milton.soaresnew@gmail.com (Tel: 553784064981)</li>
                  <li>devtiagofranca@gmail.com (Tel: 41984402684)</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Se necessário, faça login com um desses usuários para testar
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Como Verificar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>1. Abra o console do navegador (F12) para ver os logs detalhados</p>
                <p>2. Verifique o webhook N8N para confirmar se recebeu os dados</p>
                <p>3. Se configurado, verifique se chegou mensagem no WhatsApp</p>
                <p>4. Analise os logs de erro caso o teste falhe</p>
              </div>
            </CardContent>
          </Card>
        </div>
    </MainLayout>
  );
};