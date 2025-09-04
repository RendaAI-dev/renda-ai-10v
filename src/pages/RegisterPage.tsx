import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { getPlanTypeFromPriceId } from '@/utils/subscriptionUtils';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { validateCPF, formatCPF, cleanCPF, validateAge, validateUniqueCPF } from "@/utils/cpfValidation";
import { 
  validateZipCode, 
  formatZipCode, 
  cleanZipCode, 
  fetchAddressByZipCode, 
  validateAddress, 
  BRAZILIAN_STATES,
  Address 
} from "@/utils/addressValidation";

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
  
  // Campos de endereço
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0);
  const [attemptCount, setAttemptCount] = useState(0);

  // Hook para atualizar o cooldown timer
  const [cooldownDisplay, setCooldownDisplay] = useState<string>('');

  const priceId = searchParams.get('priceId');

  // Carregar estado do localStorage na inicialização
  React.useEffect(() => {
    const savedState = localStorage.getItem('register_cooldown_state');
    if (savedState) {
      try {
        const { cooldown, lastAttempt, attempts } = JSON.parse(savedState);
        const now = Date.now();
        if (cooldown > 0 && now < lastAttempt + cooldown) {
          setRateLimitCooldown(cooldown);
          setLastAttemptTime(lastAttempt);
          setAttemptCount(attempts || 0);
        } else {
          // Limpar estado expirado
          localStorage.removeItem('register_cooldown_state');
        }
      } catch (e) {
        localStorage.removeItem('register_cooldown_state');
      }
    }
  }, []);

  // Salvar estado no localStorage
  const saveCooldownState = (cooldown: number, lastAttempt: number, attempts: number) => {
    if (cooldown > 0) {
      localStorage.setItem('register_cooldown_state', JSON.stringify({
        cooldown,
        lastAttempt,
        attempts
      }));
    } else {
      localStorage.removeItem('register_cooldown_state');
    }
  };

  // Atualizar display do cooldown
  React.useEffect(() => {
    if (rateLimitCooldown === 0) {
      setCooldownDisplay('');
      return;
    }

    const updateCooldown = () => {
      const now = Date.now();
      const remainingTime = Math.max(0, lastAttemptTime + rateLimitCooldown - now);
      
      if (remainingTime <= 0) {
        setRateLimitCooldown(0);
        setCooldownDisplay('');
        return;
      }

      const minutes = Math.floor(remainingTime / 60000);
      const seconds = Math.floor((remainingTime % 60000) / 1000);
      
      if (minutes > 0) {
        setCooldownDisplay(`${minutes}m ${seconds}s`);
      } else {
        setCooldownDisplay(`${seconds}s`);
      }
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);

    return () => clearInterval(interval);
  }, [rateLimitCooldown, lastAttemptTime]);

  // Função melhorada para aguardar sessão com retry
  const waitForSession = async (maxRetries: number = 3): Promise<boolean> => {
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`🔄 Tentativa ${retryCount + 1}/${maxRetries} - Verificando sessão...`);
        
        // Verificar se já há sessão ativa
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user) {
          console.log('✅ Sessão encontrada imediatamente');
          return true;
        }

        // Aguardar até 10 segundos por uma nova sessão
        const sessionPromise = new Promise<boolean>((resolve) => {
          let timeoutId: NodeJS.Timeout;
          const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
            subscription.unsubscribe();
          };

          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
              console.log(`🔔 Auth event: ${event}, Session: ${!!session}`);
              if (session?.user) {
                cleanup();
                resolve(true);
              }
            }
          );

          // Timeout progressivo (mais tempo a cada retry)
          const timeoutMs = 5000 + (retryCount * 2500); // 5s, 7.5s, 10s
          timeoutId = setTimeout(() => {
            cleanup();
            resolve(false);
          }, timeoutMs);
        });

        const hasSession = await sessionPromise;
        if (hasSession) {
          console.log(`✅ Sessão estabelecida na tentativa ${retryCount + 1}`);
          return true;
        }
        
        retryCount++;
        console.log(`⚠️ Tentativa ${retryCount} falhou, tentando novamente...`);
        
        // Aguardar antes da próxima tentativa
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`❌ Erro na tentativa ${retryCount + 1}:`, error);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.log(`❌ Todas as ${maxRetries} tentativas falharam`);
    return false;
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

  // Função para lidar com a mudança no campo de CEP
  const handleZipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatZipCode(e.target.value);
    setZipCode(formattedValue);

    // Se o CEP estiver completo, buscar o endereço
    const cleanedZipCode = cleanZipCode(formattedValue);
    if (cleanedZipCode.length === 8) {
      setIsLoadingAddress(true);
      try {
        const addressData = await fetchAddressByZipCode(cleanedZipCode);
        if (addressData) {
          setStreet(addressData.street || '');
          setNeighborhood(addressData.neighborhood || '');
          setCity(addressData.city || '');
          setState(addressData.state || '');
          
          toast({
            title: "Endereço encontrado!",
            description: "Os campos foram preenchidos automaticamente.",
          });
        }
      } catch (error: any) {
        toast({
          title: "Erro ao buscar endereço",
          description: error.message || "CEP não encontrado",
          variant: "destructive",
        });
      } finally {
        setIsLoadingAddress(false);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Verificar se está em cooldown de rate limit
    const now = Date.now();
    if (rateLimitCooldown > 0 && now < lastAttemptTime + rateLimitCooldown) {
      const remainingTime = Math.ceil((lastAttemptTime + rateLimitCooldown - now) / 1000);
      setError(`Aguarde ${remainingTime} segundos antes de tentar novamente.`);
      return;
    }
    
    // Prevenir múltiplas submissões simultâneas
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setLastAttemptTime(now);
    
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
      // Validar CPF obrigatório
      if (!cpf || !validateCPF(cpf)) {
        setError("CPF é obrigatório e deve ser válido.");
        setIsLoading(false);
        formElement?.classList.remove('form-loading');
        return;
      }

      // Verificar se CPF já está cadastrado
      if (!(await validateUniqueCPF(cpf))) {
        setError("Este CPF já está cadastrado no sistema.");
        setIsLoading(false);
        formElement?.classList.remove('form-loading');
        return;
      }

      // Validar campos de endereço obrigatórios
      const addressData: Partial<Address> = {
        zipCode,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
      };

      const addressErrors = validateAddress(addressData);
      if (addressErrors.length > 0) {
        setError(addressErrors[0]);
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
        cpf: cleanCPF(cpf),
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim() || null,
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim(),
        zip_code: cleanZipCode(zipCode),
      };

      // Adicionar data de nascimento se fornecida
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

      // Tentar aguardar sessão por alguns segundos
      console.log('🔄 Verificando sessão...');
      const sessionValid = await waitForSession();
      
      if (!sessionValid) {
        // Se não conseguir sessão imediatamente, usar useAutoLogin
        console.log('⚠️ Sessão não disponível imediatamente, usando login automático...');
        const { useAutoLogin } = await import('@/hooks/useAutoLogin');
        
        toast({
          title: "Conta criada!",
          description: "Redirecionando para finalizar o processo...",
        });
        
        // Redirecionar para completar o login
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              email, 
              autoLogin: true,
              priceId,
              message: "Conta criada! Complete o login para continuar." 
            } 
          });
        }, 1000);
        
        return;
      }

      // Obter sessão atual para o checkout
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        // Fallback para login manual
        navigate('/login', { 
          state: { 
            email, 
            priceId,
            message: "Conta criada! Faça login para continuar o checkout." 
          } 
        });
        return;
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
      console.error('Erro no processo de registro:', err);
      
      // Tratar rate limiting especificamente
      if (err.message?.includes('email rate limit exceeded') || err.code === 'over_email_send_rate_limit') {
        // Implementar cooldown exponencial baseado no número de tentativas
        const newAttemptCount = attemptCount + 1;
        const baseCooldown = 60000; // 1 minuto base
        const cooldownTime = Math.min(baseCooldown * Math.pow(2, newAttemptCount - 1), 300000); // máximo 5 minutos
        
        setAttemptCount(newAttemptCount);
        setRateLimitCooldown(cooldownTime);
        
        // Salvar estado no localStorage
        saveCooldownState(cooldownTime, now, newAttemptCount);
        
        const minutes = Math.ceil(cooldownTime / 60000);
        const seconds = Math.ceil((cooldownTime % 60000) / 1000);
        
        const timeDisplay = minutes > 0 ? `${minutes} minuto(s)` : `${seconds} segundo(s)`;
        
        setError(`Limite de envio de emails atingido. Aguarde ${timeDisplay} antes de tentar novamente. Use um email diferente se necessário.`);
        
        // Sugerir alternativas
        toast({
          title: "⏰ Limite de emails atingido",
          description: `Tente novamente em ${timeDisplay} ou use um email diferente. Tentativa ${newAttemptCount}/5`,
          variant: "destructive",
        });
      } else if (err.message?.includes('User already registered') || err.message?.includes('already been registered')) {
        setError('Este email já está cadastrado. Você será redirecionado para o login.');
        toast({
          title: "Email já cadastrado",
          description: "Redirecionando para a página de login...",
        });
        setTimeout(() => navigate('/login', { state: { email } }), 2000);
      } else if (err.message?.includes('Invalid email')) {
        setError('Email inválido. Verifique o endereço informado.');
      } else if (err.message?.includes('Password should be at least 6 characters')) {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (err.message?.includes('signup is disabled')) {
        setError('Cadastro temporariamente desabilitado. Tente novamente mais tarde.');
      } else {
        setError(err.message || 'Erro ao criar conta. Tente novamente em alguns minutos.');
      }
      
      setIsLoading(false);
      
      // Remover classe de loading em caso de erro
      const formElement = document.getElementById('register-form');
      if (formElement) {
        formElement.classList.remove('form-loading');
      }
      document.body.classList.remove('overflow-hidden');
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex flex-col items-center justify-center p-4 py-8">
      {/* Renderizar o LoadingOverlay fora do container do formulário */}
      {isLoading && <LoadingOverlay />}
      
      {/* Container do formulário com largura máxima e sombra */}
      <div className="w-full max-w-2xl bg-card p-8 rounded-xl shadow-2xl relative">
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
          {/* Seção: Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  name="cpf"
                  type="text"
                  required
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
            </CardContent>
          </Card>

          {/* Seção: Endereço */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Endereço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="zipCode">CEP *</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  required
                  placeholder="00000-000"
                  value={zipCode}
                  onChange={handleZipCodeChange}
                  className="mt-1"
                  maxLength={9}
                  disabled={isLoadingAddress}
                />
                {isLoadingAddress && (
                  <p className="mt-1 text-xs text-blue-600">Buscando endereço...</p>
                )}
                {zipCode && !validateZipCode(zipCode) && (
                  <p className="mt-1 text-xs text-red-600">CEP inválido</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="street">Logradouro *</Label>
                  <Input
                    id="street"
                    name="street"
                    type="text"
                    required
                    placeholder="Rua, Avenida, etc."
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="number">Número *</Label>
                  <Input
                    id="number"
                    name="number"
                    type="text"
                    required
                    placeholder="123"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="complement">
                    Complemento <span className="text-muted-foreground text-sm">(opcional)</span>
                  </Label>
                  <Input
                    id="complement"
                    name="complement"
                    type="text"
                    placeholder="Apto, Casa, etc."
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    name="neighborhood"
                    type="text"
                    required
                    placeholder="Nome do bairro"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    required
                    placeholder="Nome da cidade"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Select value={state} onValueChange={setState} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map((stateOption) => (
                        <SelectItem key={stateOption.value} value={stateOption.value}>
                          {stateOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            {rateLimitCooldown > 0 && cooldownDisplay && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-800">
                      <strong>Aguarde {cooldownDisplay}</strong> antes de tentar novamente ou use um email diferente.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || (rateLimitCooldown > 0 && Date.now() < lastAttemptTime + rateLimitCooldown)}
            >
              {isLoading ? 'Criando conta...' : 'Criar Conta e Ir para Pagamento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
