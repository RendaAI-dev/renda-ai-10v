import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { CreditCard, DollarSign, TrendingUp, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface PlanAnalyticsData {
  activePlans: {
    monthly: number;
    annual: number;
    total: number;
  };
  revenue: {
    monthly: number;
    annual: number;
    total: number;
    arpu: number;
  };
  distribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  planPerformance: Array<{
    plan: string;
    activeSubscriptions: number;
    totalSubscriptions: number;
    revenue: number;
    averageValue: number;
    conversionRate: number;
  }>;
  planTrendData: Array<{
    week: string;
    monthly: number;
    annual: number;
    total: number;
    date: string;
  }>;
  planChanges: number;
  mostPopular: string;
}

const PlanAnalytics: React.FC = () => {
  const [data, setData] = useState<PlanAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlanData();
  }, []);

  const fetchPlanData = async () => {
    try {
      const { data: planData, error } = await supabase.functions.invoke('get-plan-analytics');

      if (error) throw error;

      setData(planData);
    } catch (error) {
      console.error('Error fetching plan data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados de planos.',
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Plan KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assinantes Ativos
            </CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data.activePlans.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.activePlans.monthly}M + {data.activePlans.annual}A
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-metacash-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-metacash-success">
              {formatCurrency(data.revenue.total)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(data.revenue.monthly)}M + {formatCurrency(data.revenue.annual)}A
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ARPU
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(data.revenue.arpu)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receita por usuário
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Plano Popular
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {data.mostPopular === 'monthly' ? 'Mensal' : 'Anual'}
            </div>
            <p className="text-xs text-muted-foreground">
              Mais contratado
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Plan Distribution */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Distribuição de Planos</CardTitle>
            <CardDescription>
              Proporção de assinantes por tipo de plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, value }) => 
                    value > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : null
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} assinantes`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Trend */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Tendência de Contratações</CardTitle>
            <CardDescription>
              Novas contratações por semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.planTrendData}>
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
                          <p className="text-sm text-metacash-teal">
                            Mensal: {payload[0]?.value || 0}
                          </p>
                          <p className="text-sm text-primary">
                            Anual: {payload[1]?.value || 0}
                          </p>
                          <p className="text-sm font-medium">
                            Total: {payload[2]?.value || 0}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="monthly" 
                  stroke="#4ECDC4"
                  strokeWidth={2}
                  dot={{ fill: '#4ECDC4', strokeWidth: 2, r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="annual" 
                  stroke="#2C6E7F"
                  strokeWidth={2}
                  dot={{ fill: '#2C6E7F', strokeWidth: 2, r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Plan Performance Comparison */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Desempenho por Plano</CardTitle>
          <CardDescription>
            Comparativo de performance entre os planos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.planPerformance.map((plan, index) => (
              <div key={plan.plan} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {plan.plan === 'Monthly' ? 'Plano Mensal' : 'Plano Anual'}
                    {data.mostPopular === plan.plan.toLowerCase() && (
                      <Badge variant="secondary">Mais Popular</Badge>
                    )}
                  </h3>
                  <div className="text-right">
                    <div className="text-lg font-bold text-metacash-success">
                      {formatCurrency(plan.revenue)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(plan.averageValue)}/plano
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {plan.activeSubscriptions}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Ativos
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {plan.totalSubscriptions}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Histórico
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">
                      {plan.conversionRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Taxa Retenção
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-metacash-success">
                      {formatCurrency(plan.revenue)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Receita Total
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Resumo dos Planos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">Planos Ativos</h4>
              <p className="text-2xl font-bold text-primary mb-1">
                {data.activePlans.total}
              </p>
              <p className="text-sm text-muted-foreground">
                {data.activePlans.monthly} mensais + {data.activePlans.annual} anuais
              </p>
            </div>
            <div className="p-4 bg-metacash-success/10 rounded-lg">
              <h4 className="font-semibold mb-2">Receita Mensal Recorrente</h4>
              <p className="text-2xl font-bold text-metacash-success mb-1">
                {formatCurrency(data.revenue.monthly + (data.revenue.annual / 12))}
              </p>
              <p className="text-sm text-muted-foreground">
                MRR total estimado
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanAnalytics;