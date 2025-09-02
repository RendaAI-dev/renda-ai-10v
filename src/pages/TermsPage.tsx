import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TermsPage() {
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
            <h1 className="text-3xl font-bold mb-6">Termos de Uso</h1>
            
            <p className="text-muted-foreground mb-6">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
              <p className="mb-4">
                Ao acessar e usar este serviço, você aceita e concorda em estar vinculado aos 
                termos e condições deste acordo. Se você não concordar com estes termos, 
                não deve usar este serviço.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
              <p className="mb-4">
                Nossa plataforma oferece ferramentas de gestão financeira pessoal, incluindo 
                acompanhamento de despesas, definição de metas e relatórios financeiros.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Registro de Conta</h2>
              <p className="mb-4">
                Para usar nosso serviço, você deve:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Fornecer informações precisas e completas</li>
                <li>Manter a segurança de sua conta e senha</li>
                <li>Notificar-nos imediatamente sobre uso não autorizado</li>
                <li>Ser responsável por todas as atividades em sua conta</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Uso Aceitável</h2>
              <p className="mb-4">
                Você concorda em não:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Usar o serviço para atividades ilegais</li>
                <li>Interferir no funcionamento do serviço</li>
                <li>Tentar acessar contas de outros usuários</li>
                <li>Transmitir conteúdo malicioso ou prejudicial</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Pagamentos e Assinaturas</h2>
              <p className="mb-4">
                Alguns recursos podem exigir pagamento. Os preços estão sujeitos a alterações, 
                e você será notificado sobre mudanças nas taxas com antecedência razoável.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Propriedade Intelectual</h2>
              <p className="mb-4">
                Todo o conteúdo e funcionalidade do serviço são propriedade exclusiva nossa 
                e são protegidos por leis de direitos autorais e outras leis de propriedade intelectual.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Limitação de Responsabilidade</h2>
              <p className="mb-4">
                Em nenhuma circunstância seremos responsáveis por danos indiretos, incidentais, 
                especiais ou consequenciais decorrentes do uso do serviço.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Modificações</h2>
              <p className="mb-4">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. 
                As modificações entrarão em vigor após a publicação no site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Contato</h2>
              <p className="mb-4">
                Para dúvidas sobre estes Termos de Uso, entre em contato conosco através 
                dos canais de suporte disponíveis.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}