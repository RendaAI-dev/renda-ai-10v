
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '@/services/authService';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useAutoLogin = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const performAutoLogin = async (email: string, password?: string) => {
    if (!email || email === 'user@example.com') {
      toast({
        title: "Email não encontrado",
        description: "Não foi possível fazer login automático. Faça login manualmente.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setIsLoggingIn(true);
    
    try {
      // Verificar se já existe sessão ativa
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('Sessão ativa encontrada, redirecionando...');
        toast({
          title: "Login automático realizado!",
          description: "Redirecionando para o dashboard...",
        });
        navigate('/dashboard');
        return;
      }

      // Se temos senha, tentar login real
      if (password) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) {
          throw loginError;
        }

        if (loginData.session) {
          toast({
            title: "Login realizado com sucesso!",
            description: "Redirecionando para o dashboard...",
          });
          navigate('/dashboard');
          return;
        }
      }

      // Fallback para login manual
      toast({
        title: "Conta criada com sucesso!",
        description: "Faça login para acessar sua conta.",
      });
      
      navigate('/login', { 
        state: { 
          email, 
          message: "Sua conta foi criada! Faça login com sua senha." 
        } 
      });
      
    } catch (error: any) {
      console.error('Erro no auto-login:', error);
      toast({
        title: "Redirecionando para login",
        description: "Complete seu login para acessar sua conta.",
        variant: "destructive",
      });
      
      navigate('/login', { state: { email } });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return { performAutoLogin, isLoggingIn };
};
