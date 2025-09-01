import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  spent: number;
  percentage: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      
      // Fetch budgets with category information
      const { data: budgetData, error: budgetError } = await supabase
        .from('poupeja_budgets')
        .select(`
          *,
          poupeja_categories (
            name,
            icon,
            color
          )
        `);

      if (budgetError) {
        console.error('Error fetching budgets:', budgetError);
        return;
      }

      if (!budgetData) return;

      // Calculate spent amounts for each budget
      const budgetsWithSpent = await Promise.all(
        budgetData.map(async (budget) => {
          const { data: transactionData } = await supabase
            .from('poupeja_transactions')
            .select('amount')
            .eq('category_id', budget.category_id)
            .eq('type', 'expense')
            .gte('date', budget.start_date)
            .lte('date', budget.end_date);

          const spent = transactionData?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;
          const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

          return {
            ...budget,
            category_name: budget.poupeja_categories?.name,
            category_icon: budget.poupeja_categories?.icon,
            category_color: budget.poupeja_categories?.color,
            spent,
            percentage: Math.min(percentage, 100)
          };
        })
      );

      setBudgets(budgetsWithSpent);
    } catch (error) {
      console.error('Error in fetchBudgets:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar orçamentos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createBudget = async (budgetData: Omit<Budget, 'id' | 'user_id' | 'spent' | 'percentage' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('poupeja_budgets')
        .insert([{
          ...budgetData,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating budget:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao criar orçamento',
          variant: 'destructive',
        });
        return;
      }

      await fetchBudgets();
      toast({
        title: 'Sucesso',
        description: 'Orçamento criado com sucesso',
      });
    } catch (error) {
      console.error('Error in createBudget:', error);
    }
  };

  const updateBudget = async (id: string, budgetData: Partial<Budget>) => {
    try {
      const { error } = await supabase
        .from('poupeja_budgets')
        .update(budgetData)
        .eq('id', id);

      if (error) {
        console.error('Error updating budget:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao atualizar orçamento',
          variant: 'destructive',
        });
        return;
      }

      await fetchBudgets();
      toast({
        title: 'Sucesso',
        description: 'Orçamento atualizado com sucesso',
      });
    } catch (error) {
      console.error('Error in updateBudget:', error);
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('poupeja_budgets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting budget:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao excluir orçamento',
          variant: 'destructive',
        });
        return;
      }

      await fetchBudgets();
      toast({
        title: 'Sucesso',
        description: 'Orçamento excluído com sucesso',
      });
    } catch (error) {
      console.error('Error in deleteBudget:', error);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  return {
    budgets,
    loading,
    createBudget,
    updateBudget,
    deleteBudget,
    refreshBudgets: fetchBudgets
  };
};