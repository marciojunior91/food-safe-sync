# 📧 Guia Completo: Resend + Vercel - Passo a Passo

**Data:** 4 de Fevereiro de 2026  
**Objetivo:** Configurar envio de emails via Resend integrado com Vercel

---

## 📋 PARTE 1: Criar Conta e Gerar API Key no Resend

### Passo 1: Criar Conta no Resend

1. **Acesse:** https://resend.com
2. **Clique em:** "Sign Up" ou "Get Started"
3. **Preencha:**
   - Email
   - Password
   - Nome da empresa (Tampa APP)
4. **Confirme email** que receberá

---

### Passo 2: Adicionar e Verificar Domínio (IMPORTANTE)

⚠️ **Sem domínio verificado, só pode enviar para seu próprio email!**

#### Opção A: Usar Domínio Próprio (Recomendado)

1. **No Dashboard Resend:**
   - Clique em **"Domains"** no menu lateral
   - Clique em **"Add Domain"**
   - Digite seu domínio: `seudominio.com`

2. **Configurar DNS Records:**
   
   Resend vai mostrar 3 records DNS para adicionar no seu registrador de domínio:

   **SPF Record:**
   ```
   Tipo: TXT
   Name: @
   Value: v=spf1 include:resend.com ~all
   ```

   **DKIM Record (exemplo):**
   ```
   Tipo: TXT
   Name: resend._domainkey
   Value: [valor longo fornecido pelo Resend]
   ```

   **MX Record (opcional, para receber emails):**
   ```
   Tipo: MX
   Name: @
   Value: feedback-smtp.resend.com
   Priority: 10
   ```

3. **Adicionar Records no seu Registrador:**
   - **GoDaddy:** DNS → Manage → Add Record
   - **Namecheap:** Advanced DNS → Add New Record
   - **Cloudflare:** DNS → Add Record
   - **Registro.br:** DNS → Adicionar Entrada

4. **Verificar no Resend:**
   - Aguarde 5-10 minutos (propagação DNS)
   - Clique em **"Verify Domain"**
   - Status deve mudar para "Verified" ✅

#### Opção B: Usar Domínio de Teste (Apenas Desenvolvimento)

Se não tiver domínio próprio ainda:

1. Resend permite enviar emails de teste usando:
   - **From:** `onboarding@resend.dev`
   - **Limitação:** Só recebe quem está cadastrado como "Authorized recipient"

2. **Adicionar Authorized Recipients:**
   - Dashboard → Settings → Authorized Recipients
   - Adicione emails que vão receber (seu email, emails da equipe)

---

### Passo 3: Gerar API Key

1. **No Dashboard Resend:**
   - Menu lateral → **"API Keys"**
   - Clique em **"Create API Key"**

2. **Configurar API Key:**
   - **Name:** `Tampa APP Production` (ou `Tampa APP Dev`)
   - **Permission:** 
     - ✅ **Full Access** (recomendado para produção)
     - ou **Send Access** (se quiser apenas enviar emails)
   - **Domain:** Selecione seu domínio verificado

3. **Copiar e Guardar a Key:**
   ```
   re_123abc456def789ghi012jkl345mno678
   ```
   ⚠️ **IMPORTANTE:** A key só aparece UMA VEZ! Salve em local seguro!

4. **Salvar Key Temporariamente:**
   - Abra Notepad/Bloco de Notas
   - Cole a key
   - Salve como: `resend-api-key.txt`

---

## 📋 PARTE 2: Configurar Email de Remetente

### Passo 4: Definir Email "From"

**Com Domínio Verificado:**
```
noreply@seudominio.com
contato@seudominio.com
tampa-app@seudominio.com
```

**Sem Domínio (Teste):**
```
onboarding@resend.dev
```

**Formato Completo:**
```
Tampa APP <noreply@seudominio.com>
```

---

## 📋 PARTE 3: Criar Edge Function no Supabase

### Passo 5: Criar Função de Email

1. **Criar arquivo:** `supabase/functions/send-email/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  try {
    // Parse request body
    const { to, subject, html, from } = await req.json()
    
    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: to, subject, html' 
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Send email via Resend
    const data = await resend.emails.send({
      from: from || Deno.env.get('RESEND_FROM_EMAIL') || 'Tampa APP <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })
    
    console.log('✅ Email sent successfully:', data)
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Email send error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send email' 
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
```

---

### Passo 6: Deploy Edge Function

**No Terminal PowerShell:**

```powershell
# 1. Login no Supabase (se ainda não fez)
npx supabase login

# 2. Link com seu projeto
npx supabase link --project-ref SEU-PROJECT-REF

# 3. Configurar secrets (variáveis de ambiente)
npx supabase secrets set RESEND_API_KEY=re_SuaChaveAqui
npx supabase secrets set RESEND_FROM_EMAIL=noreply@seudominio.com

# 4. Deploy da função
npx supabase functions deploy send-email

# 5. Verificar deploy
npx supabase functions list
```

**Como encontrar PROJECT-REF:**
- Supabase Dashboard → Settings → General → Reference ID

---

## 📋 PARTE 4: Conectar com Vercel

### Passo 7: Adicionar Environment Variables no Vercel

1. **Acesse:** https://vercel.com/dashboard

2. **Selecione seu projeto** (Tampa APP)

3. **Settings → Environment Variables**

4. **Adicionar as seguintes variáveis:**

#### Variável 1: RESEND_API_KEY
```
Key: RESEND_API_KEY
Value: re_123abc456def789ghi012jkl345mno678
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variável 2: RESEND_FROM_EMAIL
```
Key: RESEND_FROM_EMAIL
Value: Tampa APP <noreply@seudominio.com>
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variável 3: VITE_SUPABASE_URL (se ainda não tiver)
```
Key: VITE_SUPABASE_URL
Value: https://seu-projeto.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variável 4: VITE_SUPABASE_ANON_KEY (se ainda não tiver)
```
Key: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environments: ✅ Production ✅ Preview ✅ Development
```

5. **Salvar** cada variável

---

### Passo 8: Atualizar .env.local Local

**Arquivo:** `.env.local`

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend
RESEND_API_KEY=re_123abc456def789ghi012jkl345mno678
RESEND_FROM_EMAIL=Tampa APP <noreply@seudominio.com>

# App
VITE_APP_NAME=Tampa APP
VITE_APP_URL=http://localhost:8080
```

---

## 📋 PARTE 5: Criar Serviço de Email na Aplicação

### Passo 9: Criar Email Service

**Arquivo:** `src/lib/email/emailService.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send email via Supabase Edge Function + Resend
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: options,
    });

    if (error) throw error;
    
    console.log('✅ Email sent successfully:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Failed to send email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  userEmail: string, 
  userName: string
) {
  return sendEmail({
    to: userEmail,
    subject: '🎉 Welcome to Tampa APP!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ea580c;">Welcome ${userName}!</h1>
        <p>Thanks for joining Tampa APP. We're excited to have you on board.</p>
        <p>Get started by completing your profile and exploring the dashboard.</p>
        <a href="${import.meta.env.VITE_APP_URL}" 
           style="background: #ea580c; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Go to Dashboard
        </a>
      </div>
    `,
  });
}

/**
 * Send expiring items alert
 */
export async function sendExpiringItemsAlert(
  userEmail: string,
  userName: string,
  items: Array<{ name: string; daysUntilExpiry: number }>
) {
  const itemsList = items
    .map(item => `
      <li style="margin: 8px 0;">
        <strong>${item.name}</strong> - 
        <span style="color: ${item.daysUntilExpiry <= 1 ? '#dc2626' : '#ea580c'};">
          ${item.daysUntilExpiry} day${item.daysUntilExpiry !== 1 ? 's' : ''} left
        </span>
      </li>
    `)
    .join('');

  return sendEmail({
    to: userEmail,
    subject: '⚠️ Items Expiring Soon - Tampa APP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">⚠️ Items Expiring Soon</h1>
        <p>Hello ${userName},</p>
        <p>You have ${items.length} item${items.length !== 1 ? 's' : ''} expiring soon:</p>
        <ul style="list-style: none; padding: 0;">
          ${itemsList}
        </ul>
        <p>Please check your inventory and take action.</p>
        <a href="${import.meta.env.VITE_APP_URL}/expiring-soon" 
           style="background: #ea580c; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          View Expiring Items
        </a>
      </div>
    `,
  });
}

/**
 * Send task assignment notification
 */
export async function sendTaskAssignmentEmail(
  userEmail: string,
  userName: string,
  taskTitle: string,
  taskDueDate: string
) {
  return sendEmail({
    to: userEmail,
    subject: `📋 New Task Assigned: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ea580c;">📋 New Task Assigned</h1>
        <p>Hello ${userName},</p>
        <p>You have been assigned a new task:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h2 style="margin: 0 0 8px 0;">${taskTitle}</h2>
          <p style="margin: 0; color: #6b7280;">Due: ${taskDueDate}</p>
        </div>
        <a href="${import.meta.env.VITE_APP_URL}/routine-tasks" 
           style="background: #ea580c; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          View Task
        </a>
      </div>
    `,
  });
}
```

---

## 📋 PARTE 6: Testar Envio de Email

### Passo 10: Criar Página de Teste

**Arquivo:** `src/pages/TestEmail.tsx`

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sendEmail, sendWelcomeEmail, sendExpiringItemsAlert } from '@/lib/email/emailService';
import { toast } from 'sonner';

export default function TestEmail() {
  const [to, setTo] = useState('');
  const [sending, setSending] = useState(false);

  const handleTestSimple = async () => {
    if (!to) {
      toast.error('Enter an email address');
      return;
    }

    setSending(true);
    const result = await sendEmail({
      to,
      subject: 'Test Email from Tampa APP',
      html: '<h1>Hello!</h1><p>This is a test email from Tampa APP.</p>',
    });

    if (result.success) {
      toast.success('Email sent successfully! Check inbox.');
    } else {
      toast.error('Failed to send email: ' + result.error);
    }
    setSending(false);
  };

  const handleTestWelcome = async () => {
    if (!to) {
      toast.error('Enter an email address');
      return;
    }

    setSending(true);
    const result = await sendWelcomeEmail(to, 'Test User');

    if (result.success) {
      toast.success('Welcome email sent!');
    } else {
      toast.error('Failed: ' + result.error);
    }
    setSending(false);
  };

  const handleTestExpiring = async () => {
    if (!to) {
      toast.error('Enter an email address');
      return;
    }

    setSending(true);
    const result = await sendExpiringItemsAlert(to, 'Test User', [
      { name: 'Tomato Sauce', daysUntilExpiry: 1 },
      { name: 'Cheese', daysUntilExpiry: 3 },
      { name: 'Milk', daysUntilExpiry: 2 },
    ]);

    if (result.success) {
      toast.success('Expiring items alert sent!');
    } else {
      toast.error('Failed: ' + result.error);
    }
    setSending(false);
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>📧 Test Email Sending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mb-4"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button 
              onClick={handleTestSimple} 
              disabled={sending || !to}
              variant="outline"
            >
              Simple Test
            </Button>

            <Button 
              onClick={handleTestWelcome} 
              disabled={sending || !to}
              variant="outline"
            >
              Welcome Email
            </Button>

            <Button 
              onClick={handleTestExpiring} 
              disabled={sending || !to}
              variant="outline"
            >
              Expiring Alert
            </Button>
          </div>

          {sending && (
            <p className="text-sm text-muted-foreground text-center">
              Sending email...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Adicionar rota (se necessário):** `src/App.tsx` ou router config

---

### Passo 11: Testar Localmente

```powershell
# 1. Verificar se .env.local tem as keys do Resend
cat .env.local

# 2. Rodar aplicação
npm run dev

# 3. Acessar página de teste
# http://localhost:8080/test-email

# 4. Inserir seu email
# 5. Clicar em "Simple Test"
# 6. Verificar email na caixa de entrada
```

---

## 📋 PARTE 7: Deploy no Vercel

### Passo 12: Deploy Completo

```powershell
# 1. Commit das mudanças
git add .
git commit -m "Add Resend email integration"
git push

# 2. Vercel vai fazer deploy automático
# Aguardar 2-3 minutos

# 3. Verificar logs no Vercel Dashboard
# Deployments → Latest → Function Logs
```

---

### Passo 13: Testar em Produção

1. **Acessar:** `https://seu-app.vercel.app/test-email`
2. **Inserir email**
3. **Clicar em botão de teste**
4. **Verificar recebimento**

---

## ✅ Checklist Final

### Resend:
- [x] Conta criada
- [x] Domínio adicionado e verificado (ou usando teste)
- [x] DNS records configurados (SPF, DKIM)
- [x] API Key gerada e salva
- [x] Email "From" definido

### Supabase:
- [x] Edge Function criada (`send-email`)
- [x] Secrets configurados (RESEND_API_KEY, RESEND_FROM_EMAIL)
- [x] Função deployed

### Vercel:
- [x] Environment variables adicionadas
- [x] Deploy realizado
- [x] Variáveis aplicadas em Production/Preview/Development

### Aplicação:
- [x] Email service criado (`src/lib/email/emailService.ts`)
- [x] Funções de email implementadas
- [x] Página de teste criada (opcional)
- [x] Testes realizados localmente
- [x] Testes realizados em produção

---

## 🔧 Troubleshooting

### Erro: "API Key inválida"
**Solução:** Verificar se copiou a key completa e se está nas environment variables

### Erro: "Domain not verified"
**Solução:** Aguardar propagação DNS (até 24h), verificar records no registrador

### Erro: "Unauthorized recipient"
**Solução:** Se usando domínio de teste, adicionar recipient em Resend → Settings

### Email não chega
**Solução:** 
1. Verificar spam/lixo eletrônico
2. Checar logs no Supabase Edge Function
3. Verificar logs no Resend Dashboard

### Email chega mas sem formatação
**Solução:** Verificar HTML está correto, testar em diferentes clientes de email

---

## 📚 Recursos Úteis

- **Resend Dashboard:** https://resend.com/dashboard
- **Resend Docs:** https://resend.com/docs
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Vercel Env Vars:** https://vercel.com/docs/environment-variables

---

## 🎯 Próximos Passos

Após configurar Resend:

1. Implementar automações de email:
   - Welcome email ao criar usuário
   - Alert de items expirando
   - Notificação de tarefas atribuídas
   - Relatórios semanais

2. Criar templates HTML profissionais

3. Configurar webhooks para tracking (opens, clicks)

4. Implementar rate limiting

---

**Última Atualização:** 4 de Fevereiro de 2026  
**Status:** Pronto para implementação
