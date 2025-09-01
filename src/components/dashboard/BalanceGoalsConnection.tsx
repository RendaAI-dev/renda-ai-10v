import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, calculateBalanceGoalsData } from '@/utils/transactionUtils';
import { Target, Wallet, TrendingUp } from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';
import { motion } from 'framer-motion';

interface BalanceGoalsConnectionProps {
  totalBalance: number;
  goals: any[];
  hideValues?: boolean;
}

const BalanceGoalsConnection: React.FC<BalanceGoalsConnectionProps> = ({
  totalBalance,
  goals,
  hideValues = false
}) => {
  const { t, currency } = usePreferences();
  
  const renderHiddenValue = () => '******';
  
  const balanceGoalsData = calculateBalanceGoalsData(totalBalance, goals);
  
  if (goals.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-full bg-primary/10">
              <Target className="h-4 w-4 text-primary" />
            </div>
            {t('goals.balanceConnection')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Breakdown do Saldo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Saldo Disponível */}
            <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    {t('goals.availableBalance')}
                  </span>
                </div>
                <Badge variant="outline" className="border-green-300 text-green-700 dark:text-green-300">
                  {t('common.available')}
                </Badge>
              </div>
              <p className="text-xl font-bold text-green-700 dark:text-green-400">
                {hideValues ? renderHiddenValue() : formatCurrency(balanceGoalsData.availableBalance, currency)}
              </p>
            </div>

            {/* Saldo Comprometido com Metas */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {t('goals.committedBalance')}
                  </span>
                </div>
                <Badge variant="outline" className="border-blue-300 text-blue-700 dark:text-blue-300">
                  {t('goals.committed')}
                </Badge>
              </div>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                {hideValues ? renderHiddenValue() : formatCurrency(balanceGoalsData.committedBalance, currency)}
              </p>
            </div>
          </div>

          {/* Progresso Geral das Metas */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                {t('goals.overallProgress')}
              </span>
              <span className="text-sm font-bold">
                {balanceGoalsData.overallGoalsProgress}%
              </span>
            </div>
            <Progress value={balanceGoalsData.overallGoalsProgress} className="h-2" />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                {hideValues ? renderHiddenValue() : formatCurrency(balanceGoalsData.totalGoalsAmount, currency)}
              </span>
              <span>
                {t('goals.of')} {hideValues ? renderHiddenValue() : formatCurrency(balanceGoalsData.totalGoalsTarget, currency)}
              </span>
            </div>
          </div>

          {/* Resumo Visual do Saldo Total */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{t('stats.currentBalance')}</span>
              <span className="font-semibold">
                {hideValues ? renderHiddenValue() : formatCurrency(totalBalance, currency)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BalanceGoalsConnection;