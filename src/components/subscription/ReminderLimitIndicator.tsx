import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle, CheckCircle } from 'lucide-react';
import { useReminderStats } from '@/hooks/useReminderStats';

const ReminderLimitIndicator: React.FC = () => {
  const { stats, isLoading, error } = useReminderStats();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Não foi possível carregar informações de lembretes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { currentMonth, subscription, insights } = stats;
  const usagePercentage = currentMonth.usagePercentage;

  const getStatusColor = () => {
    if (usagePercentage >= 90) return 'text-destructive';
    if (usagePercentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (usagePercentage >= 90) return <AlertTriangle className="h-4 w-4" />;
    if (usagePercentage >= 80) return <Bell className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getProgressColor = () => {
    if (usagePercentage >= 90) return 'bg-destructive';
    if (usagePercentage >= 80) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const getPlanBadgeVariant = () => {
    if (subscription.planType.includes('pro')) return 'default';
    return 'secondary';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Lembretes do Mês
          </CardTitle>
          <Badge variant={getPlanBadgeVariant()}>
            {subscription.planType.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Usage Stats */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Utilizados</span>
            <span className={`font-medium flex items-center gap-1 ${getStatusColor()}`}>
              {getStatusIcon()}
              {currentMonth.usage} de {currentMonth.limit}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={usagePercentage} 
              className="h-2"
              style={{
                background: 'hsl(var(--muted))'
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>{currentMonth.limit}</span>
            </div>
          </div>

          {/* Remaining */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Restantes</span>
            <span className="font-medium text-green-600">
              {currentMonth.remaining}
            </span>
          </div>

          {/* Warnings and Suggestions */}
          {insights.isNearLimit && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Próximo do limite
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    Você está usando {usagePercentage}% dos seus lembretes mensais.
                  </p>
                </div>
              </div>
            </div>
          )}

          {insights.shouldUpgrade && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Bell className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    Considere fazer upgrade
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Com o plano Pro você terá 50 lembretes por mês.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReminderLimitIndicator;