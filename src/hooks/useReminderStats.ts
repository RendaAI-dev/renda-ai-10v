import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ReminderStats {
  currentMonth: {
    usage: number;
    limit: number;
    remaining: number;
    usagePercentage: number;
    canCreateReminder: boolean;
  };
  subscription: {
    planType: string;
    hasActiveSubscription: boolean;
    periodEnd?: string;
  };
  history: {
    monthlyBreakdown: Array<{
      month: string;
      monthKey: string;
      used: number;
      limit: number;
    }>;
    totalMonths: number;
  };
  insights: {
    averageMonthlyUsage: number;
    maxMonthlyUsage: number;
    isNearLimit: boolean;
    shouldUpgrade: boolean;
  };
}

export const useReminderStats = () => {
  const [stats, setStats] = useState<ReminderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('get-reminder-stats');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.success) {
        setStats(data.data);
        setError(null);
      } else {
        throw new Error(data?.error || 'Failed to load reminder stats');
      }
    } catch (err) {
      console.error('Error loading reminder stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    refetch: loadStats
  };
};