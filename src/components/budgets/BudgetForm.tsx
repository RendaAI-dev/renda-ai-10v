import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useBudgets, Budget } from '@/hooks/useBudgets';
import { getCategoriesByType } from '@/services/categoryService';
import CategoryIcon from '@/components/categories/CategoryIcon';
import { Loader2 } from 'lucide-react';

const budgetSchema = z.object({
  category_id: z.string().min(1, 'Selecione uma categoria'),
  amount: z.number().positive('O valor deve ser positivo'),
  period: z.enum(['weekly', 'monthly', 'yearly']).refine(val => val, {
    message: 'Selecione um período',
  }),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  mode: 'create' | 'edit';
}

const BudgetForm: React.FC<BudgetFormProps> = ({ open, onOpenChange, initialData, mode }) => {
  const { t } = usePreferences();
  const { createBudget, updateBudget } = useBudgets();
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
  });

  const selectedCategoryId = watch('category_id');
  const selectedPeriod = watch('period');

  // Load expense categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const expenseCategories = await getCategoriesByType('expense');
        setCategories(expenseCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    if (open) {
      loadCategories();
    }
  }, [open]);

  // Set initial data when editing
  useEffect(() => {
    if (open && initialData && mode === 'edit') {
      setValue('category_id', initialData.category_id || '');
      setValue('amount', initialData.amount || 0);
      setValue('period', initialData.period || 'monthly');
    } else if (open && mode === 'create') {
      reset();
    }
  }, [open, initialData, mode, setValue, reset]);

  const getPeriodDates = (period: string) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    let end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    switch (period) {
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return {
          start_date: weekStart.toISOString().split('T')[0],
          end_date: weekEnd.toISOString().split('T')[0]
        };
      case 'yearly':
        return {
          start_date: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
          end_date: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
        };
      default: // monthly
        return {
          start_date: start.toISOString().split('T')[0],
          end_date: end.toISOString().split('T')[0]
        };
    }
  };

  const onSubmit = async (data: BudgetFormValues) => {
    setIsSubmitting(true);
    try {
      const dates = getPeriodDates(data.period);
      const budgetData = {
        ...data,
        ...dates
      };

      if (mode === 'edit' && initialData?.id) {
        await updateBudget(initialData.id, budgetData as any);
      } else {
        await createBudget(budgetData as any);
      }

      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Error submitting budget:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      case 'yearly': return 'Anual';
      default: return period;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? t('budgets.edit') : t('budgets.add')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Edite os dados do seu orçamento' 
              : 'Crie um novo orçamento para controlar seus gastos por categoria'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category_id">Categoria</Label>
            <Select value={selectedCategoryId} onValueChange={(value) => setValue('category_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <CategoryIcon icon={category.icon} color={category.color} size={16} />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && (
              <p className="text-sm text-destructive">{errors.category_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor do Orçamento</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Período</Label>
            <Select value={selectedPeriod} onValueChange={(value: any) => setValue('period', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
            {errors.period && (
              <p className="text-sm text-destructive">{errors.period.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'edit' ? 'Atualizar' : 'Criar Orçamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetForm;