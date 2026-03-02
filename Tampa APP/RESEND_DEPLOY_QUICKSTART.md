# 🚀 Tampa APP - Deploy Resend Email Integration

## PASSO A PASSO RÁPIDO

### 1️⃣ Gerar API Key no Resend

1. **Acesse:** https://resend.com
2. **Crie conta** (se ainda não tiver)
3. **Dashboard → API Keys → Create API Key**
4. **Configure:**
   - Name: `Tampa APP Production`
   - Permission: `Full Access`
   - Domain: Selecione seu domínio (ou use teste)
5. **COPIE A KEY:** `re_xxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ Só aparece uma vez! Salve em lugar seguro.

### 2️⃣ Configurar Domínio no Resend (Opcional mas Recomendado)

**Se tiver domínio próprio:**

1. **Dashboard → Domains → Add Domain**
2. **Digite:** `seudominio.com`
3. **Adicione DNS Records** no seu registrador:
   ```
   Tipo: TXT
   Name: @
   Value: v=spf1 include:resend.com ~all
   
   Tipo: TXT
   Name: resend._domainkey
   Value: [fornecido pelo Resend]
   ```
4. **Aguarde verificação** (5-60 minutos)
5. **Email From:** `noreply@seudominio.com`

**Se NÃO tiver domínio:**

1. Use: `onboarding@resend.dev`
2. **Adicione Authorized Recipients:**
   - Dashboard → Settings → Authorized Recipients
   - Adicione emails que vão receber (seu email, equipe)

---

## 📋 COMANDOS PARA EXECUTAR

### Passo 1: Deploy Edge Function

```powershell
# Execute o script de deploy
.\scripts\deploy-send-email-function.ps1
```

**O script vai perguntar:**
- `RESEND_API_KEY`: Cole sua key do Resend
- `RESEND_FROM_EMAIL`: Digite algo como: `Tampa APP <noreply@seudominio.com>`

**OU configure manualmente:**

```powershell
# Login no Supabase (se ainda não fez)
npx supabase login

# Configurar secrets
npx supabase secrets set RESEND_API_KEY=re_SuaKeyAqui --project-ref imnecvcvhypnlvujajpn
npx supabase secrets set RESEND_FROM_EMAIL="Tampa APP <noreply@seudominio.com>" --project-ref imnecvcvhypnlvujajpn

# Deploy da função
npx supabase functions deploy send-email --project-ref imnecvcvhypnlvujajpn
```

### Passo 2: Testar Localmente

```powershell
# 1. Rodar aplicação
npm run dev

# 2. Acessar no navegador
# http://localhost:8080/test-email

# 3. Digite seu email e clique nos botões de teste
```

### Passo 3: Adicionar Variáveis no Vercel

**No Dashboard Vercel:**

1. **Acesse:** https://vercel.com/dashboard
2. **Selecione:** Tampa APP
3. **Settings → Environment Variables**
4. **Adicione:**

```
Key: RESEND_API_KEY
Value: re_SuaKeyAqui
Environments: ✅ Production ✅ Preview ✅ Development

Key: RESEND_FROM_EMAIL
Value: Tampa APP <noreply@seudominio.com>
Environments: ✅ Production ✅ Preview ✅ Development
```

### Passo 4: Deploy no Vercel

```powershell
# Commit das mudanças
git add .
git commit -m "Add Resend email integration with Edge Function"
git push

# Vercel vai fazer deploy automático
# Aguarde 2-3 minutos
```

### Passo 5: Testar em Produção

```
1. Acesse: https://seu-app.vercel.app/test-email
2. Digite seu email
3. Clique nos botões de teste
4. Verifique sua caixa de entrada
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### Resend:
- [ ] Conta criada
- [ ] API Key gerada e copiada
- [ ] Domínio verificado (ou usando teste)
- [ ] Email "From" definido

### Supabase:
- [ ] Edge Function `send-email` criada
- [ ] Secrets configurados (RESEND_API_KEY, RESEND_FROM_EMAIL)
- [ ] Função deployed com sucesso
- [ ] Aparece na lista: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/functions

### Local:
- [ ] `src/lib/email/emailService.ts` criado
- [ ] `src/pages/TestEmail.tsx` criado
- [ ] Rota adicionada no App.tsx
- [ ] Testes locais funcionando

### Vercel:
- [ ] Environment variables adicionadas
- [ ] Deploy realizado
- [ ] Testes em produção funcionando

---

## 🔧 TROUBLESHOOTING

### ❌ Erro: "RESEND_API_KEY not configured"
**Solução:** Verificar se configurou os secrets no Supabase

```powershell
# Listar secrets
npx supabase secrets list --project-ref imnecvcvhypnlvujajpn

# Se não estiver, adicionar
npx supabase secrets set RESEND_API_KEY=re_SuaKey --project-ref imnecvcvhypnlvujajpn
```

### ❌ Erro: "Domain not verified"
**Solução:** 
- Aguardar propagação DNS (até 24h)
- Usar `onboarding@resend.dev` temporariamente
- Adicionar recipient em Resend → Settings → Authorized Recipients

### ❌ Email não chega
**Soluções:**
1. Verificar spam/lixo eletrônico
2. Ver logs no Supabase:
   - Dashboard → Functions → send-email → Logs
3. Ver logs no Resend:
   - Dashboard → Logs → Recent Emails

### ❌ Erro: "Failed to invoke function"
**Soluções:**
1. Verificar se função está deployed:
   ```powershell
   npx supabase functions list --project-ref imnecvcvhypnlvujajpn
   ```
2. Verificar logs de erro
3. Re-deploy a função

---

## 📊 FUNÇÕES DE EMAIL DISPONÍVEIS

### 1. Email Simples
```typescript
import { sendEmail } from '@/lib/email/emailService';

await sendEmail({
  to: 'user@example.com',
  subject: 'Assunto',
  html: '<h1>Conteúdo HTML</h1>',
});
```

### 2. Welcome Email
```typescript
import { sendWelcomeEmail } from '@/lib/email/emailService';

await sendWelcomeEmail('user@example.com', 'Nome do Usuário');
```

### 3. Alerta de Vencimento
```typescript
import { sendExpiringItemsAlert } from '@/lib/email/emailService';

await sendExpiringItemsAlert('user@example.com', 'Nome', [
  { name: 'Produto', daysUntilExpiry: 2, location: 'Estoque' }
]);
```

### 4. Notificação de Tarefa
```typescript
import { sendTaskAssignmentEmail } from '@/lib/email/emailService';

await sendTaskAssignmentEmail(
  'user@example.com',
  'Nome',
  'Título da Tarefa',
  'Descrição',
  '10/02/2026',
  'Admin'
);
```

### 5. Lembrete de Certificado
```typescript
import { sendCertificateExpirationReminder } from '@/lib/email/emailService';

await sendCertificateExpirationReminder(
  'user@example.com',
  'Nome',
  'Certificado X',
  7,
  '15/02/2026'
);
```

---

## 🎯 PRÓXIMOS PASSOS

Após configurar Resend com sucesso:

1. **Integrar com autenticação:**
   - Enviar welcome email ao criar usuário
   - Reset de senha por email

2. **Automatizar alertas:**
   - Cron job para items vencendo
   - Notificações de tarefas vencidas

3. **Templates profissionais:**
   - Criar templates HTML responsivos
   - Adicionar logo da empresa

4. **Webhooks Resend:**
   - Track emails abertos
   - Track links clicados

---

## 📚 RECURSOS

- **Resend Dashboard:** https://resend.com/dashboard
- **Resend Docs:** https://resend.com/docs
- **Supabase Functions:** https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/functions
- **Vercel Dashboard:** https://vercel.com/dashboard

---

**Última Atualização:** 4 de Fevereiro de 2026  
**Status:** Pronto para deploy ✅
