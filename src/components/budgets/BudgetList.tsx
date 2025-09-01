import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { Budget } from '@/hooks/useBudgets';
import CategoryIcon from '@/components/categories/CategoryIcon';
import { useBudgets } from '@/hooks/useBudgets';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BudgetListProps {
  budgets: Budget[];
  loading: boolean;
  onEdit: (budget: Budget) => void;
}

const BudgetList: React.FC<BudgetListProps> = ({ budgets, loading, onEdit }) => {
  const { deleteBudget } = useBudgets();

  const getBudgetStatus = (budget: Budget) => {
    if (budget.percentage >= 100) {
      return { status: 'exceeded', color: 'destructive', icon: AlertTriangle };
    } else if (budget.percentage >= 80) {
      return { status: 'warning', color: 'warning', icon: TrendingUp };
    } else {
      return { status: 'good', color: 'success', icon: DollarSign };
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      case 'yearly': return 'Anual';
      default: return period;
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-2 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum orçamento criado</h3>
          <p className="text-muted-foreground text-center">
            Crie seu primeiro orçamento para começar a controlar seus gastos por categoria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {budgets.map((budget) => {
        const { status, color, icon: StatusIcon } = getBudgetStatus(budget);
        
        return (
          <Card key={budget.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CategoryIcon 
                    icon={budget.category_icon || 'circle'} 
                    color={budget.category_color || '#9E9E9E'} 
                    size={20} 
                  />
                  <CardTitle className="text-base">{budget.category_name}</CardTitle>
                </div>
                <Badge variant={color as any}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status === 'exceeded' ? 'Excedido' : status === 'warning' ? 'Atenção' : 'Ok'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {getPeriodLabel(budget.period)}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Gasto: {formatCurrency(budget.spent)}</span>
                  <span>Limite: {formatCurrency(budget.amount)}</span>
                </div>
                <Progress value={budget.percentage} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {budget.percentage.toFixed(1)}% do orçamento usado
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <span className={`font-medium ${budget.spent > budget.amount ? 'text-destructive' : 'text-foreground'}`}>
                    Restante: {formatCurrency(Math.max(0, budget.amount - budget.spent))}
                  </span>
                  {budget.spent > budget.amount && (
                    <div className="text-destructive text-xs">
                      Excesso: {formatCurrency(budget.spent - budget.amount)}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(budget)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Orçamento</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o orçamento da categoria "{budget.category_name}"? 
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteBudget(budget.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default BudgetList;