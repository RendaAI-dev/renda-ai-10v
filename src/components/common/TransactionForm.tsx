
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTransactionForm } from '@/hooks/useTransactionForm';
import TransactionTypeSelector from './TransactionTypeSelector';
import AmountInput from './AmountInput';
import CategoryDateFields from './CategoryDateFields';
import DescriptionField from './DescriptionField';
import GoalSelector from './GoalSelector';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/transactionUtils';
import { TrendingUp, Target } from 'lucide-react';

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Transaction | null;
  mode: 'create' | 'edit';
  defaultType?: 'income' | 'expense';
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  open,
  onOpenChange,
  initialData,
  mode,
  defaultType = 'expense',
}) => {
  const { t, currency } = usePreferences();
  const { setCustomDateRange, getTransactions, getGoals, goals } = useAppContext();
  const { toast } = useToast();
  const [showGoalSuggestions, setShowGoalSuggestions] = useState(false);
  
  // Initialize form
  const { form, selectedType, handleTypeChange, onSubmit } = useTransactionForm({
    initialData: initialData || undefined,
    mode,
    onComplete: async () => {
      console.log("TransactionForm: Transaction completed successfully");
      
      // Show goal suggestions for income transactions without a selected goal
      const formValues = form.getValues();
      if (selectedType === 'income' && !formValues.goalId && goals.length > 0 && mode === 'create') {
        setShowGoalSuggestions(true);
        return;
      }
      
      // Show success message
      toast({
        title: mode === 'create' ? t('transactions.added') : t('transactions.updated'),
        description: mode === 'create' ? t('transactions.addSuccess') : t('transactions.updateSuccess'),
      });
      
      // Close dialog
      onOpenChange(false);
      
      // Data is already updated by the AppContext after add/update operations
      // No need for additional refresh calls here
    },
    defaultType,
  });

  // Debug form state
  useEffect(() => {
    if (open) {
      console.log("Form state debug:", {
        errors: form.formState.errors,
        isValid: form.formState.isValid,
        values: form.getValues(),
        mode,
        initialData
      });
    }
  }, [open, form.formState.errors, form.formState.isValid]);

  // Reset goal suggestions when dialog closes
  useEffect(() => {
    if (!open) {
      setShowGoalSuggestions(false);
    }
  }, [open]);

  const handleGoalSuggestionAccept = (goalId: string) => {
    form.setValue('goalId', goalId);
    onSubmit(form.getValues());
    setShowGoalSuggestions(false);
  };

  const handleGoalSuggestionSkip = () => {
    setShowGoalSuggestions(false);
    toast({
      title: t('transactions.added'),
      description: t('transactions.addSuccess'),
    });
    onOpenChange(false);
  };

  // Only render the form content when dialog is open to prevent unnecessary calculations
  if (!open) {
    return null;
  }

  // Show goal suggestions dialog
  if (showGoalSuggestions) {
    const amount = form.getValues('amount');
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <DialogHeader className="bg-background p-6 border-b">
            <DialogTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              {t('goals.linkToGoal')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            <div className="text-center mb-6">
              <p className="text-muted-foreground mb-2">
                {t('goals.incomeAdded')} {formatCurrency(amount, currency)}
              </p>
              <p className="font-medium">{t('goals.linkSuggestion')}</p>
            </div>

            <div className="grid gap-3">
              {goals.map((goal) => {
                const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                const remaining = goal.targetAmount - goal.currentAmount;
                
                return (
                  <Card 
                    key={goal.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
                    onClick={() => handleGoalSuggestionAccept(goal.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: goal.color + '20' }}
                          >
                            <Target className="h-4 w-4" style={{ color: goal.color }} />
                          </div>
                          <div>
                            <h4 className="font-medium">{goal.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(remaining, currency)} {t('goals.remaining')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{Math.round(progress)}%</div>
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={handleGoalSuggestionSkip}
                className="flex-1"
              >
                {t('goals.skipLinking')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="bg-background p-6 border-b">
          <DialogTitle className="text-xl">
            {mode === 'create' 
              ? selectedType === 'income' 
                ? t('transactions.addIncome') 
                : t('transactions.addExpense')
              : selectedType === 'income'
                ? t('transactions.editIncome')
                : t('transactions.editExpense')
            }
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 max-h-[calc(85vh-120px)] overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TransactionTypeSelector form={form} onTypeChange={handleTypeChange} />
              <AmountInput form={form} />
              <CategoryDateFields form={form} transactionType={selectedType} />
              <DescriptionField form={form} />
              
              {selectedType === 'income' && (
                <div className="space-y-4">
                  <GoalSelector form={form} />
                  {goals.length > 0 && (
                    <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{t('goals.quickLink')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('goals.quickLinkDescription')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  className={selectedType === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={(e) => {
                    console.log("Save button clicked");
                    console.log("Form state:", form.formState);
                    console.log("Form values:", form.getValues());
                    console.log("Form errors:", form.formState.errors);
                    
                    // Try manual validation
                    const isValid = form.trigger();
                    console.log("Manual validation result:", isValid);
                  }}
                >
                  {mode === 'create' ? 
                    selectedType === 'income' ? 
                      t('transactions.addIncomeAndLink') : 
                      t('common.add') 
                    : t('common.save')
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;
