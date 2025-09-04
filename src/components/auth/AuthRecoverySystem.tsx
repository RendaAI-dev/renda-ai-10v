import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, AlertTriangle, Mail, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const AuthRecoverySystem: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleEmailRecovery = async () => {
    if (!email) {
      toast.error('Digite um email válido');
      return;
    }

    setIsRecovering(true);
    setRecoveryResult(null);

    try {
      // 1. Tentar recuperar usuário via função do banco
      const { data, error: functionError } = await supabase
        .rpc('fix_user_auth_issues', { user_email: email });

      if (functionError) {
        throw functionError;
      }

      // 2. Confirmar email automaticamente se o usuário existe
      const { error: confirmError } = await supabase
        .rpc('confirm_user_email', { user_email: email });

      if (confirmError && !confirmError.message.includes('não encontrado')) {
        console.warn('Aviso na confirmação:', confirmError.message);
      }

      // 3. Tentar fazer login de teste (sem senha) para verificar se existe
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: 'test_invalid_password'
      });

      let message = '';
      let success = false;

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          message = '✅ Usuário encontrado e recuperado. Email confirmado automaticamente.';
          success = true;
        } else if (signInError.message.includes('Email not confirmed')) {
          message = '⚠️ Email confirmado automaticamente. Tente fazer login novamente.';
          success = true;
        } else if (signInError.message.includes('email rate limit')) {
          message = '⏳ Limite de taxa de email atingido. Aguarde alguns minutos e tente novamente.';
          success = false;
        } else {
          message = `⚠️ Resultado: ${signInError.message}`;
          success = false;
        }
      } else {
        message = '✅ Usuário recuperado e funcional.';
        success = true;
      }

      setRecoveryResult({ success, message });
      
      if (success) {
        toast.success('Usuário recuperado com sucesso!');
      } else {
        toast.warning('Recuperação parcial ou com avisos');
      }

    } catch (error: any) {
      console.error('Erro na recuperação:', error);
      setRecoveryResult({
        success: false,
        message: `❌ Erro: ${error.message}`
      });
      toast.error('Erro na recuperação do usuário');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleMassRecovery = async () => {
    setIsRecovering(true);
    
    try {
      // Recuperar usuários comuns que podem estar com problemas
      const commonEmails = [
        'admin@admin.com',
        'fernando.c123.456@gmail.com',
        'fernando22.a01sdf110545asd00@gmail.com'
      ];

      let recovered = 0;
      for (const email of commonEmails) {
        try {
          await supabase.rpc('fix_user_auth_issues', { user_email: email });
          recovered++;
        } catch (error) {
          console.warn(`Aviso na recuperação de ${email}:`, error);
        }
      }

      toast.success(`${recovered} usuários processados na recuperação em massa`);
      setRecoveryResult({
        success: true,
        message: `✅ Recuperação em massa concluída: ${recovered} usuários processados`
      });
    } catch (error: any) {
      console.error('Erro na recuperação em massa:', error);
      toast.error('Erro na recuperação em massa');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('Digite um email válido');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      toast.success('Email de recuperação enviado!');
    } catch (error: any) {
      console.error('Erro no reset de senha:', error);
      toast.error(`Erro ao enviar email: ${error.message}`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Sistema de Recuperação de Autenticação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recuperação Individual */}
        <div className="space-y-4">
          <h3 className="font-medium">Recuperação por Email</h3>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleEmailRecovery}
              disabled={isRecovering}
              variant="outline"
            >
              {isRecovering ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Recuperar
            </Button>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleMassRecovery}
            disabled={isRecovering}
            variant="secondary"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Recuperação em Massa
          </Button>
          
          <Button
            onClick={handleResetPassword}
            disabled={!email || isRecovering}
            variant="outline"
            className="w-full"
          >
            <Key className="w-4 h-4 mr-2" />
            Reset de Senha
          </Button>
        </div>

        {/* Resultado */}
        {recoveryResult && (
          <div className="mt-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {recoveryResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
              <Badge variant={recoveryResult.success ? "default" : "secondary"}>
                {recoveryResult.success ? 'Sucesso' : 'Aviso'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {recoveryResult.message}
            </p>
          </div>
        )}

        {/* Instruções */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Como Usar:
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Recuperação por Email:</strong> Confirma email e corrige dados do usuário</li>
            <li>• <strong>Recuperação em Massa:</strong> Processa usuários conhecidos com problemas</li>
            <li>• <strong>Reset de Senha:</strong> Envia email para redefinir senha</li>
            <li>• Todos os emails são confirmados automaticamente</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthRecoverySystem;