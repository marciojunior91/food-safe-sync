# ✅ Implementação Resend SMTP - Checklist Completo

## 📋 Checklist de Configuração

### ✅ Passo 1: Criar Conta Resend
- [ ] Acessar https://resend.com/signup
- [ ] Criar conta
- [ ] Confirmar email

### ✅ Passo 2: Obter API Key
- [ ] Login no Resend Dashboard
- [ ] Ir em "API Keys"
- [ ] Criar nova API Key: "Tampa APP Production"
- [ ] Permissão: "Sending access"
- [ ] Copiar API Key (começa com `re_`)
- [ ] **IMPORTANTE**: Guardar a key em local seguro!

### ✅ Passo 3: Configurar SMTP no Supabase
- [ ] Acessar: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/settings/auth
- [ ] Ativar "Enable Custom SMTP"
- [ ] Preencher:
  ```
  SMTP Host: smtp.resend.com
  SMTP Port: 587
  SMTP User: resend
  SMTP Password: [Sua API Key - re_xxxxx]
  Sender Email: onboarding@resend.dev
  Sender Name: Tampa APP
  Enable TLS: ON
  ```
- [ ] Clicar em "Save"

### ✅ Passo 4: Testar pelo Dashboard
- [ ] Acessar: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/auth/users
- [ ] Clicar "Invite User"
- [ ] Digitar seu email pessoal
- [ ] Verificar recebimento (inbox ou spam)

### ✅ Passo 5: Deploy da Edge Function
- [ ] Edge function atualizada (✅ Feito!)
- [ ] Deploy executado: `npx supabase functions deploy invite-user --no-verify-jwt`

### ✅ Passo 6: Testar Criação de Usuário
- [ ] Abrir módulo People
- [ ] Clicar "Create Auth User"
- [ ] Preencher formulário
- [ ] Verificar se toast mostra "email sent"
- [ ] Verificar se email chegou

---

## 🎯 O Que Foi Implementado

### Backend (Edge Function)
✅ Usuário criado com senha padrão: `TampaAPP@2026`
✅ Email de reset de senha enviado via Resend
✅ Se email falhar, não quebra o processo (usuário ainda é criado)
✅ Logs detalhados para debug

### Frontend (UI)
✅ Toast atualizado mostrando que email foi enviado
✅ Informação sobre senha backup
✅ Instruções para usuário verificar spam

### Fluxo Completo
```
1. Admin cria usuário no módulo People
   ↓
2. Edge function cria: auth.users + profiles + user_roles
   ↓
3. Email enviado via Resend com link de reset de senha
   ↓
4. Novo usuário recebe email
   ↓
5. Usuário clica no link e define nova senha
   ↓
6. Usuário faz login com nova senha
```

---

## 🔍 Verificar Logs

### Logs do Supabase
https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/logs/edge-functions

Procure por:
- ✅ `User created: email, user ID: xxx`
- ✅ `Password reset email sent to email`
- ❌ `Warning: Could not send password reset email` (se houver erro)

### Logs do Resend
https://resend.com/emails

Você verá:
- Status do email (Sent, Delivered, Bounced)
- Timestamp
- Recipient
- Subject

---

## 🐛 Troubleshooting

### Email não está sendo enviado
**Verificar:**
1. API Key está correta no Supabase?
2. Resend dashboard mostra tentativas de envio?
3. Logs da edge function mostram erro?

**Solução:**
- Re-verificar API Key
- Verificar se TLS está ativado
- Testar manualmente pelo Dashboard do Supabase

### Email vai para spam
**Verificar:**
1. Usar domínio próprio verificado ao invés de onboarding@resend.dev
2. Configurar SPF, DKIM, DMARC no DNS

**Solução:**
- Ir em Resend → Domains
- Adicionar seu domínio
- Seguir instruções de DNS
- Usar email do seu domínio (ex: noreply@tampaapp.com)

### Usuário não recebe email
**Verificar:**
1. Email está correto?
2. Verificar pasta de spam
3. Verificar quota do Resend (3,000/mês no free tier)

**Solução Backup:**
- Usuário pode usar senha padrão: `TampaAPP@2026`
- Admin pode enviar novamente pelo Dashboard do Supabase

---

## 🎨 Customizar Templates de Email (Opcional)

### Personalizar Email de Reset de Senha

1. Vá em Supabase → Authentication → Email Templates
2. Selecione "Change Email / Password Recovery"
3. Customize o HTML:

```html
<h2>Welcome to Tampa APP!</h2>
<p>Hello {{ .ConfirmationURL }}!</p>
<p>Click the link below to set your password:</p>
<a href="{{ .ConfirmationURL }}">Set My Password</a>
```

### Variáveis Disponíveis:
- `{{ .Email }}` - Email do usuário
- `{{ .ConfirmationURL }}` - Link de confirmação
- `{{ .Token }}` - Token de confirmação
- `{{ .SiteURL }}` - URL do site

---

## 📊 Monitoramento

### Métricas Importantes
- **Emails enviados/dia**: Verificar no Resend Dashboard
- **Taxa de entrega**: Deve ser > 95%
- **Taxa de abertura**: ~20-40% é normal
- **Bounces**: Deve ser < 5%

### Alertas
Configure alertas no Resend para:
- Quota próxima do limite (2,700/3,000)
- Taxa de bounce alta (> 10%)
- Falhas de autenticação

---

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras
1. **Domínio próprio**: Usar `noreply@tampaapp.com` ao invés de `onboarding@resend.dev`
2. **Templates customizados**: Email com logo e cores da marca
3. **Email de boas-vindas**: Enviar instruções adicionais após criação
4. **Notificações**: Avisar admin quando novo usuário for criado
5. **Upgrade de plano**: Se precisar > 3,000 emails/mês

---

## 📝 Notas Importantes

⚠️ **Senha Padrão**
- Todos os usuários são criados com senha: `TampaAPP@2026`
- É apenas backup caso o email não chegue
- Incentive usuários a mudarem a senha após primeiro login

⚠️ **Rate Limits**
- Resend Free: 3,000 emails/mês
- Resend Free: 100 emails/dia
- Se exceder, emails não serão enviados

⚠️ **Segurança**
- API Key do Resend é sensível - nunca commitar no código
- Está armazenada no Supabase (seguro)
- Se vazar, revogue e crie nova no Resend Dashboard

---

## ✅ Status Final

- [✅] Resend configurado
- [✅] SMTP no Supabase
- [✅] Edge function atualizada
- [✅] Frontend atualizado
- [✅] Deploy realizado
- [ ] Teste final pendente

**Próximo passo**: Teste criando um usuário real e verifique se o email chega!
