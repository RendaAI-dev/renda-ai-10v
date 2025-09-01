import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Budget } from '@/hooks/useBudgets';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import CategoryIcon from '@/components/categories/CategoryIcon';
import { DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

interface BudgetOverviewProps {
  budgets: Budget[];
  loading: boolean;
}

const BudgetOverview: React.FC<BudgetOverviewProps> = ({ budgets, loading }) => {
  
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded"></div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum orçamento para visualizar</h3>
          <p className="text-muted-foreground text-center">
            Crie orçamentos para ver uma visão geral dos seus gastos por categoria.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const pieData = budgets.map((budget) => ({
    name: budget.category_name,
    value: budget.amount,
    spent: budget.spent,
    color: budget.category_color || '#9E9E9E',
  }));

  const barData = budgets.map((budget) => ({
    category: budget.category_name || 'Sem nome',
    budget: budget.amount,
    spent: budget.spent,
    remaining: Math.max(0, budget.amount - budget.spent),
  }));

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Calculate summary stats
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const averageUsage = budgets.length > 0 ? budgets.reduce((sum, budget) => sum + budget.percentage, 0) / budgets.length : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orçado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
            <Progress value={(totalSpent / totalBudget) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              {((totalSpent / totalBudget) * 100).toFixed(1)}% do orçamento total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso Médio</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageUsage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Média de uso dos orçamentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição do Orçamento</CardTitle>
            <CardDescription>Valores alocados por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orçamento vs Gasto</CardTitle>
            <CardDescription>Comparação por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="budget" fill="#8884d8" name="Orçamento" />
                  <Bar dataKey="spent" fill="#82ca9d" name="Gasto" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Status List */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos Orçamentos</CardTitle>
          <CardDescription>Progresso detalhado por categoria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgets.map((budget) => (
              <div key={budget.id} className="flex items-center space-x-4">
                <CategoryIcon 
                  icon={budget.category_icon || 'circle'} 
                  color={budget.category_color || '#9E9E9E'} 
                  size={24} 
                />
                
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{budget.category_name}</span>
                    <span>{formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}</span>
                  </div>
                  <Progress 
                    value={budget.percentage} 
                    className="h-2"
                  />
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {budget.percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {budget.spent > budget.amount ? 'Excedido' : 'No limite'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetOverview;