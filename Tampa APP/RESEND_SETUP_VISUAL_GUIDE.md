# 🎯 Resend + Vercel - PASSO A PASSO SIMPLES

## VOCÊ VAI PRECISAR DE 2 CHAVES:

### 1. `RESEND_API_KEY` (do Resend)
### 2. `RESEND_FROM_EMAIL` (seu email de envio)

---

## 📋 PASSO 1: RESEND - GERAR API KEY

### 1.1 Criar Conta
```
🌐 Acesse: https://resend.com
📝 Click: "Sign Up"
✉️ Confirme seu email
```

### 1.2 Gerar API Key
```
1. Dashboard → API Keys (menu lateral esquerdo)
2. Click: "Create API Key"
3. Name: Tampa APP Production
4. Permission: Full Access
5. Click: "Create"
6. COPIE A KEY: re_xxxxxxxxxxxxxxxxxxxxxxxxx
   ⚠️ SÓ APARECE UMA VEZ!
```

**💾 Salve em um arquivo .txt temporário:**
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 1.3 Configurar Email de Envio

#### OPÇÃO A: Com Domínio Próprio (Recomendado)

```
1. Dashboard → Domains → "Add Domain"
2. Digite: seudominio.com
3. Copie os DNS Records que aparecerem:

   📋 SPF Record:
   Tipo: TXT
   Nome: @
   Valor: v=spf1 include:resend.com ~all
   
   📋 DKIM Record:
   Tipo: TXT
   Nome: resend._domainkey
   Valor: [valor fornecido pelo Resend]

4. Vá no seu registrador de domínio (GoDaddy, Namecheap, etc.)
5. Adicione esses records no DNS
6. Volte no Resend e click "Verify Domain"
7. Aguarde 5-30 minutos (propagação DNS)

✅ Use como FROM: noreply@seudominio.com
```

#### OPÇÃO B: Sem Domínio (Apenas Teste)

```
1. Dashboard → Settings → Authorized Recipients
2. Click "Add Recipient"
3. Digite seu email (e emails da equipe)
4. Confirme o email recebido

✅ Use como FROM: onboarding@resend.dev
```

**💾 Salve:**
```
RESEND_FROM_EMAIL=Tampa APP <noreply@seudominio.com>
ou
RESEND_FROM_EMAIL=Tampa APP <onboarding@resend.dev>
```

---

## 📋 PASSO 2: SUPABASE - DEPLOY EDGE FUNCTION

### Opção A: Script Automatizado (Mais Fácil)

```powershell
# No terminal PowerShell, dentro da pasta do projeto:
.\scripts\deploy-send-email-function.ps1

# Quando perguntar:
# Enter your RESEND_API_KEY: re_xxxxxxxxxxxxxxxxxxxxxxxxx
# Enter your RESEND_FROM_EMAIL: Tampa APP <noreply@seudominio.com>
```

### Opção B: Manual

```powershell
# 1. Login no Supabase (apenas primeira vez)
npx supabase login

# 2. Configurar secrets
npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx --project-ref imnecvcvhypnlvujajpn

npx supabase secrets set RESEND_FROM_EMAIL="Tampa APP <noreply@seudominio.com>" --project-ref imnecvcvhypnlvujajpn

# 3. Deploy da função
npx supabase functions deploy send-email --project-ref imnecvcvhypnlvujajpn
```

### ✅ Verificar se funcionou:

```powershell
npx supabase functions list --project-ref imnecvcvhypnlvujajpn
```

**Deve aparecer:**
```
send-email    https://imnecvcvhypnlvujajpn.supabase.co/functions/v1/send-email
```

---

## 📋 PASSO 3: VERCEL - ADICIONAR VARIÁVEIS

### 3.1 Acessar Dashboard
```
🌐 https://vercel.com/dashboard
🎯 Selecione: Tampa APP (seu projeto)
⚙️ Click: Settings (topo da página)
📝 Click: Environment Variables (menu lateral)
```

### 3.2 Adicionar Variável 1

```
1. Click: "Add New"
2. Key: RESEND_API_KEY
3. Value: re_xxxxxxxxxxxxxxxxxxxxxxxxx
4. Environments:
   ✅ Production
   ✅ Preview
   ✅ Development
5. Click: "Save"
```

### 3.3 Adicionar Variável 2

```
1. Click: "Add New"
2. Key: RESEND_FROM_EMAIL
3. Value: Tampa APP <noreply@seudominio.com>
4. Environments:
   ✅ Production
   ✅ Preview
   ✅ Development
5. Click: "Save"
```

### 3.4 Verificar Variáveis Existentes

**Certifique-se que também tem:**
```
✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_ANON_KEY
```

Se não tiver, adicione:
- Pegar valores em: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/settings/api

---

## 📋 PASSO 4: DEPLOY

```powershell
# 1. Adicionar arquivos
git add .

# 2. Commit
git commit -m "Add Resend email integration"

# 3. Push (Vercel faz deploy automático)
git push

# 4. Aguardar 2-3 minutos
```

---

## 📋 PASSO 5: TESTAR

### 5.1 Teste Local

```powershell
# 1. Rodar app
npm run dev

# 2. Abrir navegador
http://localhost:8080/test-email

# 3. Digite seu email
# 4. Click nos botões de teste
# 5. Verificar inbox (e spam)
```

### 5.2 Teste em Produção

```
1. Acesse: https://seu-app.vercel.app/test-email
2. Digite seu email
3. Click nos botões
4. Verificar inbox
```

---

## ✅ CHECKLIST FINAL

```
RESEND:
[ ] Conta criada
[ ] API Key copiada: re_xxxxx
[ ] Domínio verificado OU usando onboarding@resend.dev
[ ] From Email definido

SUPABASE:
[ ] Script executado OU comandos manuais
[ ] Edge Function deployed
[ ] npx supabase functions list mostra send-email

VERCEL:
[ ] RESEND_API_KEY adicionada
[ ] RESEND_FROM_EMAIL adicionada
[ ] Deploy realizado (git push)
[ ] App funcionando

TESTES:
[ ] http://localhost:8080/test-email funciona
[ ] Emails chegando na caixa de entrada
[ ] Teste em produção funcionando
```

---

## 🆘 PROBLEMAS COMUNS

### ❌ "RESEND_API_KEY not configured"
```
Solução: Re-executar comando de secrets no Supabase
npx supabase secrets set RESEND_API_KEY=sua-key --project-ref imnecvcvhypnlvujajpn
```

### ❌ "Domain not verified"
```
Solução 1: Aguardar propagação DNS (pode levar até 24h)
Solução 2: Usar onboarding@resend.dev temporariamente
```

### ❌ Email não chega
```
1. Verificar SPAM
2. Ver logs no Supabase:
   Dashboard → Functions → send-email → Logs
3. Ver logs no Resend:
   Dashboard → Logs
```

### ❌ "Failed to invoke function"
```
Solução: Re-deploy
npx supabase functions deploy send-email --project-ref imnecvcvhypnlvujajpn
```

---

## 🎯 RESUMO DOS VALORES

**Você precisa dessas 2 chaves:**

```
1. RESEND_API_KEY
   De onde: Resend Dashboard → API Keys
   Formato: re_xxxxxxxxxxxxxxxxxxxxxxxxx
   
2. RESEND_FROM_EMAIL
   De onde: Você escolhe
   Formato: Tampa APP <noreply@seudominio.com>
   
Onde adicionar:
✅ Supabase Secrets (via npx supabase secrets set)
✅ Vercel Environment Variables (via Dashboard)
```

---

## 📞 PRECISA DE AJUDA?

- **Resend Docs:** https://resend.com/docs
- **Resend Dashboard:** https://resend.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn
- **Vercel Dashboard:** https://vercel.com/dashboard

---

**Tempo estimado:** 15-20 minutos  
**Dificuldade:** Fácil 🟢  
**Status:** Pronto para implementar ✅
