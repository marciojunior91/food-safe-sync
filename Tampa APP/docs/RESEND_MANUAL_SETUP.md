# 📧 Resend - Tutorial Manual Completo (SEM Scripts)

**Objetivo:** Criar e configurar Edge Function `send-email` manualmente, passo a passo.

---

## 📋 PARTE 1: PREPARAÇÃO - Gerar Chaves no Resend

### Passo 1: Criar Conta no Resend

1. Abra o navegador
2. Acesse: **https://resend.com**
3. Clique em **"Sign Up"** (canto superior direito)
4. Preencha:
   - Email
   - Password
5. Clique em **"Create Account"**
6. Abra seu email e clique no link de confirmação

---

### Passo 2: Gerar API Key

1. Faça login em **https://resend.com/dashboard**
2. No menu lateral esquerdo, clique em **"API Keys"**
3. Clique no botão **"Create API Key"** (canto superior direito)
4. Preencha:
   - **Name:** `Tampa APP Production`
   - **Permission:** Selecione **"Full Access"**
   - **Domain:** (deixe padrão ou selecione seu domínio se já tiver)
5. Clique em **"Create"**
6. **COPIE A CHAVE COMPLETA:**
   ```
   re_123abc456def789ghi012jkl345mno678pqr901stu234
   ```
   ⚠️ **IMPORTANTE:** Ela só aparece UMA VEZ! Salve em local seguro.

**💾 Cole em um arquivo de texto temporário:**
```txt
RESEND_API_KEY=re_123abc456def789ghi012jkl345mno678pqr901stu234
```

---

### Passo 3: Configurar Email de Remetente

Você tem 2 opções:

#### **OPÇÃO A: Com Domínio Próprio** (Recomendado para produção)

**3.1. Adicionar Domínio:**

1. Dashboard → **"Domains"** (menu lateral)
2. Clique em **"Add Domain"**
3. Digite seu domínio: `seudominio.com` (sem www)
4. Clique em **"Add"**

**3.2. Configurar DNS Records:**

O Resend vai mostrar 2 records para adicionar no seu registrador de domínio:

```
📋 SPF Record
Tipo: TXT
Nome: @ (ou deixe vazio)
Valor: v=spf1 include:resend.com ~all
TTL: 3600

📋 DKIM Record
Tipo: TXT
Nome: resend._domainkey
Valor: [valor longo que o Resend mostra]
TTL: 3600
```

**3.3. Adicionar DNS no Registrador:**

**Se usar GoDaddy:**
1. Login em godaddy.com
2. My Products → Domains → seu domínio → DNS
3. Clique em "Add" → "TXT"
4. Cole os valores do Resend
5. Salvar

**Se usar Namecheap:**
1. Login em namecheap.com
2. Domain List → Manage → Advanced DNS
3. Add New Record → TXT Record
4. Cole os valores do Resend
5. Save All Changes

**Se usar Registro.br:**
1. Login em registro.br
2. Meus Domínios → seu domínio → DNS
3. Adicionar Entrada → TXT
4. Cole os valores
5. Salvar

**Se usar Cloudflare:**
1. Login em cloudflare.com
2. Selecione seu domínio
3. DNS → Add Record → TXT
4. Cole os valores do Resend
5. Save

**3.4. Verificar Domínio:**

1. Aguarde 5-30 minutos (propagação DNS)
2. Volte no Resend Dashboard → Domains
3. Clique em **"Verify"** ao lado do seu domínio
4. Status deve mudar para **"Verified"** ✅

**💾 Seu email FROM será:**
```txt
RESEND_FROM_EMAIL=Tampa APP <noreply@seudominio.com>
```

---

#### **OPÇÃO B: Sem Domínio** (Para testes iniciais)

1. Dashboard → **"Settings"** → **"Authorized Recipients"**
2. Clique em **"Add Recipient"**
3. Digite seu email pessoal
4. Clique em **"Add"**
5. Abra seu email e confirme
6. Repita para adicionar outros emails da equipe

**💾 Seu email FROM será:**
```txt
RESEND_FROM_EMAIL=Tampa APP <onboarding@resend.dev>
```

⚠️ **Limitação:** Só pode enviar para emails autorizados.

---

## 📋 PARTE 2: SUPABASE - Criar Edge Function

### Passo 4: Login no Supabase CLI

1. Abra **PowerShell**
2. Navegue até a pasta do projeto:
   ```powershell
   cd "C:\Users\Marci\OneDrive\Área de Trabalho\Tampa APP\Tampa APP"
   ```

3. Faça login no Supabase:
   ```powershell
   npx supabase login
   ```

4. **O navegador vai abrir automaticamente**
5. Clique em **"Authorize"** para autorizar o CLI
6. Volte no PowerShell, deve aparecer:
   ```
   ✔ Logged in successfully!
   ```

---

### Passo 5: Verificar Arquivos da Edge Function

Os arquivos já foram criados anteriormente. Vamos confirmar:

1. Verifique se existe o arquivo:
   ```powershell
   cat supabase\functions\send-email\index.ts
   ```

2. Se mostrar o conteúdo (código TypeScript), está OK! ✅

3. Se der erro "não encontrado", o arquivo precisa ser criado. Avise que vou criar.

---

### Passo 6: Configurar Secrets no Supabase

**6.1. Configurar RESEND_API_KEY:**

```powershell
npx supabase secrets set RESEND_API_KEY=re_123abc456def789ghi012jkl345mno678pqr901stu234 --project-ref imnecvcvhypnlvujajpn
```

⚠️ **IMPORTANTE:** 
- Substitua `re_123abc...` pela SUA chave real do Resend
- Não adicione espaços
- Não adicione aspas

**Exemplo real:**
```powershell
npx supabase secrets set RESEND_API_KEY=re_AbCdEf123456 --project-ref imnecvcvhypnlvujajpn
```

**Deve aparecer:**
```
✔ Finished supabase secrets set.
```

---

**6.2. Configurar RESEND_FROM_EMAIL:**

**Com domínio próprio:**
```powershell
npx supabase secrets set RESEND_FROM_EMAIL="Tampa APP <noreply@seudominio.com>" --project-ref imnecvcvhypnlvujajpn
```

**Sem domínio (teste):**
```powershell
npx supabase secrets set RESEND_FROM_EMAIL="Tampa APP <onboarding@resend.dev>" --project-ref imnecvcvhypnlvujajpn
```

⚠️ **IMPORTANTE:**
- Substitua `seudominio.com` pelo SEU domínio real
- Mantenha as aspas duplas `"` porque tem espaço no valor
- Use o formato: `Nome <email@dominio.com>`

**Deve aparecer:**
```
✔ Finished supabase secrets set.
```

---

**6.3. Verificar Secrets (Opcional):**

```powershell
npx supabase secrets list --project-ref imnecvcvhypnlvujajpn
```

**Deve mostrar:**
```
RESEND_API_KEY
RESEND_FROM_EMAIL
```

---

### Passo 7: Deploy da Edge Function

1. Execute o comando de deploy:
   ```powershell
   npx supabase functions deploy send-email --project-ref imnecvcvhypnlvujajpn
   ```

2. **Aguarde o processo** (10-30 segundos)

3. **Deve aparecer:**
   ```
   Deploying Function send-email (project ref: imnecvcvhypnlvujajpn)
   
   ✔ Function send-email deployed successfully!
   
   URL: https://imnecvcvhypnlvujajpn.supabase.co/functions/v1/send-email
   ```

✅ **Sucesso!** A Edge Function está no ar!

---

### Passo 8: Verificar Deployment

```powershell
npx supabase functions list --project-ref imnecvcvhypnlvujajpn
```

**Deve mostrar:**
```
NAME                          URL
send-email                    https://imnecvcvhypnlvujajpn.supabase.co/functions/v1/send-email
create-user-with-credentials  https://...
invite-user                   https://...
stripe-create-checkout        https://...
stripe-customer-portal        https://...
stripe-webhook                https://...
```

✅ Se `send-email` aparecer na lista, está funcionando!

---

## 📋 PARTE 3: VERCEL - Adicionar Environment Variables

### Passo 9: Acessar Dashboard do Vercel

1. Abra o navegador
2. Acesse: **https://vercel.com/dashboard**
3. Faça login (se necessário)
4. Localize e clique no projeto: **Tampa APP**
5. Clique na aba **"Settings"** (topo da página)
6. No menu lateral, clique em **"Environment Variables"**

---

### Passo 10: Adicionar RESEND_API_KEY

1. Clique no botão **"Add New"** (ou "Add Variable")
2. Preencha:
   - **Key (Name):** `RESEND_API_KEY`
   - **Value:** `re_123abc456def789ghi012jkl345mno678pqr901stu234`
     - ⚠️ Cole sua chave REAL do Resend
     - Não adicione aspas
   - **Environments:** Marque todas as 3 opções:
     - ✅ **Production**
     - ✅ **Preview**
     - ✅ **Development**
3. Clique em **"Save"**

✅ Variável adicionada!

---

### Passo 11: Adicionar RESEND_FROM_EMAIL

1. Clique novamente em **"Add New"**
2. Preencha:
   - **Key (Name):** `RESEND_FROM_EMAIL`
   - **Value:** `Tampa APP <noreply@seudominio.com>`
     - ⚠️ Use SEU domínio real
     - OU use: `Tampa APP <onboarding@resend.dev>` (se sem domínio)
   - **Environments:** Marque todas:
     - ✅ **Production**
     - ✅ **Preview**
     - ✅ **Development**
3. Clique em **"Save"**

✅ Variável adicionada!

---

### Passo 12: Verificar Variáveis Existentes

Na página de Environment Variables, verifique se você tem:

```
✅ RESEND_API_KEY                 (acabou de adicionar)
✅ RESEND_FROM_EMAIL              (acabou de adicionar)
✅ VITE_SUPABASE_URL              (já deve existir)
✅ VITE_SUPABASE_ANON_KEY         (já deve existir)
```

Se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` não existirem:

**Pegar valores:**
1. Acesse: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/settings/api
2. Copie:
   - **URL:** `https://imnecvcvhypnlvujajpn.supabase.co`
   - **anon public:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Adicionar no Vercel:**
1. Add New → Key: `VITE_SUPABASE_URL` → Value: (cole URL)
2. Add New → Key: `VITE_SUPABASE_ANON_KEY` → Value: (cole anon key)
3. Marcar todos os Environments
4. Save

---

## 📋 PARTE 4: DEPLOY NO VERCEL

### Passo 13: Commit e Push

1. Volte no **PowerShell**
2. Execute os comandos:

```powershell
# Adicionar todos os arquivos
git add .

# Criar commit
git commit -m "Add Resend email integration with Edge Function"

# Push para GitHub (Vercel vai fazer deploy automático)
git push
```

3. **Aguarde o processo** (pode pedir senha do GitHub)

4. **Deve aparecer:**
   ```
   Enumerating objects: X, done.
   Writing objects: 100% (X/X), done.
   Total X (delta X), reused 0 (delta 0)
   To https://github.com/marciojunior91/food-safe-sync.git
      abc1234..def5678  main -> main
   ```

✅ Push realizado!

---

### Passo 14: Verificar Deploy no Vercel

1. Volte no navegador: **https://vercel.com/dashboard**
2. Clique no projeto **Tampa APP**
3. Você verá a aba **"Deployments"**
4. O deploy mais recente deve estar:
   - Status: **"Building..."** ou **"Deploying..."**
   - Aguarde 2-3 minutos
   - Status deve mudar para: **"Ready"** ✅

5. Clique no deployment para ver detalhes
6. Clique em **"Visit"** para abrir o site

---

## 📋 PARTE 5: TESTAR EMAILS

### Passo 15: Teste Local (Desenvolvimento)

1. No **PowerShell**, execute:
   ```powershell
   npm run dev
   ```

2. Aguarde aparecer:
   ```
   VITE ready in X ms
   ➜  Local:   http://localhost:8080/
   ```

3. Abra o navegador em: **http://localhost:8080/test-email**

4. Na página:
   - Digite seu email no campo de texto
   - Clique em **"🧪 Teste Simples"**
   - Aguarde a mensagem de sucesso

5. **Abra seu email** e verifique se chegou!
   - ⚠️ Se não estiver na caixa de entrada, **verifique SPAM**

---

### Passo 16: Testar Todos os Templates

Na mesma página (`/test-email`), teste cada botão:

1. **👋 Welcome Email** - Email de boas-vindas
2. **⚠️ Alerta de Vencimento** - Notificação de items expirando
3. **📋 Notificação de Tarefa** - Email de tarefa atribuída
4. **📜 Lembrete de Certificado** - Alerta de certificado vencendo

Cada um deve chegar no seu email em segundos.

---

### Passo 17: Teste em Produção

1. Acesse seu app em produção:
   ```
   https://seu-dominio.vercel.app/test-email
   ```

2. Digite seu email
3. Teste os botões
4. Verifique recebimento

✅ Se funcionar, está 100% configurado!

---

## 🔍 VERIFICAÇÃO DE LOGS

### Ver Logs no Supabase (Se der erro)

1. Acesse: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/functions
2. Clique em **"send-email"**
3. Clique na aba **"Logs"**
4. Você verá todos os requests e erros

**Logs de sucesso mostram:**
```
📧 Sending email: { to: [...], subject: "...", from: "..." }
✅ Email sent successfully: { id: "..." }
```

**Logs de erro mostram:**
```
❌ Email send error: [mensagem de erro]
```

---

### Ver Logs no Resend (Para debug avançado)

1. Acesse: https://resend.com/dashboard
2. Clique em **"Logs"** (menu lateral)
3. Você verá todos os emails enviados:
   - ✅ **Delivered** - Email entregue
   - ⏳ **Queued** - Na fila
   - ❌ **Failed** - Falhou (clique para ver motivo)

---

## ✅ CHECKLIST COMPLETO

```
RESEND:
[ ] Conta criada
[ ] API Key gerada e copiada
[ ] Domínio adicionado (se tiver)
[ ] DNS configurado e verificado (se tiver domínio)
[ ] OU Authorized Recipients adicionados (se sem domínio)
[ ] From Email definido

SUPABASE:
[ ] Login realizado: npx supabase login
[ ] Secret RESEND_API_KEY configurado
[ ] Secret RESEND_FROM_EMAIL configurado
[ ] Edge Function deployed com sucesso
[ ] Verificado: npx supabase functions list

VERCEL:
[ ] Environment Variable RESEND_API_KEY adicionada
[ ] Environment Variable RESEND_FROM_EMAIL adicionada
[ ] VITE_SUPABASE_URL existe
[ ] VITE_SUPABASE_ANON_KEY existe
[ ] Todas variáveis em Production, Preview e Development

GIT/DEPLOY:
[ ] git add .
[ ] git commit -m "..."
[ ] git push
[ ] Deploy no Vercel concluído (Status: Ready)

TESTES:
[ ] http://localhost:8080/test-email funciona
[ ] Email de teste recebido (verificar inbox e spam)
[ ] Todos os 5 templates testados
[ ] Teste em produção funcionando
[ ] Logs no Supabase sem erros
[ ] Logs no Resend mostram "Delivered"
```

---

## 🆘 TROUBLESHOOTING

### ❌ Erro: "RESEND_API_KEY not configured"

**Causa:** Secret não foi configurado no Supabase

**Solução:**
```powershell
npx supabase secrets set RESEND_API_KEY=re_SuaKeyReal --project-ref imnecvcvhypnlvujajpn
```

Depois re-deploy:
```powershell
npx supabase functions deploy send-email --project-ref imnecvcvhypnlvujajpn
```

---

### ❌ Erro: "Domain not verified"

**Causa:** DNS records ainda não propagaram

**Soluções:**

1. **Aguardar:** Propagação pode levar até 24 horas
2. **Verificar DNS:** Use https://dnschecker.org
   - Digite: `resend._domainkey.seudominio.com`
   - Deve mostrar o valor DKIM
3. **Usar temporariamente:** `onboarding@resend.dev`
   - Adicione seu email como Authorized Recipient no Resend

---

### ❌ Email não chega

**Soluções:**

1. **Verificar SPAM/Lixo Eletrônico**
2. **Ver logs no Supabase:**
   - Dashboard → Functions → send-email → Logs
   - Procurar por erros vermelhos
3. **Ver logs no Resend:**
   - Dashboard → Logs → Recent Emails
   - Status deve ser "Delivered"
4. **Verificar recipient:**
   - Se usar `onboarding@resend.dev`, recipient deve estar autorizado

---

### ❌ Erro: "Failed to invoke function"

**Causa:** Edge Function não está deployed ou tem erro

**Soluções:**

1. **Verificar se está deployed:**
   ```powershell
   npx supabase functions list --project-ref imnecvcvhypnlvujajpn
   ```

2. **Ver logs de deploy:**
   - Dashboard → Functions → send-email → Build Logs

3. **Re-deploy:**
   ```powershell
   npx supabase functions deploy send-email --project-ref imnecvcvhypnlvujajpn
   ```

---

### ❌ Erro 500 no teste local

**Causa:** Variáveis não configuradas localmente

**Solução:** As variáveis são configuradas no Supabase (secrets), não localmente. Certifique-se que:
1. Secrets estão configurados no Supabase
2. Edge Function foi deployed após configurar secrets

---

## 📊 RESUMO DE COMANDOS

```powershell
# Login no Supabase (primeira vez apenas)
npx supabase login

# Configurar secrets
npx supabase secrets set RESEND_API_KEY=re_SuaKey --project-ref imnecvcvhypnlvujajpn
npx supabase secrets set RESEND_FROM_EMAIL="Tampa APP <email@dominio.com>" --project-ref imnecvcvhypnlvujajpn

# Deploy Edge Function
npx supabase functions deploy send-email --project-ref imnecvcvhypnlvujajpn

# Verificar deploy
npx supabase functions list --project-ref imnecvcvhypnlvujajpn

# Verificar secrets
npx supabase secrets list --project-ref imnecvcvhypnlvujajpn

# Git
git add .
git commit -m "Add Resend email integration"
git push

# Testar localmente
npm run dev
# Acessar: http://localhost:8080/test-email
```

---

## 🎯 VALORES QUE VOCÊ VAI USAR

```
PROJECT REF (Supabase):
imnecvcvhypnlvujajpn

EDGE FUNCTION URL:
https://imnecvcvhypnlvujajpn.supabase.co/functions/v1/send-email

RESEND_API_KEY:
re_[sua_chave_aqui] (copiar do Resend Dashboard)

RESEND_FROM_EMAIL (Com domínio):
Tampa APP <noreply@seudominio.com>

RESEND_FROM_EMAIL (Sem domínio):
Tampa APP <onboarding@resend.dev>
```

---

## 📚 LINKS ÚTEIS

- **Resend Dashboard:** https://resend.com/dashboard
- **Resend API Keys:** https://resend.com/api-keys
- **Resend Domains:** https://resend.com/domains
- **Resend Logs:** https://resend.com/logs
- **Supabase Functions:** https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/functions
- **Supabase API Settings:** https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/settings/api
- **Vercel Dashboard:** https://vercel.com/dashboard
- **DNS Checker:** https://dnschecker.org

---

**Tutorial completo!** 🎉  
**Tempo estimado:** 20-30 minutos  
**Dificuldade:** Média 🟡  
**Última atualização:** 4 de Fevereiro de 2026
