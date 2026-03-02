# ⚠️ ATUALIZAR TIPOS DO SUPABASE - AÇÃO NECESSÁRIA

## 🔴 Status: TIPOS DESATUALIZADOS

As tabelas `task_series` e `task_occurrences` foram criadas no banco de dados, mas o arquivo de tipos TypeScript ainda não foi atualizado.

## 📋 O que fazer

### Opção 1: Via Supabase CLI (Recomendado)

```powershell
# 1. Verificar se supabase CLI está instalado
npx supabase --version

# 2. Gerar tipos atualizados
npx supabase gen types typescript --project-id "klvpgscmkcpleftrrvza" --schema public > src/integrations/supabase/types.ts
```

Se pedir access token:
1. Vá em: https://supabase.com/dashboard/account/tokens
2. Gere um novo access token
3. Execute: `npx supabase login`
4. Cole o token
5. Execute o comando de geração novamente

### Opção 2: Via Supabase Dashboard (Manual)

1. Acesse: https://supabase.com/dashboard/project/klvpgscmkcpleftrrvza
2. Vá em **Settings** → **API**
3. Na seção **Type Definitions**, copie todo o conteúdo
4. Cole em `src/integrations/supabase/types.ts` (substituindo o conteúdo existente)

### Opção 3: Aguardar Regeneração Automática

- O Supabase regenera tipos automaticamente a cada deploy
- Se fizer um `git push`, o Vercel irá triggerar a regeneração
- Tipos ficam disponíveis em ~5 minutos após deploy

## 🛠️ Solução Temporária Aplicada

Para evitar erros de compilação, apliquei **type assertions** nas queries:

```typescript
// Exemplo:
const { data } = await supabase
  .from('task_series')  // Supabase ainda não reconhece
  .select()
  .single();

return data as TaskSeries;  // Type assertion manual
```

Isso permite que o código compile, mas perde a validação de tipos do Supabase.

## ✅ Como Verificar se Funcionou

Após atualizar os tipos, execute:

```powershell
npx tsc --noEmit
```

**Resultado esperado:** Zero erros relacionados a `task_series` ou `task_occurrences`.

## 📝 Arquivos Afetados

- `src/lib/queries/task-series.ts` - 23 type assertions
- `src/lib/queries/task-occurrences.ts` - 18 type assertions
- `src/types/recurring-tasks.ts` - Custom types (não afetado)

## 🔄 Próximos Passos

1. Atualizar tipos (escolher Opção 1, 2 ou 3)
2. Verificar compilação: `npx tsc --noEmit`
3. Remover type assertions (opcional, se quiser validação forte)
4. Continuar desenvolvimento da UI

---

**Data:** 21/02/2026  
**Fase:** 1.2 - Backend Types & Queries  
**Bloqueador:** Tipos Supabase desatualizados (não crítico)
