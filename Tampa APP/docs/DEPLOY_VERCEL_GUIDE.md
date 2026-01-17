# Deploy Vercel - Guia Rápido (15 minutos)

**Data**: 2026-01-16  
**Deadline**: 21h  
**Objetivo**: Cliente na Austrália testar impressora ZEBRA

---

## ⚡ Passo a Passo Vercel

### 1️⃣ Preparar Repositório (5 min)

```powershell
# Certifique-se que tudo está commitado
cd "c:\Users\Marci\OneDrive\Área de Trabalho\Tampa APP\Tampa APP"
git status
git add .
git commit -m "feat: recurring tasks timeline + subtasks complete"
git push origin TAMPAAPP_10_11_RECIPES_FUNCIONALITY
```

---

### 2️⃣ Criar Conta Vercel (2 min)

1. **Acesse**: https://vercel.com/signup
2. **Sign up with GitHub** (recomendado)
3. Autorize Vercel no GitHub

---

### 3️⃣ Importar Projeto (3 min)

1. No dashboard Vercel, clique **"Add New..." → Project**
2. **Import Git Repository**
3. Procure: `marciojunior91/food-safe-sync`
4. Clique **"Import"**

---

### 4️⃣ Configurar Build (2 min)

**Configure Project:**
- **Framework Preset**: Vite
- **Root Directory**: `./` (deixe vazio ou raiz)
- **Build Command**: `npm run build` (detecta automaticamente)
- **Output Directory**: `dist` (detecta automaticamente)
- **Install Command**: `npm install`

**Branch to Deploy**: 
- Selecione: `TAMPAAPP_10_11_RECIPES_FUNCIONALITY`

---

### 5️⃣ Configurar Environment Variables (3 min)

**CRÍTICO**: Adicione TODAS as variáveis do seu `.env`:

```
VITE_SUPABASE_URL=https://imnecvcvhypnlvujajpn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=https://seu-app.vercel.app (será gerado)
```

**Como adicionar:**
1. Na página de configuração, role até **"Environment Variables"**
2. Para cada variável:
   - **Key**: Nome da variável (ex: `VITE_SUPABASE_URL`)
   - **Value**: Valor (copie do seu `.env`)
   - **Environment**: Marque **Production, Preview, Development**
3. Clique **"Add"**

**Variáveis obrigatórias:**
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`
- ✅ Qualquer outra que esteja no `.env`

---

### 6️⃣ Deploy! (5 min)

1. Clique **"Deploy"**
2. Aguarde build (~3-5 min)
3. ✅ Deploy concluído!

**URL gerada:**
```
https://food-safe-sync-xyz123.vercel.app
```

---

## 🔧 Configurações Pós-Deploy

### A. Configurar Domínio Customizado (Opcional)

Se tiver domínio próprio:
1. **Project Settings → Domains**
2. Adicionar domínio
3. Configurar DNS (CNAME ou A record)

### B. Configurar Supabase para Aceitar Novo URL

**IMPORTANTE**: Adicione URL do Vercel no Supabase

1. Acesse: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn
2. **Authentication → URL Configuration**
3. **Site URL**: `https://food-safe-sync-xyz123.vercel.app`
4. **Redirect URLs**: Adicione:
   ```
   https://food-safe-sync-xyz123.vercel.app/**
   https://food-safe-sync-xyz123.vercel.app/auth/callback
   ```

### C. Testar Autenticação

1. Abra URL do Vercel
2. Faça login
3. Verifique se redireciona corretamente

---

## 🐛 Troubleshooting

### Build Falhou?

**Erro comum**: ESLint warnings como errors

**Solução**: Adicionar no `vite.config.ts`:
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        warn(warning);
      }
    }
  }
});
```

Ou desabilitar ESLint no build temporariamente.

---

### Variáveis de ambiente não funcionam?

**Problema**: Vercel não lê arquivo `.env`

**Solução**: TODAS as variáveis devem ser adicionadas manualmente no dashboard Vercel.

**Verificar**: 
```bash
# No código, use:
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
```

---

### CORS Error?

**Problema**: Supabase bloqueando requisições

**Solução**: Adicione URL do Vercel nas allowed origins do Supabase:
1. Supabase Dashboard → Settings → API
2. **API Settings → CORS Allowed Origins**
3. Adicionar: `https://food-safe-sync-xyz123.vercel.app`

---

## 🎯 Checklist Final

Antes de enviar para o cliente:

- [ ] ✅ Deploy concluído sem erros
- [ ] ✅ URL acessível publicamente
- [ ] ✅ Login funciona
- [ ] ✅ Supabase conectado
- [ ] ✅ Tarefas recorrentes aparecem corretamente
- [ ] ✅ Subtasks funcionam
- [ ] ✅ Timeline mostra horários corretos
- [ ] ✅ Impressão (testar localmente primeiro)

---

## 📤 Enviar para Cliente

**Mensagem sugerida:**

```
Olá!

O sistema foi atualizado e está disponível em:
https://food-safe-sync-xyz123.vercel.app

Novas funcionalidades implementadas:
✅ Tarefas recorrentes (diárias, semanais, mensais)
✅ Subtarefas em tarefas de rotina
✅ Timeline com horários corretos
✅ Impressão de etiquetas (pronto para teste com ZEBRA)

Credenciais de teste:
Email: [seu email de teste]
Senha: [senha de teste]

Por favor, teste especialmente:
1. Criação de tarefas recorrentes
2. Visualização no timeline
3. Impressão de etiquetas com impressora ZEBRA

Qualquer problema, me avise!

Att,
Marcio
```

---

## 🚀 Deploy Automático (Futuro)

Configuração já está pronta! Agora:
- ✅ Todo `git push` na branch = deploy automático
- ✅ Pull requests = preview deployment
- ✅ Merge to main = production deployment

---

## 📊 Monitoramento

**Vercel Dashboard mostra:**
- Build logs
- Runtime logs
- Analytics (visitas, performance)
- Errors

**Acesse:** https://vercel.com/dashboard

---

## 🌏 Performance Global

Vercel usa **Edge Network**:
- Austrália: Latência ~50-150ms
- Brasil: Latência ~20-50ms
- EUA: Latência ~10-30ms

Cliente na Austrália terá boa experiência!

---

## 💰 Custos

**Plano Hobby (Grátis):**
- ✅ Unlimited deployments
- ✅ Unlimited bandwidth (100GB)
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ✅ Analytics básico

**Se exceder:** Upgrade para Pro ($20/mês)

---

## 📝 Notas Importantes

1. **Branch atual** será deployed: `TAMPAAPP_10_11_RECIPES_FUNCIONALITY`
2. Para mudar para `main`: Faça merge e configure main como production branch
3. **Logs**: Sempre verifique logs de build se algo falhar
4. **Rollback**: Vercel permite rollback para deploy anterior

---

## 🆘 Ajuda

**Se algo der errado:**
1. Verifique logs de build no Vercel
2. Verifique console do navegador (F12)
3. Verifique se env vars estão corretas
4. Teste localmente: `npm run build && npm run preview`

**Suporte:**
- Vercel Docs: https://vercel.com/docs
- Vercel Support: support@vercel.com
- Community: https://github.com/vercel/vercel/discussions

---

**Boa sorte! 🚀**

Deploy estimado: ⏱️ **15 minutos**  
Horário atual: ~18h  
Deadline: 21h  
**Tempo sobrando: 3 horas** ✅
