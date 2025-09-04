import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  detectModuleLoadingIssues, 
  clearProblematicCaches, 
  forceReloadWithoutCache,
  attemptAutoRecovery,
  runFullSystemDiagnostic 
} from '@/utils/systemDiagnostics';

interface HealthStatus {
  app: 'healthy' | 'warning' | 'error';
  supabase: 'healthy' | 'warning' | 'error';
  serviceWorker: 'healthy' | 'warning' | 'error';
  network: 'online' | 'offline';
  lastCheck: Date;
}

export const SystemHealthMonitor: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    app: 'healthy',
    supabase: 'healthy',
    serviceWorker: 'healthy',
    network: 'online',
    lastCheck: new Date()
  });
  const [showHealthIndicator, setShowHealthIndicator] = useState(false);

  // Verificar saúde do sistema
  const checkSystemHealth = async (): Promise<HealthStatus> => {
    const status: HealthStatus = {
      app: 'healthy',
      supabase: 'healthy',
      serviceWorker: 'healthy',
      network: navigator.onLine ? 'online' : 'offline',
      lastCheck: new Date()
    };

    try {
      // Verificar conectividade Supabase
      const { error } = await supabase.from('poupeja_users').select('count').limit(1);
      if (error) {
        status.supabase = 'error';
        console.warn('⚠️ Supabase health check failed:', error);
      }
    } catch (error) {
      status.supabase = 'error';
      console.warn('⚠️ Supabase connection failed:', error);
    }

    try {
      // Verificar Service Worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          status.serviceWorker = 'warning';
        } else if (registration.active?.state !== 'activated') {
          status.serviceWorker = 'warning';
        }
      } else {
        status.serviceWorker = 'warning';
      }
    } catch (error) {
      status.serviceWorker = 'error';
      console.warn('⚠️ Service Worker check failed:', error);
    }

    // Verificar se há erros de carregamento de módulos
    const hasModuleErrors = window.performance.getEntriesByType('navigation')
      .some((entry: any) => entry.responseStart === 0);
    
    if (hasModuleErrors) {
      status.app = 'warning';
    }

    return status;
  };

  // Monitoramento contínuo
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const runHealthCheck = async () => {
      try {
        const newStatus = await checkSystemHealth();
        setHealthStatus(newStatus);

        // Mostrar indicador se houver problemas
        const hasIssues = newStatus.app !== 'healthy' || 
                         newStatus.supabase !== 'healthy' || 
                         newStatus.network === 'offline';
        
        setShowHealthIndicator(hasIssues);

        // Notificar sobre problemas críticos
        if (newStatus.supabase === 'error' && healthStatus.supabase !== 'error') {
          toast({
            title: "⚠️ Problema de Conectividade",
            description: "Problemas de conexão com o servidor. Algumas funcionalidades podem estar indisponíveis.",
            variant: "destructive",
          });
        }

        if (newStatus.network === 'offline' && healthStatus.network === 'online') {
          toast({
            title: "📶 Conexão Perdida",
            description: "Você está offline. A aplicação funcionará com funcionalidades limitadas.",
            variant: "destructive",
          });
        }

        if (newStatus.network === 'online' && healthStatus.network === 'offline') {
          toast({
            title: "✅ Conexão Restaurada",
            description: "Você está online novamente!",
          });
        }

      } catch (error) {
        console.error('❌ Erro no health check:', error);
      }
    };

    // Executar imediatamente
    runHealthCheck();

    // Executar a cada 30 segundos
    intervalId = setInterval(runHealthCheck, 30000);

    // Listeners para eventos de rede
    const handleOnline = () => runHealthCheck();
    const handleOffline = () => runHealthCheck();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [healthStatus]);

  // Manipular erros de módulo
  useEffect(() => {
    const handleModuleError = (event: ErrorEvent) => {
      if (event.message?.includes('Failed to load module') || 
          event.message?.includes('MIME type')) {
        console.error('🚨 Erro de carregamento de módulo detectado:', event);
        
        setHealthStatus(prev => ({ ...prev, app: 'error' }));
        setShowHealthIndicator(true);
        
        toast({
          title: "🚨 Erro de Carregamento",
          description: "Problema detectado no carregamento da aplicação. Tente recarregar a página.",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('error', handleModuleError);
    return () => window.removeEventListener('error', handleModuleError);
  }, []);

  if (!showHealthIndicator) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg text-xs max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
          <span className="font-medium">Status do Sistema</span>
        </div>
        
        <div className="space-y-1 text-muted-foreground">
          <div className="flex justify-between">
            <span>Aplicação:</span>
            <span className={`font-medium ${
              healthStatus.app === 'healthy' ? 'text-green-600' :
              healthStatus.app === 'warning' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {healthStatus.app === 'healthy' ? '✅' :
               healthStatus.app === 'warning' ? '⚠️' : '❌'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Servidor:</span>
            <span className={`font-medium ${
              healthStatus.supabase === 'healthy' ? 'text-green-600' :
              healthStatus.supabase === 'warning' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {healthStatus.supabase === 'healthy' ? '✅' :
               healthStatus.supabase === 'warning' ? '⚠️' : '❌'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Rede:</span>
            <span className={`font-medium ${
              healthStatus.network === 'online' ? 'text-green-600' : 'text-red-600'
            }`}>
              {healthStatus.network === 'online' ? '📶' : '📵'}
            </span>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
          Última verificação: {healthStatus.lastCheck.toLocaleTimeString()}
        </div>
        
        <div className="grid grid-cols-2 gap-1 mt-2">
          <button
            onClick={async () => {
              try {
                await attemptAutoRecovery();
                toast({
                  title: "🔧 Recuperação Executada",  
                  description: "Cache limpo. Recarregando...",
                });
                setTimeout(() => forceReloadWithoutCache(), 1000);
              } catch (error) {
                toast({
                  title: "❌ Falha na Recuperação",
                  description: "Tente recarregar manualmente",
                  variant: "destructive",
                });
              }
            }}
            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
          >
            Auto-Fix
          </button>
          <button
            onClick={() => forceReloadWithoutCache()}
            className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90"
          >
            Recarregar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthMonitor;