
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionStatusCard from '@/components/subscription/SubscriptionStatusCard';
import PlanCard from '@/components/subscription/PlanCard';
import ManageSubscriptionButton from '@/components/subscription/ManageSubscriptionButton';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { usePlanConfig } from '@/hooks/usePlanConfig';
import { Loader2 } from 'lucide-react';

const PlansPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = usePreferences();
  const { toast } = useToast();
  const { hasActiveSubscription } = useSubscription();
  const { config, isLoading: configLoading } = usePlanConfig();

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    if (success === 'true') {
      toast({
        title: "Pagamento realizado com sucesso!",
        description: "Sua assinatura foi ativada. Bem-vindo ao PoupeJá!",
      });
      // Remove the search params from URL
      navigate('/plans', { replace: true });
    } else if (canceled === 'true') {
      toast({
        title: "Pagamento cancelado",
        description: "Você pode tentar novamente quando quiser.",
        variant: "destructive",
      });
      // Remove the search params from URL
      navigate('/plans', { replace: true });
    }
  }, [success, canceled, navigate, toast]);

  // Mostrar carregamento enquanto busca as configurações
  if (configLoading) {
    return (
      <MainLayout title={t('plans.title')}>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando planos...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  const plans = [
    {
      name: 'Plano Básico',
      price: config?.prices.monthly.displayPrice || 'R$ 14,90',
      period: "/mês",
      priceId: config?.prices.monthly.priceId,
      description: "Ideal para uso pessoal",
      features: [
        'Controle completo de finanças',
        'Relatórios básicos',
        `Até ${config?.prices.monthly.reminderLimit || 15} lembretes por mês`,
        'Suporte por email'
      ],
      planType: 'monthly' as const,
      reminderLimit: config?.prices.monthly.reminderLimit || 15,
    },
    {
      name: 'Plano Anual',
      price: config?.prices.annual.displayPrice || 'R$ 124,90',
      period: "/ano",
      priceId: config?.prices.annual.priceId,
      originalPrice: config?.prices.annual.displayOriginalPrice || 'R$ 178,80',
      savings: config?.prices.annual.displaySavings || 'Economize 30%',
      description: "Economize com o plano anual",
      features: [
        'Controle completo de finanças',
        'Relatórios básicos',
        `Até ${config?.prices.annual.reminderLimit || 15} lembretes por mês`,
        'Suporte por email',
        'Desconto anual'
      ],
      popular: false,
      planType: 'annual' as const,
      reminderLimit: config?.prices.annual.reminderLimit || 15,
    },
    {
      name: 'Plano Pro',
      price: config?.prices.monthly_pro.displayPrice || 'R$ 29,90',
      period: "/mês",
      priceId: config?.prices.monthly_pro.priceId,
      description: "Para usuários avançados",
      features: [
        'Controle completo de finanças',
        'Relatórios avançados',
        `Até ${config?.prices.monthly_pro.reminderLimit || 50} lembretes por mês`,
        'Suporte prioritário',
        'Análises detalhadas'
      ],
      planType: 'monthly_pro' as const,
      reminderLimit: config?.prices.monthly_pro.reminderLimit || 50,
    },
    {
      name: 'Plano Pro Anual',
      price: config?.prices.annual_pro.displayPrice || 'R$ 299,90',
      period: "/ano",
      priceId: config?.prices.annual_pro.priceId,
      originalPrice: config?.prices.annual_pro.displayOriginalPrice || 'R$ 358,80',
      savings: config?.prices.annual_pro.displaySavings || 'Economize 16%',
      description: "Máximo de recursos com desconto",
      features: [
        'Controle completo de finanças',
        'Relatórios avançados',
        `Até ${config?.prices.annual_pro.reminderLimit || 50} lembretes por mês`,
        'Suporte prioritário',
        'Análises detalhadas',
        'Desconto anual'
      ],
      popular: true,
      planType: 'annual_pro' as const,
      reminderLimit: config?.prices.annual_pro.reminderLimit || 50,
    }
  ];

  return (
    <MainLayout title={t('plans.title')}>
      <div className="max-w-6xl mx-auto">
        {/* Subscription Status Card */}
        <SubscriptionStatusCard />

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">{t('plans.title')}</h1>
          <p className="text-muted-foreground">{t('plans.subtitle')}</p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {plans.map((plan) => (
            <PlanCard
              key={plan.planType}
              name={plan.name}
              price={plan.price}
              period={plan.period}
              priceId={plan.priceId}
              originalPrice={plan.originalPrice}
              savings={plan.savings}
              description={plan.description}
              features={plan.features}
              popular={plan.popular}
              planType={plan.planType}
              reminderLimit={plan.reminderLimit}
            />
          ))}
        </div>

        {/* Manage Subscription Section */}
        {hasActiveSubscription && (
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">{t('plans.manageSubscription')}</h3>
            <p className="text-muted-foreground mb-4">
              Gerencie sua assinatura, altere a forma de pagamento ou cancele quando quiser.
            </p>
            <div className="max-w-sm mx-auto">
              <ManageSubscriptionButton />
            </div>
          </div>
        )}

        {/* Back Button for non-authenticated users */}
        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default PlansPage;
