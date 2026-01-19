# 🔍 Debug: Feed Posts 403 Error

## Status
❌ Posts ainda retornando 403 Forbidden

## Possíveis Causas

### 1. Migration RLS não foi aplicada
**Verificar**: A migration SQL foi executada no Supabase?

**Como verificar**:
1. Abra Supabase SQL Editor
2. Execute: `docs/VERIFY_FEED_RLS.sql`
3. Verifique se as novas policies existem

**Políticas esperadas**:
- ✅ "Users can create posts as team members in their org"
- ✅ "Users can update posts from their org team members"
- ✅ "Users can delete posts from their org team members"

Se não aparecerem = Migration não foi aplicada!

---

### 2. Problema com user_roles

A nova policy depende de `user_roles`:

```sql
author_id IN (
  SELECT tm.id FROM team_members tm
  INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
  WHERE ur.user_id = auth.uid()  -- ← Precisa encontrar o user aqui
)
```

**Verificar**: Você tem um registro em `user_roles` linkando seu auth user à organização?

**Query para verificar**:
```sql
SELECT * FROM user_roles WHERE user_id = auth.uid();
```

**Resultado esperado**: Pelo menos 1 linha com seu `organization_id`

---

### 3. Team Member não está na organização

**Verificar**: O `selectedUser.id` está na mesma organização do `context.organization_id`?

---

## 🔧 AÇÕES IMEDIATAS

### Passo 1: Verificar se migration foi aplicada

**Comando**:
```powershell
# No terminal
npx supabase db pull
```

Isso vai puxar o schema atual. Se a migration não foi aplicada, as policies antigas ainda estarão lá.

### Passo 2: Aplicar migration manualmente

Se a migration não foi aplicada:

1. Abra: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/editor/sql
2. Copie TODO o conteúdo de: `supabase/migrations/20260118000001_fix_feed_posts_rls.sql`
3. Cole no SQL Editor
4. Click **RUN**
5. Deve ver: "Success. No rows returned"

### Passo 3: Verificar policies

Execute o script de verificação:
```sql
-- Ver todas as policies do feed
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE 'feed_%' 
ORDER BY tablename, policyname;
```

### Passo 4: Verificar user_roles

```sql
-- Ver seus user_roles
SELECT 
  ur.*,
  o.name as org_name
FROM user_roles ur
LEFT JOIN organizations o ON o.id = ur.organization_id
WHERE ur.user_id = auth.uid();
```

**Se retornar vazio** = Problema aqui! Você precisa ter um registro em user_roles.

---

## 🎯 SOLUÇÃO RÁPIDA

Se user_roles estiver vazio, precisa criar:

```sql
-- Substitua pelos seus IDs reais
INSERT INTO user_roles (
  user_id,
  organization_id,
  role
) VALUES (
  auth.uid(),
  'YOUR_ORG_ID_HERE',
  'admin'
);
```

Para encontrar seu org_id:
```sql
SELECT id, name FROM organizations LIMIT 10;
```

---

## 📋 CHECKLIST DE DEBUG

Execute cada query e anote os resultados:

- [ ] Policies do feed existem? (deve ter as novas policies)
- [ ] RLS está habilitado em todas as tabelas feed_*?
- [ ] Você tem user_roles? (SELECT * FROM user_roles WHERE user_id = auth.uid())
- [ ] Team member existe? (SELECT * FROM team_members WHERE id = 'SELECTED_USER_ID')
- [ ] Team member está na mesma org? (Compare organization_id)
- [ ] Auth user é o esperado? (SELECT auth.uid())

---

## 🚨 SE NADA FUNCIONAR

Última opção: Criar policy mais permissiva temporariamente:

```sql
-- TEMPORÁRIO - Para debug apenas
DROP POLICY IF EXISTS "TEMP allow all inserts" ON feed_posts;

CREATE POLICY "TEMP allow all inserts"
  ON feed_posts FOR INSERT
  WITH CHECK (true); -- Permite tudo (INSEGURO!)

-- LEMBRAR DE REMOVER DEPOIS!
```

Isso vai permitir posts, e você pode investigar o problema real depois.

---

**PRÓXIMO PASSO**: Execute o script de verificação e me mostre os resultados!
