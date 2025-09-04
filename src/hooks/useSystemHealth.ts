import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SystemHealthStatus {
  overall: 'healthy' | 'warning' | 'critical';
  supabase: boolean;
  network: boolean;
  serviceWorker: boolean;
  localStorage: boolean;
  performance: {
    dbLatency: number;
    networkLatency: number;
  };
  lastCheck: Date;
}

export const useSystemHealth = (intervalMs: number = 30000) => {
  const [health, setHealth] = useState<SystemHealthStatus>({
    overall: 'healthy',
    supabase: true,
    network: navigator.onLine,
    serviceWorker: false,
    localStorage: true,
    performance: {
      dbLatency: 0,
      networkLatency: 0
    },
    lastCheck: new Date()
  });

  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async (): Promise<SystemHealthStatus> => {
    const startTime = performance.now();
    
    // Verificar Supabase
    let supabaseHealth = false;
    let dbLatency = 0;
    try {
      const dbStart = performance.now();
      const { error } = await supabase.from('poupeja_settings').select('id').limit(1);
      dbLatency = Math.round(performance.now() - dbStart);
      supabaseHealth = !error;
    } catch {
      supabaseHealth = false;
    }

    // Verificar Network
    let networkHealth = navigator.onLine;
    let networkLatency = 0;
    try {
      const netStart = performance.now();
      const response = await fetch('/manifest.json', { method: 'HEAD' });
      networkLatency = Math.round(performance.now() - netStart);
      networkHealth = response.ok;
    } catch {
      networkHealth = false;
    }

    // Verificar Service Worker
    let serviceWorkerHealth = false;
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        serviceWorkerHealth = !!(registration?.active);
      }
    } catch {
      serviceWorkerHealth = false;
    }

    // Verificar localStorage
    let localStorageHealth = false;
    try {
      const testKey = 'health-check-' + Date.now();
      localStorage.setItem(testKey, 'test');
      localStorageHealth = localStorage.getItem(testKey) === 'test';
      localStorage.removeItem(testKey);
    } catch {
      localStorageHealth = false;
    }

    // Determinar status geral
    const criticalIssues = [!supabaseHealth, !networkHealth].filter(Boolean).length;
    const warnings = [!serviceWorkerHealth, !localStorageHealth].filter(Boolean).length;
    
    let overall: SystemHealthStatus['overall'] = 'healthy';
    if (criticalIssues > 0) {
      overall = 'critical';
    } else if (warnings > 1 || dbLatency > 1000 || networkLatency > 2000) {
      overall = 'warning';
    }

    return {
      overall,
      supabase: supabaseHealth,
      network: networkHealth,
      serviceWorker: serviceWorkerHealth,
      localStorage: localStorageHealth,
      performance: {
        dbLatency,
        networkLatency
      },
      lastCheck: new Date()
    };
  }, []);

  const runHealthCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      const newHealth = await checkHealth();
      setHealth(newHealth);
      return newHealth;
    } finally {
      setIsChecking(false);
    }
  }, [checkHealth]);

  useEffect(() => {
    // Verificação inicial
    runHealthCheck();

    // Configurar verificações periódicas
    const interval = setInterval(runHealthCheck, intervalMs);

    // Listeners para eventos de rede
    const handleOnline = () => runHealthCheck();
    const handleOffline = () => runHealthCheck();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [runHealthCheck, intervalMs]);

  return {
    health,
    isChecking,
    runHealthCheck
  };
};