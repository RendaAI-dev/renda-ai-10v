// Utilitários para diagnóstico e correção de problemas do sistema

/**
 * Detecta problemas de carregamento de módulos JavaScript
 */
export const detectModuleLoadingIssues = (): boolean => {
  try {
    // Verificar se há erros de rede nas resources
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    // Verificar problemas na navegação principal
    const hasNavigationIssues = navigationEntries.some(entry => 
      entry.responseStart === 0 || entry.loadEventEnd === 0
    );

    // Verificar problemas em recursos JavaScript
    const hasJSLoadingIssues = resourceEntries.some(entry => 
      entry.name.includes('.js') && (
        entry.responseStart === 0 ||
        entry.duration === 0 ||
        entry.transferSize === 0
      )
    );

    return hasNavigationIssues || hasJSLoadingIssues;
  } catch (error) {
    console.warn('⚠️ Erro ao detectar problemas de carregamento:', error);
    return false;
  }
};

/**
 * Limpa caches do navegador que podem causar problemas de MIME type
 */
export const clearProblematicCaches = async (): Promise<void> => {
  try {
    // Limpar Service Worker cache
    if ('serviceWorker' in navigator && 'caches' in window) {
      const cacheNames = await caches.keys();
      const deletePromises = cacheNames.map(cacheName => {
        console.log(`🧹 Limpando cache: ${cacheName}`);
        return caches.delete(cacheName);
      });
      await Promise.all(deletePromises);
      console.log('✅ Caches do Service Worker limpos');
    }

    // Limpar localStorage de dados relacionados ao PWA
    const keysToRemove = [
      'workbox-runtime',
      'workbox-precache',
      'sw-cache-keys',
      'pwa-cache-version',
    ];

    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🧹 Removendo localStorage: ${key}`);
      }
    });

    // Limpar sessionStorage relacionado ao cache
    const sessionKeysToRemove = [
      'sw-update-available',
      'module-load-error',
    ];

    sessionKeysToRemove.forEach(key => {
      if (sessionStorage.getItem(key)) {
        sessionStorage.removeItem(key);
        console.log(`🧹 Removendo sessionStorage: ${key}`);
      }
    });

    console.log('✅ Limpeza de cache concluída');
  } catch (error) {
    console.error('❌ Erro durante limpeza de cache:', error);
  }
};

/**
 * Força o recarregamento da aplicação sem cache
 */
export const forceReloadWithoutCache = (): void => {
  try {
    // Forçar reload sem cache usando location.reload
    window.location.reload();
  } catch (error) {
    console.error('❌ Erro ao forçar reload:', error);
    // Último recurso: redirecionar para a mesma URL com timestamp
    window.location.href = window.location.href.split('?')[0] + '?_t=' + Date.now();
  }
};

/**
 * Diagnóstica problemas relacionados ao Service Worker
 */
export const diagnoseServiceWorkerIssues = async (): Promise<{
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  hasErrors: boolean;
  recommendation: string;
}> => {
  const result = {
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isActive: false,
    hasErrors: false,
    recommendation: '',
  };

  if (!result.isSupported) {
    result.recommendation = 'Service Worker não suportado neste navegador';
    return result;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration) {
      result.isRegistered = true;
      result.isActive = registration.active?.state === 'activated';
      
      if (!result.isActive) {
        result.hasErrors = true;
        result.recommendation = 'Service Worker registrado mas não ativo. Tente recarregar a página.';
      } else {
        result.recommendation = 'Service Worker funcionando normalmente';
      }
    } else {
      result.hasErrors = true;
      result.recommendation = 'Service Worker não registrado. Verifique a configuração.';
    }
  } catch (error) {
    result.hasErrors = true;
    result.recommendation = 'Erro ao verificar Service Worker. Limpe o cache e recarregue.';
    console.error('❌ Erro ao diagnosticar Service Worker:', error);
  }

  return result;
};

/**
 * Verifica a integridade dos arquivos principais da aplicação
 */
export const checkAppIntegrity = async (): Promise<{
  mainJS: boolean;
  mainCSS: boolean;
  serviceWorker: boolean;
  issues: string[];
}> => {
  const result = {
    mainJS: false,
    mainCSS: false,
    serviceWorker: false,
    issues: [] as string[],
  };

  try {
    // Verificar se main.js está acessível
    const jsResponse = await fetch('/src/main.tsx', { method: 'HEAD' });
    result.mainJS = jsResponse.ok;
    if (!result.mainJS) {
      result.issues.push('Arquivo principal JavaScript inacessível');
    }
  } catch (error) {
    result.issues.push('Erro ao verificar arquivo JavaScript principal');
  }

  try {
    // Verificar se CSS está acessível
    const cssResponse = await fetch('/src/index.css', { method: 'HEAD' });
    result.mainCSS = cssResponse.ok;
    if (!result.mainCSS) {
      result.issues.push('Arquivo CSS principal inacessível');
    }
  } catch (error) {
    result.issues.push('Erro ao verificar arquivo CSS principal');
  }

  try {
    // Verificar se Service Worker está acessível
    const swResponse = await fetch('/sw.js', { method: 'HEAD' });
    result.serviceWorker = swResponse.ok;
    if (!result.serviceWorker) {
      result.issues.push('Service Worker inacessível');
    }
  } catch (error) {
    result.issues.push('Erro ao verificar Service Worker');
  }

  return result;
};

/**
 * Executar diagnóstico completo do sistema
 */
export const runFullSystemDiagnostic = async (): Promise<{
  moduleLoading: boolean;
  serviceWorker: any;
  appIntegrity: any;
  recommendations: string[];
}> => {
  console.log('🔍 Iniciando diagnóstico completo do sistema...');

  const moduleLoading = detectModuleLoadingIssues();
  const serviceWorker = await diagnoseServiceWorkerIssues();
  const appIntegrity = await checkAppIntegrity();

  const recommendations: string[] = [];

  if (moduleLoading) {
    recommendations.push('Detectados problemas de carregamento de módulos - limpe o cache');
  }

  if (serviceWorker.hasErrors) {
    recommendations.push(serviceWorker.recommendation);
  }

  if (appIntegrity.issues.length > 0) {
    recommendations.push(...appIntegrity.issues);
    recommendations.push('Verifique a conectividade de rede');
  }

  if (recommendations.length === 0) {
    recommendations.push('Sistema funcionando normalmente');
  }

  console.log('✅ Diagnóstico completo do sistema concluído');

  return {
    moduleLoading,
    serviceWorker,
    appIntegrity,
    recommendations,
  };
};

/**
 * Sistema de auto-recuperação para problemas comuns
 */
export const attemptAutoRecovery = async (): Promise<boolean> => {
  console.log('🔧 Tentando recuperação automática...');

  try {
    // Passo 1: Limpar caches problemáticos
    await clearProblematicCaches();

    // Passo 2: Desregistrar Service Worker se necessário
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active?.state !== 'activated') {
        await registration.unregister();
        console.log('🧹 Service Worker problemático desregistrado');
      }
    }

    // Passo 3: Aguardar um momento para estabilizar
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('✅ Recuperação automática concluída');
    return true;
  } catch (error) {
    console.error('❌ Falha na recuperação automática:', error);
    return false;
  }
};