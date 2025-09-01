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
      
      // First fetch all budgets for the user
      const { data: budgetData, error: budgetError } = await supabase
        .from('poupeja_budgets')
        .select('*')
        .order('created_at', { ascending: false });

      if (budgetError) {
        console.error('Error fetching budgets:', budgetError);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar orçamentos: ' + budgetError.message,
          variant: 'destructive',
        });
        return;
      }

      if (!budgetData || budgetData.length === 0) {
        setBudgets([]);
        return;
      }

      // Fetch all categories to get category info
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('poupeja_categories')
        .select('*');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      }

      // Create a map of categories for quick lookup
      const categoriesMap = new Map();
      categoriesData?.forEach(category => {
        categoriesMap.set(category.id, category);
      });

      // Calculate spent amounts for each budget
      const budgetsWithSpent = await Promise.all(
        budgetData.map(async (budget: any) => {
          // Get category info
          const category = categoriesMap.get(budget.category_id);
          
          // Calculate spent amount for this budget period
          const { data: transactionData, error: transactionError } = await supabase
            .from('poupeja_transactions')
            .select('amount')
            .eq('category_id', budget.category_id)
            .eq('type', 'expense')
            .gte('date', budget.start_date)
            .lte('date', budget.end_date);

          if (transactionError) {
            console.error('Error fetching transactions for budget:', transactionError);
          }

          const spent = transactionData?.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0) || 0;
          const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

          return {
            ...budget,
            category_name: category?.name || 'Categoria não encontrada',
            category_icon: category?.icon || 'circle',
            category_color: category?.color || '#9E9E9E',
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

  const createBudget = async (budgetData: any) => {
    try {
      const { data, error } = await supabase
        .from('poupeja_budgets' as any)
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

  const updateBudget = async (id: string, budgetData: any) => {
    try {
      const { error } = await supabase
        .from('poupeja_budgets' as any)
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
        .from('poupeja_budgets' as any)
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