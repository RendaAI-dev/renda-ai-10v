import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { getPlanTypeFromPriceId } from '@/utils/subscriptionUtils';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { validateCPF, formatCPF, cleanCPF, validateAge, validateUniqueCPF } from "@/utils/cpfValidation";

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { companyName, logoUrl, logoAltText } = useBrandingConfig();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const priceId = searchParams.get('priceId');

  const waitForSession = (): Promise<boolean> => {
    return new Promise((resolve) => {
      let resolved = false;
      
      // Timeout após 30 segundos
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      }, 30000);
      
      // Listener para mudanças de sessão
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!resolved && session?.user) {
            resolved = true;
            clearTimeout(timeout);
            subscription.unsubscribe();
            resolve(true);
          }
        }
      );
      
      // Verificar sessão atual uma vez
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!resolved && session?.user) {
          resolved = true;
          clearTimeout(timeout);
          subscription.unsubscribe();
          resolve(true);
        }
      });
    });
  };

  // Função para formatar o número de telefone como (XX) XXXXX-XXXX
  const formatPhoneNumber = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a formatação
    if (numbers.length <= 2) {
      return numbers.length ? `(${numbers}` : '';
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  // Função para lidar com a mudança no campo de WhatsApp
  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setWhatsapp(formattedValue);
  };

  // Função para lidar com a mudança no campo de CPF
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCPF(e.target.value);
    setCpf(formattedValue);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Adicionar classe de loading ao formulário
    const formElement = document.getElementById('register-form');
    if (formElement) {
      formElement.classList.add('form-loading');
    }
  
    if (!priceId) {
      setError("Price ID não encontrado na URL. Por favor, selecione um plano.");
      setIsLoading(false);
      formElement?.classList.remove('form-loading');
      navigate('/plans');
      return;
    }
  
    try {
      // Validar CPF se fornecido
      if (cpf && !validateCPF(cpf)) {
        setError("CPF inválido. Por favor, verifique o número digitado.");
        setIsLoading(false);
        formElement?.classList.remove('form-loading');
        return;
      }

      // Verificar se CPF já está cadastrado
      if (cpf && !(await validateUniqueCPF(cpf))) {
        setError("Este CPF já está cadastrado no sistema.");
        setIsLoading(false);
        formElement?.classList.remove('form-loading');
        return;
      }

      // Validar data de nascimento se fornecida
      if (birthDate && !validateAge(birthDate)) {
        setError("Você deve ter pelo menos 18 anos para se cadastrar.");
        setIsLoading(false);
        formElement?.classList.remove('form-loading');
        return;
      }

      // Normaliza o número de telefone antes de enviar (remove caracteres não numéricos)
      const formattedPhone = whatsapp.replace(/\D/g, '');

      console.log('Iniciando processo de registro...');

      const userData: any = {
        full_name: fullName,
        phone: formattedPhone,
      };

      // Adicionar CPF e data de nascimento se fornecidos
      if (cpf) {
        userData.cpf = cleanCPF(cpf);
      }

      if (birthDate) {
        userData.birth_date = birthDate;
      }
      
      console.log('🚀 Iniciando processo de cadastro...');
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: userData
        }
      });

      if (authError) {
        console.error('❌ Erro na criação do usuário:', authError);
        throw authError;
      }

      console.log('✅ Usuário criado com sucesso:', authData.user?.id);

      // Aguardar sessão válida - método simplificado
      console.log('🔄 Aguardando confirmação da sessão...');
      const sessionValid = await waitForSession();
      
      if (!sessionValid) {
        console.log('⚠️ Sessão não confirmada, redirecionando para login...');
        throw new Error('Email criado com sucesso! Faça login para continuar.');
      }

      // Obter sessão atual para o checkout
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Sessão inválida após registro');
      }
      
      // Converter priceId para planType
      const planType = await getPlanTypeFromPriceId(priceId);
      
      if (!planType) {
        throw new Error("Tipo de plano inválido. Verifique as configurações.");
      }
      
      // Atualizar feedback de progresso
      toast({
        title: "Sessão estabelecida!",
        description: "Preparando checkout...",
      });
      
      // Chamar a Supabase Function para criar a sessão de checkout do Stripe
      console.log('Chamando create-checkout-session com sessão válida...');
      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          planType,
          successUrl: `${window.location.origin}/payment-success?email=${encodeURIComponent(session.user.email || '')}`,
          cancelUrl: `${window.location.origin}/register?canceled=true`
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });
      
      if (functionError) {
        console.error('Erro na função de checkout:', functionError);
        throw new Error(`Erro no checkout: ${functionError.message}`);
      }

      console.log('Dados retornados pela função create-checkout-session:', functionData);

      if (functionData && functionData.url) {
        console.log('Redirecionando para:', functionData.url);
        
        // Garantir que o overlay de carregamento permaneça visível
        document.body.classList.add('overflow-hidden');
        
        // Adicionar um pequeno atraso antes do redirecionamento para garantir que o overlay seja exibido
        setTimeout(() => {
          window.location.href = functionData.url;
        }, 500);
        
        return;
      } else {
        throw new Error('Não foi possível obter a URL de checkout.');
      }
    } catch (err: any) {
      console.error('Erro no processo de registro ou checkout:', err);
      setError(err.message || 'Ocorreu um erro desconhecido.');
      setIsLoading(false);
      
      // Remover classe de loading em caso de erro
      const formElement = document.getElementById('register-form');
      if (formElement) {
        formElement.classList.remove('form-loading');
      }
    }
  };

  // Adicione este componente dentro do RegisterPage, antes do return
  const LoadingOverlay = () => {
    if (!isLoading) return null;
    
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-medium">
            {isLoading && error ? 'Processando...' : 'Criando conta e preparando checkout...'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex flex-col items-center justify-center p-4">
      {/* Renderizar o LoadingOverlay fora do container do formulário */}
      {isLoading && <LoadingOverlay />}
      
      {/* Container do formulário com largura máxima e sombra */}
      <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-2xl relative">
        {/* Logo e Título Centralizados */}
        <div className="flex flex-col items-center mb-8">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <img 
                src={logoUrl} 
                alt={logoAltText}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                  const nextSibling = target.nextElementSibling as HTMLElement;
                  if (nextSibling) {
                    nextSibling.style.display = 'block';
                  }
                }}
              />
              <span className="text-white font-bold text-lg" style={{ display: 'none' }}>
                {companyName.charAt(0)}
              </span>
            </div>
            <span className="text-2xl font-bold text-primary">{companyName}</span>
          </div>
          <h1 className="text-3xl font-bold text-center text-foreground">Criar Conta</h1>
          <p className="text-muted-foreground text-center mt-2">
            Preencha os campos abaixo para criar sua conta.
          </p>
        </div>

        {error && (
          <p className="text-sm text-center text-red-600 mb-4">{error}</p>
        )}

        <form id="register-form" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              placeholder="Digite seu nome completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              autoComplete="tel"
              required
              placeholder="(XX) XXXXX-XXXX"
              value={whatsapp}
              onChange={handleWhatsappChange}
              className="mt-1"
              maxLength={16}
            />
            <p className="mt-2 text-xs text-gray-500">
              Este número será utilizado para enviar mensagens e notificações importantes via WhatsApp.
            </p>
          </div>

          <div>
            <Label htmlFor="cpf">
              CPF <span className="text-muted-foreground text-sm">(opcional)</span>
            </Label>
            <Input
              id="cpf"
              name="cpf"
              type="text"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={handleCpfChange}
              className="mt-1"
              maxLength={14}
            />
            {cpf && !validateCPF(cpf) && (
              <p className="mt-1 text-xs text-red-600">CPF inválido</p>
            )}
          </div>

          <div>
            <Label htmlFor="birthDate">
              Data de Nascimento <span className="text-muted-foreground text-sm">(opcional)</span>
            </Label>
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="mt-1"
              max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            />
            {birthDate && !validateAge(birthDate) && (
              <p className="mt-1 text-xs text-red-600">Você deve ter pelo menos 18 anos</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Cadastre sua senha de acesso"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Criando conta...' : 'Criar Conta e Ir para Pagamento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
