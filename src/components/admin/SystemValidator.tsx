import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'running';
  message: string;
  duration?: number;
}

export const SystemValidator: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTestStatus = (name: string, status: TestResult['status'], message: string, duration?: number) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { ...test, status, message, duration } : test
    ));
  };

  const runTests = async () => {
    setIsRunning(true);
    
    // Inicializar testes
    const initialTests: TestResult[] = [
      { name: 'Service Worker', status: 'pending', message: 'Verificando registro...' },
      { name: 'Supabase Connectivity', status: 'pending', message: 'Testando conexão...' },
      { name: 'Authentication System', status: 'pending', message: 'Validando auth...' },
      { name: 'Module Loading', status: 'pending', message: 'Verificando imports...' },
      { name: 'Local Storage', status: 'pending', message: 'Testando persistência...' },
      { name: 'Network Performance', status: 'pending', message: 'Medindo latência...' },
      { name: 'PWA Features', status: 'pending', message: 'Validando PWA...' }
    ];
    
    setTests(initialTests);

    // Teste 1: Service Worker
    updateTestStatus('Service Worker', 'running', 'Verificando Service Worker...');
    const startSW = performance.now();
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          updateTestStatus('Service Worker', 'success', 
            `✅ Registrado: ${registration.active ? 'Ativo' : 'Instalando'}`, 
            Math.round(performance.now() - startSW)
          );
        } else {
          updateTestStatus('Service Worker', 'error', '❌ Não registrado', Math.round(performance.now() - startSW));
        }
      } else {
        updateTestStatus('Service Worker', 'error', '❌ Não suportado', Math.round(performance.now() - startSW));
      }
    } catch (error) {
      updateTestStatus('Service Worker', 'error', `❌ Erro: ${error}`, Math.round(performance.now() - startSW));
    }

    // Teste 2: Supabase Connectivity
    updateTestStatus('Supabase Connectivity', 'running', 'Testando conexão Supabase...');
    const startDB = performance.now();
    try {
      const { data, error } = await supabase.from('poupeja_settings').select('id').limit(1);
      if (error) throw error;
      updateTestStatus('Supabase Connectivity', 'success', 
        '✅ Conectado com sucesso', 
        Math.round(performance.now() - startDB)
      );
    } catch (error) {
      updateTestStatus('Supabase Connectivity', 'error', 
        `❌ Falha na conexão: ${error}`, 
        Math.round(performance.now() - startDB)
      );
    }

    // Teste 3: Authentication System
    updateTestStatus('Authentication System', 'running', 'Validando sistema de auth...');
    const startAuth = performance.now();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const isWorking = supabase.auth.onAuthStateChange !== undefined;
      updateTestStatus('Authentication System', 'success', 
        `✅ Sistema funcional. ${session ? 'Usuário logado' : 'Usuário anônimo'}`, 
        Math.round(performance.now() - startAuth)
      );
    } catch (error) {
      updateTestStatus('Authentication System', 'error', 
        `❌ Erro no auth: ${error}`, 
        Math.round(performance.now() - startAuth)
      );
    }

    // Teste 4: Module Loading
    updateTestStatus('Module Loading', 'running', 'Testando carregamento de módulos...');
    const startModule = performance.now();
    try {
      // Testar se conseguimos importar módulos dinamicamente
      const testModule = await import('@/lib/utils');
      if (testModule.cn) {
        updateTestStatus('Module Loading', 'success', 
          '✅ Módulos carregando corretamente', 
          Math.round(performance.now() - startModule)
        );
      } else {
        updateTestStatus('Module Loading', 'error', '❌ Problema no carregamento', Math.round(performance.now() - startModule));
      }
    } catch (error) {
      updateTestStatus('Module Loading', 'error', 
        `❌ Falha no import: ${error}`, 
        Math.round(performance.now() - startModule)
      );
    }

    // Teste 5: Local Storage
    updateTestStatus('Local Storage', 'running', 'Testando localStorage...');
    const startLS = performance.now();
    try {
      const testKey = 'system-test-' + Date.now();
      localStorage.setItem(testKey, 'test-value');
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved === 'test-value') {
        updateTestStatus('Local Storage', 'success', 
          '✅ Funcionando corretamente', 
          Math.round(performance.now() - startLS)
        );
      } else {
        updateTestStatus('Local Storage', 'error', '❌ Falha na persistência', Math.round(performance.now() - startLS));
      }
    } catch (error) {
      updateTestStatus('Local Storage', 'error', 
        `❌ Erro no localStorage: ${error}`, 
        Math.round(performance.now() - startLS)
      );
    }

    // Teste 6: Network Performance
    updateTestStatus('Network Performance', 'running', 'Medindo performance...');
    const startNet = performance.now();
    try {
      const response = await fetch('/manifest.json');
      const latency = Math.round(performance.now() - startNet);
      
      if (response.ok) {
        const status = latency < 100 ? '🚀 Excelente' : latency < 300 ? '✅ Boa' : '⚠️ Lenta';
        updateTestStatus('Network Performance', 'success', 
          `${status} (${latency}ms)`, 
          latency
        );
      } else {
        updateTestStatus('Network Performance', 'error', '❌ Falha na requisição', latency);
      }
    } catch (error) {
      updateTestStatus('Network Performance', 'error', 
        `❌ Erro de rede: ${error}`, 
        Math.round(performance.now() - startNet)
      );
    }

    // Teste 7: PWA Features
    updateTestStatus('PWA Features', 'running', 'Validando PWA...');
    const startPWA = performance.now();
    try {
      const manifest = document.querySelector('link[rel="manifest"]');
      const hasManifest = !!manifest;
      const canInstall = 'BeforeInstallPromptEvent' in window;
      
      const score = (hasManifest ? 1 : 0) + (canInstall ? 1 : 0);
      const status = score === 2 ? '🏆 Completo' : score === 1 ? '⚠️ Parcial' : '❌ Limitado';
      
      updateTestStatus('PWA Features', score > 0 ? 'success' : 'error', 
        `${status} (${score}/2 features)`, 
        Math.round(performance.now() - startPWA)
      );
    } catch (error) {
      updateTestStatus('PWA Features', 'error', 
        `❌ Erro PWA: ${error}`, 
        Math.round(performance.now() - startPWA)
      );
    }

    setIsRunning(false);
    
    // Mostrar resultado final
    const successCount = tests.filter(t => t.status === 'success').length;
    const totalTests = tests.length;
    
    if (successCount === totalTests) {
      toast.success(`🎉 Todos os ${totalTests} testes passaram! Sistema funcionando perfeitamente.`);
    } else if (successCount > totalTests / 2) {
      toast.warning(`⚠️ ${successCount}/${totalTests} testes passaram. Alguns problemas detectados.`);
    } else {
      toast.error(`❌ Apenas ${successCount}/${totalTests} testes passaram. Problemas críticos detectados.`);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      running: 'secondary',
      pending: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status]} className="ml-2">
        {status === 'running' ? 'Executando...' : 
         status === 'success' ? 'OK' : 
         status === 'error' ? 'Falha' : 'Pendente'}
      </Badge>
    );
  };

  useEffect(() => {
    // Auto-executar na primeira carga
    runTests();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Validação do Sistema
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            variant="outline"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executando...
              </>
            ) : (
              'Executar Testes'
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tests.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(test.status)}
                <div>
                  <div className="font-medium">{test.name}</div>
                  <div className="text-sm text-muted-foreground">{test.message}</div>
                </div>
              </div>
              <div className="flex items-center">
                {test.duration && (
                  <span className="text-xs text-muted-foreground mr-2">
                    {test.duration}ms
                  </span>
                )}
                {getStatusBadge(test.status)}
              </div>
            </div>
          ))}
        </div>
        
        {tests.length > 0 && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">
              <strong>Resumo:</strong> {tests.filter(t => t.status === 'success').length}/{tests.length} testes passaram
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Tempo total: {tests.reduce((acc, test) => acc + (test.duration || 0), 0)}ms
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemValidator;