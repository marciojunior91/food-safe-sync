# Testar SMTP Configurado

## ✅ CONFIGURAÇÃO ATUAL: MAILTRAP (Desenvolvimento)

**Status**: Configurado para desenvolvimento
**Emails**: Não são enviados para destinatários reais
**Inbox de Teste**: https://mailtrap.io/inboxes

---

## 🔧 Configuração Mailtrap

### Credenciais (já configuradas no Supabase):
```
SMTP Host: sandbox.smtp.mailtrap.io
SMTP Port: 587
SMTP User: [seu mailtrap username]
SMTP Password: [sua mailtrap password]
Sender Email: noreply@tampaapp.com
Sender Name: Tampa APP
```

---

## Via Dashboard
1. Vá em: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/auth/users
2. Clique em "Invite User"
3. Digite seu email pessoal
4. Verifique se recebeu o email

## Via SQL (resetPasswordForEmail)
Execute no SQL Editor:

```sql
-- Isso vai testar o envio de email de reset de senha
SELECT auth.admin.reset_password_for_user(
  'EMAIL_DO_USUARIO_EXISTENTE@example.com'
);
```

## Via Edge Function (nossa função atual)

Depois de configurar o SMTP, vamos atualizar nossa edge function para usar `resetPasswordForEmail` novamente!

### Atualizar invite-user function:

No arquivo: `supabase/functions/invite-user/index.ts`

Adicionar APÓS criar o usuário:

```typescript
// Send password reset email so user can set their own password
console.log('📧 Sending password reset email...');
const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
  redirectTo: `${req.headers.get('origin')}/auth/callback`,
});

if (resetError) {
  console.warn('⚠️ Warning: Could not send password reset email:', resetError);
  // Don't fail - user was created successfully
} else {
  console.log('✅ Password reset email sent');
}
```

## Verificar Logs

Após configurar e enviar um email de teste, verifique os logs em:
- Supabase: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/logs/edge-functions
- Seu provedor SMTP (SendGrid/Gmail/etc) também tem logs de envio

## Troubleshooting

### "Invalid credentials"
- Verifique se o SMTP User e Password estão corretos
- No Gmail, certifique-se de usar App Password, não sua senha normal

### "Authentication failed"
- Verifique se 2FA está ativo (obrigatório para Gmail)
- Verifique se a API Key está correta (SendGrid/Resend)

### Emails não chegam
- Verifique pasta de SPAM
- Verifique se o sender email está verificado (SendGrid/Resend)
- Verifique rate limits do seu plano

### "Connection timeout"
- Tente porta 465 ao invés de 587
- Verifique se seu firewall/antivírus não está bloqueando

## Minha Recomendação

Para **PRODUÇÃO**: SendGrid ou Resend
- Confiáveis
- Boa deliverability
- Analytics e logs
- Plano gratuito suficiente para começar

Para **DESENVOLVIMENTO/TESTE**: Mailtrap
- Não envia emails reais (tudo fica no inbox de teste)
- Perfeito para não enviar emails acidentalmente para usuários reais
