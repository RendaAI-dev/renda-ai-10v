import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MainLayout from "@/components/layout/MainLayout";
import { n8nIntegrationService } from "@/services/n8nIntegrationService";
import { getCurrentUser } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";

export const TestN8NPage: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testN8NConnection = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      console.log('=== N8N TEST: Starting connection test ===');
      
      // Get current user first
      const user = await getCurrentUser();
      console.log('=== N8N TEST: Current user:', user);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
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

  return (
    <MainLayout title="Teste N8N">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Teste de Integração N8N</h1>
            <p className="text-muted-foreground">Teste a conexão com o sistema N8N</p>
          </div>
        </div>

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
              disabled={testing}
              className="w-full sm:w-auto"
            >
              {testing ? 'Testando...' : 'Testar Conexão N8N'}
            </Button>

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