import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Plus, Settings, AlertTriangle, DollarSign } from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';
import BudgetForm from '@/components/budgets/BudgetForm';
import BudgetList from '@/components/budgets/BudgetList';
import BudgetOverview from '@/components/budgets/BudgetOverview';
import { useBudgets } from '@/hooks/useBudgets';

const BudgetsPage = () => {
  const { t } = usePreferences();
  const { budgets, loading } = useBudgets();
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);

  const handleAddBudget = () => {
    setSelectedBudget(null);
    setBudgetDialogOpen(true);
  };

  const handleEditBudget = (budget: any) => {
    setSelectedBudget(budget);
    setBudgetDialogOpen(true);
  };

  // Calculate total budgets and status
  const totalBudgetAmount = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const exceededBudgets = budgets.filter(budget => budget.spent > budget.amount);
  const nearLimitBudgets = budgets.filter(budget => 
    budget.spent / budget.amount >= 0.8 && budget.spent <= budget.amount
  );

  return (
    <MainLayout title={t('budgets.title')}>
      <div className="space-y-6 min-h-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">{t('budgets.title')}</h2>
            <p className="text-muted-foreground">{t('budgets.description')}</p>
          </div>
          <Button onClick={handleAddBudget}>
            <Plus className="mr-2 h-4 w-4" /> {t('budgets.add')}
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('budgets.totalAmount')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalBudgetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('budgets.activeBudgets')}</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budgets.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('budgets.nearLimit')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{nearLimitBudgets.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('budgets.exceeded')}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{exceededBudgets.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">
              <TrendingUp className="mr-2 h-4 w-4" />
              {t('budgets.overview')}
            </TabsTrigger>
            <TabsTrigger value="manage">
              <Settings className="mr-2 h-4 w-4" />
              {t('budgets.manage')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <BudgetOverview budgets={budgets} loading={loading} />
          </TabsContent>

          <TabsContent value="manage">
            <BudgetList 
              budgets={budgets}
              loading={loading}
              onEdit={handleEditBudget}
            />
          </TabsContent>
        </Tabs>
      </div>

      <BudgetForm
        open={budgetDialogOpen}
        onOpenChange={setBudgetDialogOpen}
        initialData={selectedBudget}
        mode={selectedBudget?.id ? 'edit' : 'create'}
      />
    </MainLayout>
  );
};

export default BudgetsPage;