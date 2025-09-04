import { supabase } from "@/integrations/supabase/client";

// Mapear códigos de erro do Supabase para mensagens em português
const mapAuthError = (error: any): string => {
  if (!error) return 'Erro desconhecido';

  // Rate limiting específico
  if (error.code === 'over_email_send_rate_limit' || 
      error.message?.includes('email rate limit exceeded') ||
      error.message?.includes('rate limit')) {
    return 'Muitas tentativas de cadastro. Aguarde alguns minutos antes de tentar novamente ou use um email diferente.';
  }

  // Outros códigos de erro comuns
  switch (error.code) {
    case 'email_address_invalid':
    case 'invalid_email':
      return 'Email inválido. Verifique o endereço informado.';
    
    case 'password_too_short':
    case 'weak_password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    
    case 'user_already_exists':
    case 'email_address_already_in_use':
      return 'Este email já está cadastrado. Tente fazer login.';
    
    case 'signup_disabled':
      return 'Cadastro temporariamente desabilitado. Tente novamente mais tarde.';
    
    case 'email_not_confirmed':
      return 'Confirme seu email antes de fazer login.';
    
    case 'invalid_credentials':
      return 'Email ou senha incorretos.';
    
    case 'too_many_requests':
      return 'Muitas tentativas de login. Aguarde alguns minutos.';
      
    default:
      // Verificar mensagens específicas
      if (error.message?.includes('Invalid login credentials')) {
        return 'Email ou senha incorretos.';
      }
      if (error.message?.includes('Email not confirmed')) {
        return 'Confirme seu email antes de fazer login.';
      }
      if (error.message?.includes('User already registered')) {
        return 'Este email já está cadastrado. Tente fazer login.';
      }
      if (error.message?.includes('signup is disabled')) {
        return 'Cadastro temporariamente desabilitado. Tente novamente mais tarde.';
      }
      
      return error.message || 'Erro de autenticação. Tente novamente.';
  }
};

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

const isRateLimited = (email: string): boolean => {
  const attempts = loginAttempts.get(email);
  if (!attempts) return false;
  
  const now = Date.now();
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(email);
    return false;
  }
  
  return attempts.count >= MAX_LOGIN_ATTEMPTS;
};

const recordLoginAttempt = (email: string, success: boolean) => {
  const now = Date.now();
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: now };
  
  if (success) {
    loginAttempts.delete(email);
  } else {
    attempts.count++;
    attempts.lastAttempt = now;
    loginAttempts.set(email, attempts);
    
    // Log failed attempt for security monitoring
    console.warn('Failed login attempt:', {
      email: email.substring(0, 3) + '***', // Partially obscured for privacy
      timestamp: new Date().toISOString(),
      attemptCount: attempts.count
    });
  }
};

const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase().substring(0, 254); // RFC 5321 limit
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6 && password.length <= 128;
};

export const loginUser = async (email: string, password: string) => {
  try {
    // Sanitize and validate inputs
    const sanitizedEmail = sanitizeEmail(email);
    
    if (!validateEmail(sanitizedEmail)) {
      throw new Error('Email inválido');
    }
    
    if (!validatePassword(password)) {
      throw new Error('Senha deve ter entre 6 e 128 caracteres');
    }
    
    // Check rate limiting
    if (isRateLimited(sanitizedEmail)) {
      throw new Error('Muitas tentativas de login. Tente novamente em 15 minutos.');
    }
    
    console.log("AuthService: Attempting login for:", sanitizedEmail.substring(0, 3) + '***');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password
    });
    
    if (error) {
      recordLoginAttempt(sanitizedEmail, false);
      console.error("AuthService: Login error:", error);
      throw error;
    }
    
    recordLoginAttempt(sanitizedEmail, true);
    console.log("AuthService: Login successful");
    
    return data;
  } catch (error) {
    console.error("AuthService: Login error:", error);
    throw error;
  }
};

export const registerUser = async (email: string, password: string, name?: string, metadata?: Record<string, any>) => {
  try {
    // Validação
    const sanitizedEmail = sanitizeEmail(email);
    
    if (!validateEmail(sanitizedEmail)) {
      throw new Error('Email inválido');
    }
    
    if (!validatePassword(password)) {
      throw new Error('Senha deve ter entre 6 e 128 caracteres');
    }

    const signUpData: any = {
      email: sanitizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: name || '',
          ...metadata
        }
      }
    };

    console.log('AuthService: Tentando registro para:', sanitizedEmail.substring(0, 3) + '***');

    const { data, error } = await supabase.auth.signUp(signUpData);

    if (error) {
      console.error('Erro no registro:', error);
      
      // Usar a nova função de mapeamento de erros
      const friendlyMessage = mapAuthError(error);
      throw new Error(friendlyMessage);
    }

    console.log('AuthService: Registro bem-sucedido');
    return { user: data.user, session: data.session };
  } catch (error: any) {
    console.error('Erro no registerUser:', error);
    throw error;
  }
};

// Nova função para confirmar usuário via admin (se necessário)
export const confirmUserEmail = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('confirm-user-email', {
      body: { email }
    });

    if (error) {
      console.error('Erro ao confirmar email:', error);
      return false;
    }

    return data?.success || false;
  } catch (error) {
    console.error('Erro na confirmação de email:', error);
    return false;
  }
};

export const logoutUser = async () => {
  try {
    // console.log("AuthService: Attempting logout");
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("AuthService: Logout error:", error);
      throw error;
    }
    
    // console.log("AuthService: Logout successful");
    return true;
  } catch (error) {
    console.error("AuthService: Logout error:", error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    // console.log("AuthService: Attempting password reset for:", email);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) {
      console.error("AuthService: Password reset error:", error);
      throw error;
    }
    
    // console.log("AuthService: Password reset email sent for:", email);
    return true;
  } catch (error) {
    console.error("AuthService: Password reset error:", error);
    throw error;
  }
};

export const getCurrentSession = async () => {
  try {
    // console.log("AuthService: Getting current session");
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("AuthService: Error getting session:", error);
      throw error;
    }
    // console.log("AuthService: Session retrieved:", !!data.session);
    return data.session;
  } catch (error) {
    console.error("AuthService: Error getting session:", error);
    return null;
  }
};

export const setupAuthListener = (callback: (session: any) => void) => {
  // console.log("AuthService: Setting up auth state listener");
  
  return supabase.auth.onAuthStateChange((event, session) => {
    // console.log("AuthService: Auth state change event:", event);
    // console.log("AuthService: Session in event:", !!session);
    // console.log("AuthService: User in session:", session?.user?.email || 'no user');
    
    // Call the callback immediately without setTimeout for faster response
    callback(session);
  });
};
