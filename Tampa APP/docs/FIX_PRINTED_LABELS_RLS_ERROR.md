# 🔧 FIX: Printed Labels RLS Policy Error

## 📋 Problema Reportado

Cliente recebendo erro ao tentar imprimir via Zebra printer:

```
Error saving label to database: {
  code: "42501",
  message: "new row violates row-level security policy for table 'printed_labels'"
}
```

## 🔍 Causa Raiz

A policy de INSERT na tabela `printed_labels` estava muito restritiva:
- Exigia que o `organization_id` da label correspondesse EXATAMENTE à organização do perfil do usuário
- Não considerava casos onde o usuário é o preparador da label
- Falhava se o perfil do usuário não tivesse `organization_id` configurado

## ✅ Solução Implementada

### 1. Migration SQL Criada

Arquivo: `supabase/migrations/20260117000000_fix_printed_labels_rls.sql`

**Mudanças principais:**

1. **Policy de SELECT mais permissiva:**
   - Permite visualizar labels da organização do usuário
   - **OU** labels que o próprio usuário preparou

2. **Policy de INSERT mais flexível:**
   - Permite insert se `organization_id` corresponder à organização do usuário
   - **OU** se o usuário for o preparador (`prepared_by = auth.uid()`)
   - Mantém validação de que `organization_id` não pode ser NULL

3. **Policies de UPDATE/DELETE:**
   - Usuário pode editar/deletar suas próprias labels
   - Admins/owners/leader_chef podem gerenciar labels da organização

### 2. Como Aplicar

#### Opção A: Via Supabase Dashboard (Recomendado)

1. Acesse o projeto no Supabase Dashboard
2. Vá em **Database** → **SQL Editor**
3. Cole o conteúdo do arquivo `20260117000000_fix_printed_labels_rls.sql`
4. Execute o script
5. Verifique os avisos (warnings) sobre usuários sem organization_id

#### Opção B: Via CLI

```powershell
# Se tiver Supabase CLI instalado
cd "C:\Users\Marci\OneDrive\Área de Trabalho\Tampa APP\Tampa APP"
supabase db push
```

### 3. Verificação Pós-Deployment

Execute este SQL para verificar se tudo está OK:

```sql
-- Verificar policies ativas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'printed_labels'
ORDER BY policyname;

-- Verificar usuários sem organization_id
SELECT 
  p.user_id,
  p.display_name,
  p.organization_id,
  p.role
FROM profiles p
WHERE p.organization_id IS NULL;

-- Se houver usuários sem organization_id, atribuir manualmente:
UPDATE profiles
SET organization_id = '<ID_DA_ORGANIZACAO>'
WHERE user_id = '<USER_ID_SEM_ORG>';
```

## 🧪 Como Testar

1. **Teste de impressão via Zebra:**
   ```javascript
   // No console do cliente:
   // 1. Tentar imprimir uma label
   // 2. Verificar no console se NÃO aparece erro RLS
   // 3. Verificar se a label foi salva no banco
   ```

2. **Verificar no banco:**
   ```sql
   -- Últimas labels impressas
   SELECT 
     id,
     product_name,
     prepared_by_name,
     organization_id,
     created_at
   FROM printed_labels
   ORDER BY created_at DESC
   LIMIT 10;
   ```

## 📱 Problema 2: Responsividade iPad/iPhone

**Status:** Em preparação

Vou criar ajustes de CSS específicos para iPad e iPhone nos próximos commits.

### Áreas que precisam ajuste:
- [ ] Label Form (tamanho dos inputs)
- [ ] Print Queue (botões e lista)
- [ ] Dashboard (cards e layout)
- [ ] Navigation (menu mobile)
- [ ] Tables (scroll horizontal em telas pequenas)

## 📝 Próximos Passos

1. ✅ Aplicar migration RLS
2. ✅ Testar impressão Zebra
3. ⏳ Implementar ajustes de responsividade mobile
4. ⏳ Testar em iPad real
5. ⏳ Testar em iPhone real

## 🆘 Troubleshooting

### Se o erro RLS persistir:

1. **Verificar se migration foi aplicada:**
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations 
   WHERE version = '20260117000000';
   ```

2. **Verificar organization_id do usuário:**
   ```sql
   SELECT user_id, organization_id, role, display_name
   FROM profiles
   WHERE user_id = '<USER_ID_DO_CLIENTE>';
   ```

3. **Verificar policies ativas:**
   ```sql
   SELECT policyname, cmd, qual
   FROM pg_policies
   WHERE tablename = 'printed_labels';
   ```

### Erro "organization_id is NULL":

Executar no SQL Editor:

```sql
-- Listar usuários sem organization
SELECT user_id, display_name FROM profiles WHERE organization_id IS NULL;

-- Atribuir organization (substitua os IDs)
UPDATE profiles
SET organization_id = '<ID_ORG_DEFAULT>'
WHERE organization_id IS NULL;
```

## 🔗 Arquivos Relacionados

- `supabase/migrations/20260117000000_fix_printed_labels_rls.sql` - Migration SQL
- `src/utils/zebraPrinter.ts` - Lógica de salvamento de labels
- `src/lib/printers/ZebraPrinter.ts` - Conversão de dados para print
- `supabase/migrations/20241228010000_add_organization_to_printed_labels.sql` - Migration anterior de organization_id
