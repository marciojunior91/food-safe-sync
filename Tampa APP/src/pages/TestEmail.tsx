import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  sendEmail, 
  sendWelcomeEmail, 
  sendExpiringItemsAlert,
  sendTaskAssignmentEmail,
  sendCertificateExpirationReminder
} from '@/lib/email/emailService';
import { toast } from 'sonner';
import { Mail, Send, Loader2 } from 'lucide-react';

export default function TestEmail() {
  const [to, setTo] = useState('');
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestSimple = async () => {
    if (!to) {
      toast.error('Digite um endereço de email');
      return;
    }

    setSending(true);
    setLastResult(null);

    const result = await sendEmail({
      to,
      subject: 'Email de Teste - Tampa APP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ea580c;">🧪 Email de Teste</h1>
          <p style="color: #374151;">Este é um email de teste do <strong>Tampa APP</strong>.</p>
          <p style="color: #6b7280; font-size: 14px;">Enviado em: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      `,
    });

    if (result.success) {
      toast.success('✅ Email enviado com sucesso!');
      setLastResult({ success: true, message: 'Email enviado' });
    } else {
      toast.error('❌ Erro ao enviar: ' + result.error);
      setLastResult({ success: false, message: result.error || 'Erro desconhecido' });
    }
    setSending(false);
  };

  const handleTestWelcome = async () => {
    if (!to) {
      toast.error('Digite um endereço de email');
      return;
    }

    setSending(true);
    setLastResult(null);

    const result = await sendWelcomeEmail(to, 'Usuário Teste');

    if (result.success) {
      toast.success('✅ Welcome email enviado!');
      setLastResult({ success: true, message: 'Welcome email enviado' });
    } else {
      toast.error('❌ Erro: ' + result.error);
      setLastResult({ success: false, message: result.error || 'Erro desconhecido' });
    }
    setSending(false);
  };

  const handleTestExpiring = async () => {
    if (!to) {
      toast.error('Digite um endereço de email');
      return;
    }

    setSending(true);
    setLastResult(null);

    const result = await sendExpiringItemsAlert(to, 'Usuário Teste', [
      { name: 'Molho de Tomate', daysUntilExpiry: 1, location: 'Geladeira A1' },
      { name: 'Queijo Mussarela', daysUntilExpiry: 3, location: 'Câmara Fria 2' },
      { name: 'Leite Integral', daysUntilExpiry: 2, location: 'Geladeira B3' },
    ]);

    if (result.success) {
      toast.success('✅ Alerta de vencimento enviado!');
      setLastResult({ success: true, message: 'Alerta enviado' });
    } else {
      toast.error('❌ Erro: ' + result.error);
      setLastResult({ success: false, message: result.error || 'Erro desconhecido' });
    }
    setSending(false);
  };

  const handleTestTask = async () => {
    if (!to) {
      toast.error('Digite um endereço de email');
      return;
    }

    setSending(true);
    setLastResult(null);

    const result = await sendTaskAssignmentEmail(
      to,
      'Usuário Teste',
      'Verificar Temperatura dos Freezers',
      'Realizar medição de temperatura em todos os freezers da unidade e registrar no sistema.',
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      'Admin Sistema'
    );

    if (result.success) {
      toast.success('✅ Notificação de tarefa enviada!');
      setLastResult({ success: true, message: 'Notificação enviada' });
    } else {
      toast.error('❌ Erro: ' + result.error);
      setLastResult({ success: false, message: result.error || 'Erro desconhecido' });
    }
    setSending(false);
  };

  const handleTestCertificate = async () => {
    if (!to) {
      toast.error('Digite um endereço de email');
      return;
    }

    setSending(true);
    setLastResult(null);

    const result = await sendCertificateExpirationReminder(
      to,
      'Usuário Teste',
      'Manipulação de Alimentos',
      7,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
    );

    if (result.success) {
      toast.success('✅ Lembrete de certificado enviado!');
      setLastResult({ success: true, message: 'Lembrete enviado' });
    } else {
      toast.error('❌ Erro: ' + result.error);
      setLastResult({ success: false, message: result.error || 'Erro desconhecido' });
    }
    setSending(false);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Mail className="h-8 w-8 text-primary" />
          Teste de Envio de Emails
        </h1>
        <p className="text-muted-foreground mt-2">
          Teste todas as funcionalidades de envio de email via Resend
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>📧 Configuração</CardTitle>
          <CardDescription>
            Digite o email que receberá os testes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="seu-email@exemplo.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1"
              disabled={sending}
            />
            {to && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setTo('')}
                disabled={sending}
              >
                ✕
              </Button>
            )}
          </div>
          {lastResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              lastResult.success 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <p className="text-sm font-medium">
                {lastResult.success ? '✅ Sucesso' : '❌ Erro'}
              </p>
              <p className="text-sm mt-1">{lastResult.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🧪 Teste Simples</CardTitle>
            <CardDescription>
              Email básico de teste
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleTestSimple} 
              disabled={sending || !to}
              className="w-full"
              variant="outline"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Teste
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">👋 Welcome Email</CardTitle>
            <CardDescription>
              Email de boas-vindas para novos usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleTestWelcome} 
              disabled={sending || !to}
              className="w-full"
              variant="outline"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Welcome
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">⚠️ Alerta de Vencimento</CardTitle>
            <CardDescription>
              Notificação de itens vencendo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleTestExpiring} 
              disabled={sending || !to}
              className="w-full"
              variant="outline"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Alerta
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📋 Notificação de Tarefa</CardTitle>
            <CardDescription>
              Email de atribuição de tarefa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleTestTask} 
              disabled={sending || !to}
              className="w-full"
              variant="outline"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Tarefa
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">📜 Lembrete de Certificado</CardTitle>
            <CardDescription>
              Email de vencimento de certificado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleTestCertificate} 
              disabled={sending || !to}
              className="w-full"
              variant="outline"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Lembrete
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">ℹ️ Informações</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• Verifique sua caixa de entrada após enviar</p>
          <p>• Se não receber, verifique a pasta de spam</p>
          <p>• Certifique-se de que as variáveis RESEND_API_KEY e RESEND_FROM_EMAIL estão configuradas</p>
          <p>• Edge Function deve estar deployed no Supabase</p>
        </CardContent>
      </Card>
    </div>
  );
}
