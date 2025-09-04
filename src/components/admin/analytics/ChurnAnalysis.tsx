import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, TrendingDown, Users, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface ChurnData {
  churnRate30d: number;
  churnRate90d: number;
  retentionRate: number;
  avgCustomerLifetime: number;
  cancelledLast30d: number;
  cancelledLast90d: number;
  activeSubscriptions: number;
  totalEverSubscribed: number;
  usersAtRisk: Array<{
    id: string;
    name: string;
    email: string;
    updated_at: string;
  }>;
  churnTrendData: Array<{
    week: string;
    churnCount: number;
    date: string;
  }>;
}

const ChurnAnalysis: React.FC = () => {
  const [data, setData] = useState<ChurnData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchChurnData();
  }, []);

  const fetchChurnData = async () => {
    try {
      const { data: churnData, error } = await supabase.functions.invoke('get-churn-analysis');

      if (error) throw error;

      setData(churnData);
    } catch (error) {
      console.error('Error fetching churn data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados de churn.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    );
  }

  const retentionData = [
    { name: 'Ativos', value: data.activeSubscriptions, color: '#4ECDC4' },
    { name: 'Cancelados', value: data.totalEverSubscribed - data.activeSubscriptions, color: '#FF6B6B' }
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getRiskLevel = (lastActivity: string) => {
    const daysSince = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 60) return { level: 'Alto', color: 'destructive' };
    if (daysSince > 30) return { level: 'Médio', color: 'warning' };
    return { level: 'Baixo', color: 'default' };
  };

  return (
    <div className="space-y-6">
      {/* Churn KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Churn Rate (30d)
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {data.churnRate30d}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.cancelledLast30d} cancelamentos
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Retenção
            </CardTitle>
            <Users className="h-4 w-4 text-metacash-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-metacash-success">
              {data.retentionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.activeSubscriptions} ativos
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tempo de Vida Médio
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data.avgCustomerLifetime}
            </div>
            <p className="text-xs text-muted-foreground">
              dias em média
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuários em Risco
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {data.usersAtRisk.length}
            </div>
            <p className="text-xs text-muted-foreground">
              sem atividade recente
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Churn Trend */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Tendência de Churn</CardTitle>
            <CardDescription>
              Cancelamentos por semana (últimas 12 semanas)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.churnTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="week" 
                  className="text-xs text-muted-foreground"
                />
                <YAxis className="text-xs text-muted-foreground" />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-sm text-destructive">
                            Cancelamentos: {payload[0].value}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="churnCount" 
                  fill="hsl(var(--destructive))"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Retention vs Churn */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Retenção vs Churn</CardTitle>
            <CardDescription>
              Distribuição de assinantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={retentionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {retentionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Users at Risk */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Usuários em Risco
          </CardTitle>
          <CardDescription>
            Usuários sem atividade recente que podem cancelar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.usersAtRisk.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum usuário em risco identificado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.usersAtRisk.map((user) => {
                const risk = getRiskLevel(user.updated_at);
                return (
                  <div key={user.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {user.name || 'Sem nome'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={risk.color as any}>
                        Risco {risk.level}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Última atividade: {formatDate(user.updated_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChurnAnalysis;