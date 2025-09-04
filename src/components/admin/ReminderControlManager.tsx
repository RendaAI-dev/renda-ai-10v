import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, 
  Loader2, 
  BarChart3, 
  Users, 
  Calendar, 
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface ReminderStats {
  totalUsers: number;
  activeReminders: number;
  monthlyUsage: {
    basic: number;
    pro: number;
  };
  planDistribution: {
    basic: number;
    pro: number;
  };
  currentMonth: string;
  limits: {
    basic: number;
    pro: number;
  };
}

const ReminderControlManager: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [stats, setStats] = useState<ReminderStats | null>(null);
  
  const [globalLimits, setGlobalLimits] = useState({
    basicLimit: '15',
    proLimit: '50',
  });

  const loadReminderStats = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('get-reminder-stats');
      
      if (error) {
        console.error('Erro ao carregar estatísticas de lembretes:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar as estatísticas de lembretes.",
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        setStats(data.data);
        setGlobalLimits({
          basicLimit: String(data.data.limits.basic),
          proLimit: String(data.data.limits.pro),
        });
      }

    } catch (err) {
      console.error('Erro ao carregar estatísticas de lembretes:', err);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar estatísticas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadReminderStats();
    }
  }, [isAdmin]);

  const handleResetAllUsage = async () => {
    if (!confirm('Tem certeza que deseja resetar todo o uso de lembretes do mês atual? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setIsUpdating(true);
      
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const { error } = await supabase
        .from('poupeja_reminder_usage')
        .delete()
        .like('month_year', `${currentMonth}%`);

      if (error) throw error;

      toast({
        title: "Uso de lembretes resetado!",
        description: "Todos os contadores de lembretes do mês atual foram zerados.",
      });

      await loadReminderStats();
    } catch (error: any) {
      console.error('Erro ao resetar uso de lembretes:', error);
      toast({
        title: "Erro ao resetar",
        description: error.message || 'Não foi possível resetar o uso de lembretes.',
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (roleLoading || isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando dashboard de lembretes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            Acesso Negado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Você não tem permissões para acessar o controle de lembretes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                <p className="text-sm text-gray-600">Usuários Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.activeReminders || 0}</p>
                <p className="text-sm text-gray-600">Lembretes Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{(stats?.monthlyUsage.basic || 0) + (stats?.monthlyUsage.pro || 0)}</p>
                <p className="text-sm text-gray-600">Uso Mensal Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.currentMonth || new Date().toISOString().slice(0, 7)}</p>
                <p className="text-sm text-gray-600">Mês Atual</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Planos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Distribuição de Uso por Plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-3">Planos Basic</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Usuários:</span>
                  <span className="font-medium">{stats?.planDistribution.basic || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Uso Mensal:</span>
                  <span className="font-medium">{stats?.monthlyUsage.basic || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Limite:</span>
                  <span className="font-medium">{globalLimits.basicLimit}/mês</span>
                </div>
              </div>
            </div>

            <div className="border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-3">Planos Pro</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Usuários:</span>
                  <span className="font-medium">{stats?.planDistribution.pro || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Uso Mensal:</span>
                  <span className="font-medium">{stats?.monthlyUsage.pro || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Limite:</span>
                  <span className="font-medium">{globalLimits.proLimit}/mês</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações Administrativas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Ações Administrativas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-yellow-800 text-sm font-medium mb-2">⚠️ Reset de Contadores</p>
                <p className="text-yellow-700 text-sm mb-3">
                  Esta ação irá zerar todos os contadores de lembretes do mês atual para todos os usuários.
                  Use apenas em casos excepcionais.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetAllUsage}
                  disabled={isUpdating}
                  className="flex items-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resetando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Resetar Uso Mensal
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-green-800 text-sm font-medium mb-2">✅ Sistema Funcionando</p>
                <p className="text-green-700 text-sm">
                  O sistema de controle de lembretes está operacional. Os limites são aplicados automaticamente 
                  com base no plano do usuário.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={loadReminderStats}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Atualizar Estatísticas
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReminderControlManager;