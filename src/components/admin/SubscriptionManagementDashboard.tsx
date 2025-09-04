import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Loader2, 
  CreditCard, 
  Calendar, 
  Users,
  Filter,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: string;
  plan_type: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  reminder_limit: number;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

const SubscriptionManagementDashboard: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  const loadSubscriptions = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('get-customers-data');
      
      if (error) {
        console.error('Erro ao carregar assinaturas:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar as assinaturas.",
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        setSubscriptions(data.customers || []);
        setFilteredSubscriptions(data.customers || []);
      }
    } catch (err) {
      console.error('Erro ao carregar assinaturas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadSubscriptions();
    }
  }, [isAdmin]);

  useEffect(() => {
    let filtered = subscriptions;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.stripe_customer_id?.includes(searchTerm) ||
        sub.stripe_subscription_id?.includes(searchTerm)
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    // Filtro por plano
    if (planFilter !== 'all') {
      filtered = filtered.filter(sub => 
        planFilter === 'basic' ? !sub.plan_type?.includes('pro') : sub.plan_type?.includes('pro')
      );
    }

    setFilteredSubscriptions(filtered);
  }, [subscriptions, searchTerm, statusFilter, planFilter]);

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (status === 'active' && !cancelAtPeriodEnd) {
      return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
    } else if (status === 'active' && cancelAtPeriodEnd) {
      return <Badge className="bg-yellow-100 text-yellow-800">Cancelando</Badge>;
    } else if (status === 'canceled') {
      return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getPlanBadge = (planType: string) => {
    if (planType?.includes('pro')) {
      return <Badge className="bg-purple-100 text-purple-800">Pro</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-800">Basic</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const openStripeCustomer = (customerId: string) => {
    const isTestMode = customerId.startsWith('cus_test_');
    const baseUrl = isTestMode 
      ? 'https://dashboard.stripe.com/test/customers'
      : 'https://dashboard.stripe.com/customers';
    window.open(`${baseUrl}/${customerId}`, '_blank');
  };

  if (roleLoading || isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando dashboard de assinaturas...</span>
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
            Você não tem permissões para acessar o gerenciamento de assinaturas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{subscriptions.length}</p>
                <p className="text-sm text-gray-600">Total Assinaturas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {subscriptions.filter(s => s.status === 'active' && !s.cancel_at_period_end).length}
                </p>
                <p className="text-sm text-gray-600">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {subscriptions.filter(s => s.cancel_at_period_end).length}
                </p>
                <p className="text-sm text-gray-600">Cancelando</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {subscriptions.filter(s => s.plan_type?.includes('pro')).length}
                </p>
                <p className="text-sm text-gray-600">Planos Pro</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Email, nome, customer ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                  <SelectItem value="incomplete">Incompleto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Plano</label>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Planos</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ações</label>
              <Button
                variant="outline"
                onClick={loadSubscriptions}
                disabled={isLoading}
                className="w-full flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Atualizar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Assinaturas */}
      <Card>
        <CardHeader>
          <CardTitle>Assinaturas ({filteredSubscriptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Plano</th>
                  <th className="text-left p-2">Período</th>
                  <th className="text-left p-2">Lembretes</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{subscription.user_name || 'Nome não disponível'}</div>
                        <div className="text-gray-500 text-xs">{subscription.user_email}</div>
                        <div className="text-gray-400 text-xs">{subscription.stripe_customer_id}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      {getStatusBadge(subscription.status, subscription.cancel_at_period_end)}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col gap-1">
                        {getPlanBadge(subscription.plan_type)}
                        <span className="text-xs text-gray-500">{subscription.plan_type}</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-xs">
                        <div>Início: {formatDate(subscription.current_period_start)}</div>
                        <div>Fim: {formatDate(subscription.current_period_end)}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-center">
                        <div className="font-medium">{subscription.reminder_limit || 15}</div>
                        <div className="text-xs text-gray-500">por mês</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openStripeCustomer(subscription.stripe_customer_id)}
                        className="flex items-center gap-1 text-xs"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Stripe
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredSubscriptions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {subscriptions.length === 0 
                  ? "Nenhuma assinatura encontrada."
                  : "Nenhuma assinatura corresponde aos filtros aplicados."
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManagementDashboard;