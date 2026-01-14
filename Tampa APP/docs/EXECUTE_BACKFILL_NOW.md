# 🚀 SOLUÇÃO DEFINITIVA - Backfill User Roles

## Problema Encontrado

A CLI do Supabase v2.65.6 está com problemas de execução de scripts longos. Os comandos travam ou falham.

## ✅ Solução 100% Confiável

### Execute no SQL Editor do Dashboard (2 minutos):

**1. Abra o SQL Editor:**
```
https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/sql/new
```

**2. Copie TODO o conteúdo do arquivo:**
```
supabase\migrations\20260110_backfill_user_roles_from_profiles.sql
```

**3. Cole no SQL Editor**

**4. Clique em RUN ▶️**

**5. Aguarde a execução (10-30 segundos)**

Você verá mensagens como:
```
NOTICE: ===========================================
NOTICE: BACKFILL USER_ROLES - Starting...
NOTICE: ===========================================
NOTICE: Total profiles: 15
NOTICE: Existing user_roles: 2
NOTICE: Missing user_roles: 13
NOTICE: 
NOTICE: ✓ Disabled all triggers on user_roles
NOTICE: ✓ Re-enabled all triggers on user_roles
NOTICE: 
NOTICE: ===========================================
NOTICE: BACKFILL COMPLETE
NOTICE: ===========================================
NOTICE: ✓ Inserted 13 new user_roles entries
NOTICE: ✓ Total user_roles now: 15
NOTICE: ✓ All profiles now have user_roles entries: YES
```

**6. Verifique os resultados:**

Você verá duas tabelas de resultados:
- **Tabela 1**: Verification (deve mostrar ✓ MATCH)
- **Tabela 2**: Lista de usuários com role 'staff'

## 🔧 Alternativa: Atualizar CLI (Opcional)

Se quiser usar a CLI no futuro:

```powershell
npm install -g supabase@latest
```

Depois:
```powershell
npx supabase db push
```

## ✅ Após Executar

1. **Refresh** no browser (F5)
2. Acesse **People Module**
3. Veja todos os usuários com roles
4. Atualize as roles necessárias via UI

## 📊 Queries de Verificação (Opcional)

Execute no SQL Editor para confirmar:

```sql
-- Ver totais
SELECT 
  (SELECT COUNT(*) FROM profiles) as profiles,
  (SELECT COUNT(*) FROM user_roles) as user_roles;

-- Ver todos os usuários e suas roles
SELECT 
  p.display_name,
  p.email,
  ur.role::text
FROM profiles p
JOIN user_roles ur ON p.user_id = ur.user_id
ORDER BY p.display_name;
```

---

**🎯 Bottom Line:** Use o SQL Editor do Dashboard. É instantâneo, sempre funciona, e você vê os resultados em tempo real!
