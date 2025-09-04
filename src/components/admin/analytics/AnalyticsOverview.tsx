import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, UserPlus, Activity, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalUsers: number;
  newUsers30d: number;
  activeUsers7d: number;
  activeSubscriptions: number;
  conversionRate: number;
  totalRevenue: number;
  monthlyRevenue: number;
  growthData: Array<{
    date: string;
    users: number;
    day: number;
  }>;
}

const KPICard: React.FC<{
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: number;
}> = ({ title, value, description, icon, trend }) => {
  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          <span>{description}</span>
          {trend !== undefined && (
            <span className={`ml-2 flex items-center ${trend >= 0 ? 'text-metacash-success' : 'text-destructive'}`}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const AnalyticsOverview: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const { data: analyticsData, error } = await supabase.functions.invoke('get-analytics-data');

      if (error) throw error;

      setData(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados de analytics.',
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
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total de Usuários"
          value={data.totalUsers}
          description="Usuários cadastrados"
          icon={<Users className="h-4 w-4" />}
        />
        <KPICard
          title="Novos Usuários"
          value={data.newUsers30d}
          description="Últimos 30 dias"
          icon={<UserPlus className="h-4 w-4" />}
        />
        <KPICard
          title="Usuários Ativos"
          value={data.activeUsers7d}
          description="Últimos 7 dias"
          icon={<Activity className="h-4 w-4" />}
        />
        <KPICard
          title="Taxa de Conversão"
          value={`${data.conversionRate}%`}
          description="Assinantes / Total"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Cards */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-metacash-success" />
              Receita
            </CardTitle>
            <CardDescription>
              Análise de receita atual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Receita Total</span>
                <span className="font-semibold">{formatCurrency(data.totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">MRR (Receita Mensal)</span>
                <span className="font-semibold text-metacash-success">
                  {formatCurrency(data.monthlyRevenue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Assinantes Ativos</span>
                <span className="font-semibold">{data.activeSubscriptions}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Growth Chart */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Crescimento de Usuários</CardTitle>
            <CardDescription>
              Novos usuários por dia (últimos 30 dias)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.growthData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="day" 
                  className="text-xs text-muted-foreground"
                />
                <YAxis className="text-xs text-muted-foreground" />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                          <p className="text-sm font-medium">Dia {label}</p>
                          <p className="text-sm text-metacash-teal">
                            Novos usuários: {payload[0].value}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--secondary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Resumo Geral</CardTitle>
          <CardDescription>
            Visão geral do desempenho da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {data.totalUsers}
              </div>
              <div className="text-sm text-muted-foreground">
                Total de Usuários
              </div>
            </div>
            <div className="text-center p-4 bg-metacash-teal/10 rounded-lg">
              <div className="text-2xl font-bold text-metacash-teal mb-1">
                {data.activeSubscriptions}
              </div>
              <div className="text-sm text-muted-foreground">
                Assinantes Ativos
              </div>
            </div>
            <div className="text-center p-4 bg-metacash-success/10 rounded-lg">
              <div className="text-2xl font-bold text-metacash-success mb-1">
                {formatCurrency(data.monthlyRevenue)}
              </div>
              <div className="text-sm text-muted-foreground">
                MRR
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsOverview;