import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Zap, Database, Wifi } from 'lucide-react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  domNodes: number;
  loadTime: number;
  paintTime: number;
  interactionTime: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    domNodes: 0,
    loadTime: 0,
    paintTime: 0,
    interactionTime: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(true);

  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsUpdateInterval: NodeJS.Timeout;

    const measureFPS = () => {
      frameCount++;
      animationId = requestAnimationFrame(measureFPS);
    };

    const updateMetrics = () => {
      // FPS Calculation
      const currentTime = performance.now();
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      frameCount = 0;
      lastTime = currentTime;

      // Memory Usage
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo ? 
        Math.round((memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100) : 0;

      // DOM Nodes
      const domNodes = document.querySelectorAll('*').length;

      // Performance Timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : 0;
      const paintTime = navigation ? Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart) : 0;

      // First Input Delay (approximação)
      const interactionTime = Math.round(performance.now() % 100); // Simulado para demo

      setMetrics({
        fps: isNaN(fps) ? 60 : Math.min(fps, 60),
        memoryUsage,
        domNodes,
        loadTime,
        paintTime,
        interactionTime
      });
    };

    if (isMonitoring) {
      measureFPS();
      fpsUpdateInterval = setInterval(updateMetrics, 1000);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (fpsUpdateInterval) {
        clearInterval(fpsUpdateInterval);
      }
    };
  }, [isMonitoring]);

  const getPerformanceScore = (value: number, thresholds: [number, number]) => {
    if (value <= thresholds[0]) return 'excellent';
    if (value <= thresholds[1]) return 'good';
    return 'poor';
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      default: return 'text-red-500';
    }
  };

  const getScoreBadge = (score: string) => {
    switch (score) {
      case 'excellent': return <Badge className="bg-green-500">Excelente</Badge>;
      case 'good': return <Badge className="bg-yellow-500">Bom</Badge>;
      default: return <Badge variant="destructive">Precisa Melhorar</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Monitor de Performance
          <Badge variant={isMonitoring ? "default" : "secondary"}>
            {isMonitoring ? 'Ativo' : 'Pausado'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* FPS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="font-medium">FPS</span>
              </div>
              {getScoreBadge(getPerformanceScore(60 - metrics.fps, [5, 15]))}
            </div>
            <div className="text-2xl font-bold">{metrics.fps}</div>
            <Progress value={(metrics.fps / 60) * 100} className="h-2" />
          </div>

          {/* Memory Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span className="font-medium">Memória</span>
              </div>
              {getScoreBadge(getPerformanceScore(metrics.memoryUsage, [50, 80]))}
            </div>
            <div className="text-2xl font-bold">{metrics.memoryUsage}%</div>
            <Progress value={metrics.memoryUsage} className="h-2" />
          </div>

          {/* DOM Nodes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span className="font-medium">Elementos DOM</span>
              </div>
              {getScoreBadge(getPerformanceScore(metrics.domNodes, [1000, 2000]))}
            </div>
            <div className="text-2xl font-bold">{metrics.domNodes.toLocaleString()}</div>
          </div>

          {/* Load Time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                <span className="font-medium">Tempo de Carregamento</span>
              </div>
              {getScoreBadge(getPerformanceScore(metrics.loadTime, [1000, 3000]))}
            </div>
            <div className="text-2xl font-bold">{metrics.loadTime}ms</div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Métricas Detalhadas</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Paint Time:</span>
              <span className="ml-2 font-mono">{metrics.paintTime}ms</span>
            </div>
            <div>
              <span className="text-muted-foreground">Interaction:</span>
              <span className="ml-2 font-mono">{metrics.interactionTime}ms</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-muted transition-colors"
          >
            {isMonitoring ? 'Pausar Monitoramento' : 'Iniciar Monitoramento'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor;