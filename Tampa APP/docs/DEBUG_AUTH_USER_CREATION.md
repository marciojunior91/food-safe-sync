# 🔍 GUIA DE DEBUGGING - "Database error creating new user"

## Erro Atual
```
Failed to create auth user: Database error creating new user
```

Isso acontece no **Step 1** do edge function (linha 115-128).

## Possíveis Causas

### 1️⃣ **Email já existe** ⭐ MAIS PROVÁVEL
O email que você está tentando cadastrar já existe em `auth.users`.

**Solução**: 
- Use um email diferente
- OU delete o usuário existente primeiro

### 2️⃣ **Senha muito fraca**
Supabase pode ter requisitos de senha configurados no dashboard.

**Verificar**: Settings → Authentication → Password Requirements

### 3️⃣ **Rate limiting**
Muitas tentativas de criação de usuário em pouco tempo.

**Solução**: Aguarde 1 minuto e tente novamente

### 4️⃣ **Configuração de email**
Se o email provider não está configurado, pode dar erro.

**Verificar**: Settings → Authentication → Email Templates

## 🔧 Como Debugar

### Passo 1: Ver os Logs do Edge Function
1. Vá para: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/functions
2. Clique em `create-user-with-credentials`
3. Vá na aba **Logs**
4. Procure pelo erro completo (vai ter mais detalhes)

### Passo 2: Verificar se o email já existe
Execute no SQL Editor:
\`\`\`sql
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'teste@example.com'; -- Substitua pelo email que você tentou
\`\`\`

### Passo 3: Tentar criar usuário via Dashboard
1. Vá para: Authentication → Users → Add User
2. Tente criar manualmente
3. Se der o mesmo erro, é problema de configuração do Supabase
4. Se funcionar, é problema no nosso código

## ✅ Soluções Rápidas

### Se o email já existe:
\`\`\`sql
-- Ver o usuário
SELECT * FROM auth.users WHERE email = 'teste@example.com';

-- Deletar (CUIDADO!)
DELETE FROM auth.users WHERE email = 'teste@example.com';
\`\`\`

### Se for problema de confirmação de email:
No edge function, já estamos usando `email_confirm: true` (linha 119), então não deveria ser isso.

### Se for rate limiting:
Aguarde 1-2 minutos entre tentativas.

## 🎯 Próximos Passos

1. **Execute** `DIAGNOSTIC_AUTH_USERS.sql` para ver o estado atual
2. **Verifique** os logs do Edge Function no dashboard
3. **Tente** usar um email completamente novo (ex: `novoteste123@example.com`)
4. **Me envie**:
   - O email que você tentou usar
   - Os logs completos do Edge Function
   - Resultado do DIAGNOSTIC_AUTH_USERS.sql

Com essas informações, vou identificar o problema exato! 🔍
