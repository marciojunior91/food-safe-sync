# Guia de Sincronização de Migrações - Supabase

## 📋 Situação Atual

Você aplicou manualmente as seguintes migrações via SQL Editor no Supabase:
- ✅ `20260103000000_create_team_members_table.sql`
- ✅ `20260103000001_verify_pin_rpc.sql`

O Supabase CLI local não sabe que essas migrações já foram aplicadas remotamente.

---

## 🔧 Opção 1: Sincronização Rápida (Recomendado)

Execute apenas para as 2 novas migrações:

```powershell
# Marca a migração do team_members como aplicada
npx supabase@latest migration repair --status applied 20260103000000

# Marca a migração do PIN RPC como aplicada  
npx supabase@latest migration repair --status applied 20260103000001
```

**Verificar depois:**
```powershell
npx supabase@latest migration list
```

As duas últimas migrações devem aparecer com uma marca na coluna "Remote".

---

## 🔧 Opção 2: Sincronização Completa (Se necessário)

Se quiser sincronizar TODAS as migrações (não apenas as 2 novas), crie um arquivo `sync-all.bat`:

```batch
@echo off
echo Syncing ALL migrations...
npx supabase@latest migration repair --status applied 20241227000000
npx supabase@latest migration repair --status applied 20241227120000
npx supabase@latest migration repair --status applied 20241227130000
npx supabase@latest migration repair --status applied 20241228000000
npx supabase@latest migration repair --status applied 20241228010000
npx supabase@latest migration repair --status applied 20250101000000
npx supabase@latest migration repair --status applied 20250101000001
npx supabase@latest migration repair --status applied 20250101000002
npx supabase@latest migration repair --status applied 20250101000002
npx supabase@latest migration repair --status applied 20250101000003
npx supabase@latest migration repair --status applied 20250820125502
npx supabase@latest migration repair --status applied 20250821020722
npx supabase@latest migration repair --status applied 20250821021540
npx supabase@latest migration repair --status applied 20250821023701
npx supabase@latest migration repair --status applied 20250821024304
npx supabase@latest migration repair --status applied 20250821061804
npx supabase@latest migration repair --status applied 20250821063315
npx supabase@latest migration repair --status applied 20250821063346
npx supabase@latest migration repair --status applied 20251006205806
npx supabase@latest migration repair --status applied 20251006212603
npx supabase@latest migration repair --status applied 20251006214310
npx supabase@latest migration repair --status applied 20251006214931
npx supabase@latest migration repair --status applied 20251006215528
npx supabase@latest migration repair --status applied 20251006215603
npx supabase@latest migration repair --status applied 20251016014922
npx supabase@latest migration repair --status applied 20251023031219
npx supabase@latest migration repair --status applied 20251026034330
npx supabase@latest migration repair --status applied 20251026040135
npx supabase@latest migration repair --status applied 20251026
npx supabase@latest migration repair --status applied 20251027
npx supabase@latest migration repair --status applied 20251202100000
npx supabase@latest migration repair --status applied 20251202120000
npx supabase@latest migration repair --status applied 20251203000000
npx supabase@latest migration repair --status applied 20251203120000
npx supabase@latest migration repair --status applied 20251203130000
npx supabase@latest migration repair --status applied 20251203140000
npx supabase@latest migration repair --status applied 20251203150000
npx supabase@latest migration repair --status applied 20251205000000
npx supabase@latest migration repair --status applied 20251209140000
npx supabase@latest migration repair --status applied 20251209140100
npx supabase@latest migration repair --status applied 20251209140200
npx supabase@latest migration repair --status applied 20251209140300
npx supabase@latest migration repair --status applied 20251209140400
npx supabase@latest migration repair --status applied 20251209140500
npx supabase@latest migration repair --status applied 20251215000000
npx supabase@latest migration repair --status applied 20251216000000
npx supabase@latest migration repair --status applied 20251216000000
npx supabase@latest migration repair --status applied 20251216120000
npx supabase@latest migration repair --status applied 20251216130000
npx supabase@latest migration repair --status applied 20251217000000
npx supabase@latest migration repair --status applied 20260103000000
npx supabase@latest migration repair --status applied 20260103000001
echo Done!
npx supabase@latest migration list
```

Execute:
```powershell
.\sync-all.bat
```

---

## 🔧 Opção 3: Abordagem Manual Individual

Execute manualmente cada comando (mais lento mas mais controlado):

```powershell
# Para as 2 novas migrações
npx supabase migration repair --status applied 20260103000000
npx supabase migration repair --status applied 20260103000001
```

---

## ✅ Verificação

Após executar qualquer opção, verifique:

```powershell
npx supabase migration list
```

**Resultado esperado:**
```
   Local          | Remote | Time (UTC)
  ----------------|--------|---------------------
   ...
   20260103000000 | ✓      | 2026-01-03 00:00:00
   20260103000001 | ✓      | 2026-01-03 00:00:01
```

---

## 🚀 Fluxo de Trabalho Futuro

Depois de sincronizar, o fluxo ideal será:

### Para novas migrações:

1. **Criar migração:**
   ```powershell
   npx supabase migration new nome_da_migracao
   ```

2. **Editar o arquivo SQL gerado**

3. **Aplicar via CLI (recomendado):**
   ```powershell
   npx supabase db push
   ```
   
   OU aplicar manualmente no SQL Editor e depois sincronizar:
   ```powershell
   npx supabase migration repair --status applied [timestamp]
   ```

---

## 🎯 Recomendação Imediata

**Execute apenas:**

```powershell
npx supabase migration repair --status applied 20260103000000
npx supabase migration repair --status applied 20260103000001
npx supabase migration list
```

Isso marca as 2 novas migrações como aplicadas e mantém o histórico sincronizado para futuras migrações.

---

## 📝 Notas Importantes

- ✅ O comando `migration repair` **NÃO** executa as migrações, apenas atualiza o registro de histórico
- ✅ Isso é seguro porque você já aplicou as migrações manualmente
- ✅ Futuros `db push` funcionarão corretamente após a sincronização
- ⚠️ Sempre verifique com `migration list` após sincronizar
