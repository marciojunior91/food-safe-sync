# 🔄 Regenerar Tipos do Supabase - URGENTE

## ⚠️ Problema

O arquivo `src/components/labels/PrintQueue.tsx` está com erros de TypeScript porque a tabela `print_queue` não está nos tipos gerados do Supabase (`src/types/supabase.ts`).

## 📋 Solução: Regenerar Tipos

### Passo 1: Verificar Supabase CLI Instalado

```powershell
supabase --version
```

Se não estiver instalado:
```powershell
npm install -g supabase
```

### Passo 2: Login no Supabase

```powershell
supabase login
```

### Passo 3: Regenerar os Tipos

```powershell
npx supabase gen types typescript --project-id imnecvcvhypnlvujajpn > src/types/supabase.ts
```

**Ou com o comando direto:**
```powershell
supabase gen types typescript --project-id imnecvcvhypnlvujajpn --schema public > src/types/supabase.ts
```

### Passo 4: Verificar Erros

Após regenerar, verifique se ainda há erros:

```powershell
npm run build
```

## 🎯 O Que Este Comando Faz

- Conecta ao seu projeto Supabase (`imnecvcvhypnlvujajpn`)
- Analisa todas as tabelas do schema `public`
- Gera interfaces TypeScript para cada tabela (incluindo `print_queue`)
- Salva em `src/types/supabase.ts`

## 📊 Tabelas Que Devem Estar Presentes Após Regeneração

- ✅ `print_queue` (FALTANDO ATUALMENTE)
- ✅ `routine_tasks` (com novo campo `team_member_id`)
- ✅ `team_members`
- ✅ `products`
- ✅ `label_categories`
- ✅ Todas as outras tabelas existentes

## 🔍 Como Verificar Se Funcionou

1. Abra `src/types/supabase.ts`
2. Procure por `print_queue` (Ctrl+F)
3. Deve aparecer algo como:

```typescript
print_queue: {
  Row: {
    id: string
    created_at: string
    organization_id: string
    product_id: string
    // ... outros campos
  }
  Insert: { ... }
  Update: { ... }
  Relationships: [ ... ]
}
```

## ⚠️ Notas Importantes

1. **Backup**: O comando acima sobrescreve `src/types/supabase.ts`. Faça backup se tiver modificações manuais.

2. **Migrations Pendentes**: Se você criou migrações mas não aplicou, elas NÃO aparecerão nos tipos. Você DEVE aplicar as migrações primeiro:
   - `APPLY_TEAM_MEMBER_TO_ROUTINE_TASKS.sql` (adiciona `team_member_id`)
   - Qualquer outra migration pendente

3. **Ordem Correta**:
   - ✅ Aplicar migrations no Supabase SQL Editor
   - ✅ Regenerar tipos com comando acima
   - ✅ Verificar erros de TypeScript

## 🚀 Após Regenerar

Execute novamente:
```powershell
npm run dev
```

E teste:
- ✅ Print Queue carrega sem erros
- ✅ Routine Tasks com team member assignment
- ✅ Nenhum erro de TypeScript no console

---

**Prioridade**: 🔴 CRÍTICA - Bloqueando desenvolvimento
**Tempo estimado**: 2-3 minutos
**Impacto**: Resolve todos os erros de tipo em PrintQueue.tsx
