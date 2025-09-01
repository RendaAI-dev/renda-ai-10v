import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="container max-w-4xl mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <Card className="p-8">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h1 className="text-3xl font-bold mb-6">Política de Privacidade</h1>
            
            <p className="text-muted-foreground mb-6">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Informações que Coletamos</h2>
              <p className="mb-4">
                Coletamos informações que você nos fornece diretamente, como quando você cria uma conta, 
                atualiza seu perfil ou entra em contato conosco.
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Nome e informações de contato</li>
                <li>Informações de conta e preferências</li>
                <li>Dados financeiros para processamento de transações</li>
                <li>Comunicações que você nos envia</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Como Usamos Suas Informações</h2>
              <p className="mb-4">
                Utilizamos suas informações para:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Fornecer e melhorar nossos serviços</li>
                <li>Processar transações e enviar notificações</li>
                <li>Comunicar com você sobre atualizações e ofertas</li>
                <li>Garantir a segurança de nossa plataforma</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Compartilhamento de Informações</h2>
              <p className="mb-4">
                Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, 
                exceto conforme descrito nesta política ou com seu consentimento explícito.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Segurança dos Dados</h2>
              <p className="mb-4">
                Implementamos medidas de segurança técnicas e organizacionais para proteger 
                suas informações contra acesso não autorizado, alteração, divulgação ou destruição.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Seus Direitos</h2>
              <p className="mb-4">
                Você tem o direito de:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Acessar suas informações pessoais</li>
                <li>Corrigir dados imprecisos</li>
                <li>Solicitar a exclusão de suas informações</li>
                <li>Retirar seu consentimento a qualquer momento</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Contato</h2>
              <p className="mb-4">
                Se você tiver dúvidas sobre esta Política de Privacidade, 
                entre em contato conosco através dos canais de suporte disponíveis.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}