
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Loader2, DollarSign, Calculator } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

const PlanPricingManager: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    // Basic Plans
    planPriceMonthly: '',
    planPriceAnnual: '',
    reminderLimitBasic: '15',
    // Pro Plans
    planPriceMonthlyPro: '',
    planPriceAnnualPro: '',
    reminderLimitPro: '50',
  });

  const loadPricingConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-admin-settings');
      
      if (error) {
        console.error('Erro ao carregar configurações de preços:', error);
        return;
      }
      
      if (data?.success && data?.settings) {
        const pricingSettings = data.settings.pricing || {};
        setFormData({
          planPriceMonthly: String(pricingSettings.plan_price_monthly?.value || ''),
          planPriceAnnual: String(pricingSettings.plan_price_annual?.value || ''),
          reminderLimitBasic: String(pricingSettings.reminder_limit_basic?.value || '15'),
          planPriceMonthlyPro: String(pricingSettings.plan_price_monthly_pro?.value || ''),
          planPriceAnnualPro: String(pricingSettings.plan_price_annual_pro?.value || ''),
          reminderLimitPro: String(pricingSettings.reminder_limit_pro?.value || '50'),
        });
      }
    } catch (err) {
      console.error('Erro ao carregar configurações de preços:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadPricingConfig();
    }
  }, [isAdmin]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateDiscount = (monthly: string, annual: string) => {
    if (!monthly || !annual) return '0';
    
    const monthlyPrice = parseFloat(String(monthly).replace(',', '.'));
    const annualPrice = parseFloat(String(annual).replace(',', '.'));
    
    if (monthlyPrice && annualPrice) {
      const yearlyEquivalent = monthlyPrice * 12;
      const discount = ((yearlyEquivalent - annualPrice) / yearlyEquivalent) * 100;
      return discount.toFixed(0);
    }
    return '0';
  };

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      
      const { data, error } = await supabase.functions.invoke('update-admin-settings', {
        body: {
          category: 'pricing',
          updates: {
            plan_price_monthly: formData.planPriceMonthly,
            plan_price_annual: formData.planPriceAnnual,
            reminder_limit_basic: formData.reminderLimitBasic,
            plan_price_monthly_pro: formData.planPriceMonthlyPro,
            plan_price_annual_pro: formData.planPriceAnnualPro,
            reminder_limit_pro: formData.reminderLimitPro,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Configurações de preços salvas!",
          description: "Os valores dos planos foram atualizados.",
        });
        
        // Recarregar configurações após salvar
        await loadPricingConfig();
      }
    } catch (error: any) {
      console.error('Erro ao salvar configurações de preços:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || 'Não foi possível salvar as configurações de preços.',
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
            <span>Carregando configurações de preços...</span>
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
            Você não tem permissões para acessar as configurações de preços.
          </p>
        </CardContent>
      </Card>
    );
  }

  const basicDiscount = calculateDiscount(formData.planPriceMonthly, formData.planPriceAnnual);
  const proDiscount = calculateDiscount(formData.planPriceMonthlyPro, formData.planPriceAnnualPro);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Configurações de Preços dos Planos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-green-800 text-sm font-medium mb-2">💰 Configuração de Preços</p>
                <div className="text-green-700 text-sm space-y-2">
                  <p>Configure os valores dos 4 planos que serão exibidos aos usuários.</p>
                  <p><strong>Importante:</strong> Estes valores devem corresponder aos preços configurados no Stripe.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Planos Basic */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-600">Planos Basic</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planPriceMonthly">Valor Mensal Basic (R$)</Label>
                <Input
                  id="planPriceMonthly"
                  value={formData.planPriceMonthly}
                  onChange={(e) => handleInputChange('planPriceMonthly', e.target.value)}
                  placeholder="14,90"
                  disabled={isUpdating}
                  type="text"
                  inputMode="decimal"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="planPriceAnnual">Valor Anual Basic (R$)</Label>
                <Input
                  id="planPriceAnnual"
                  value={formData.planPriceAnnual}
                  onChange={(e) => handleInputChange('planPriceAnnual', e.target.value)}
                  placeholder="124,90"
                  disabled={isUpdating}
                  type="text"
                  inputMode="decimal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminderLimitBasic">Limite de Lembretes Basic</Label>
                <Input
                  id="reminderLimitBasic"
                  value={formData.reminderLimitBasic}
                  onChange={(e) => handleInputChange('reminderLimitBasic', e.target.value)}
                  placeholder="15"
                  disabled={isUpdating}
                  type="number"
                  min="1"
                />
              </div>
            </div>

            {formData.planPriceMonthly && formData.planPriceAnnual && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-800">Desconto Basic</h4>
                </div>
                <div className="text-blue-700 text-sm space-y-1">
                  <p>Mensal × 12: R$ {(parseFloat(String(formData.planPriceMonthly).replace(',', '.')) * 12).toFixed(2).replace('.', ',')}</p>
                  <p>Anual: R$ {formData.planPriceAnnual}</p>
                  <p className="font-medium">Desconto: {basicDiscount}%</p>
                </div>
              </div>
            )}
          </div>

          {/* Planos Pro */}
          <div className="border border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-purple-600">Planos Pro</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planPriceMonthlyPro">Valor Mensal Pro (R$)</Label>
                <Input
                  id="planPriceMonthlyPro"
                  value={formData.planPriceMonthlyPro}
                  onChange={(e) => handleInputChange('planPriceMonthlyPro', e.target.value)}
                  placeholder="29,90"
                  disabled={isUpdating}
                  type="text"
                  inputMode="decimal"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="planPriceAnnualPro">Valor Anual Pro (R$)</Label>
                <Input
                  id="planPriceAnnualPro"
                  value={formData.planPriceAnnualPro}
                  onChange={(e) => handleInputChange('planPriceAnnualPro', e.target.value)}
                  placeholder="299,90"
                  disabled={isUpdating}
                  type="text"
                  inputMode="decimal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminderLimitPro">Limite de Lembretes Pro</Label>
                <Input
                  id="reminderLimitPro"
                  value={formData.reminderLimitPro}
                  onChange={(e) => handleInputChange('reminderLimitPro', e.target.value)}
                  placeholder="50"
                  disabled={isUpdating}
                  type="number"
                  min="1"
                />
              </div>
            </div>

            {formData.planPriceMonthlyPro && formData.planPriceAnnualPro && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium text-purple-800">Desconto Pro</h4>
                </div>
                <div className="text-purple-700 text-sm space-y-1">
                  <p>Mensal × 12: R$ {(parseFloat(String(formData.planPriceMonthlyPro).replace(',', '.')) * 12).toFixed(2).replace('.', ',')}</p>
                  <p>Anual: R$ {formData.planPriceAnnualPro}</p>
                  <p className="font-medium">Desconto: {proDiscount}%</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-amber-800 text-sm">
              <strong>Lembre-se:</strong> Após alterar os preços aqui, você também deve:
            </p>
            <ul className="text-amber-700 text-sm mt-2 space-y-1 list-disc list-inside">
              <li>Atualizar os preços no Dashboard do Stripe (4 produtos)</li>
              <li>Verificar se os Price IDs na seção Stripe estão corretos</li>
              <li>Testar o fluxo de pagamento para todos os planos</li>
              <li>Confirmar os limites de lembretes por plano</li>
            </ul>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              onClick={handleSave}
              disabled={isUpdating}
              className="flex items-center gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Configurações dos 4 Planos
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanPricingManager;
