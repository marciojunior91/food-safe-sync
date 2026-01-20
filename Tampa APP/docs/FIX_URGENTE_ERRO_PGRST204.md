# 🔧 FIX URGENTE: Erro ao Salvar Impressora (PGRST204)

## 🚨 Erro Identificado

```
❌ Failed to save printer: Object {code: "PGRST204", 
message: "Could not find the 'default_darkness' column of 'zebra_printers' 
in the schema cache"}
```

## 🎯 Causa do Problema

A tabela `zebra_printers` no banco de dados Supabase tem nomes de colunas **diferentes** do esperado pelo código:

| Banco de Dados (atual) | Código TypeScript (esperado) |
|-------------------------|-------------------------------|
| `darkness` | `default_darkness` |
| `speed` | `default_print_speed` |
| `paper_width` | `label_width_mm` |
| `paper_height` | `label_height_mm` |
| `dpi` | `print_density_dpi` |
| `last_seen` | `last_seen_at` |
| (não existe) | `websocket_port` |
| (não existe) | `enabled` |

## ✅ Solução: Aplicar Migração de Correção

### **Passo 1: Acessar Supabase Dashboard**

1. Abra: https://supabase.com/dashboard
2. Selecione seu projeto: **Tampa APP** (food-safe-sync)
3. No menu lateral esquerdo: **SQL Editor**

---

### **Passo 2: Criar Nova Query**

1. Clique em **"+ New query"** (botão no topo direito)
2. Cole o script SQL abaixo:

```sql
-- Fix zebra_printers table schema inconsistency
-- The table has columns named differently than expected by the types

-- Check if table exists and fix column names
DO $$
BEGIN
    -- Rename darkness to default_darkness if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zebra_printers' 
        AND column_name = 'darkness'
    ) THEN
        ALTER TABLE zebra_printers RENAME COLUMN darkness TO default_darkness;
        RAISE NOTICE 'Renamed darkness to default_darkness';
    END IF;

    -- Rename speed to default_print_speed if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zebra_printers' 
        AND column_name = 'speed'
    ) THEN
        ALTER TABLE zebra_printers RENAME COLUMN speed TO default_print_speed;
        RAISE NOTICE 'Renamed speed to default_print_speed';
    END IF;

    -- Rename paper_width to label_width_mm if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zebra_printers' 
        AND column_name = 'paper_width'
    ) THEN
        ALTER TABLE zebra_printers RENAME COLUMN paper_width TO label_width_mm;
        RAISE NOTICE 'Renamed paper_width to label_width_mm';
    END IF;

    -- Rename paper_height to label_height_mm if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zebra_printers' 
        AND column_name = 'paper_height'
    ) THEN
        ALTER TABLE zebra_printers RENAME COLUMN paper_height TO label_height_mm;
        RAISE NOTICE 'Renamed paper_height to label_height_mm';
    END IF;

    -- Rename dpi to print_density_dpi if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zebra_printers' 
        AND column_name = 'dpi'
    ) THEN
        ALTER TABLE zebra_printers RENAME COLUMN dpi TO print_density_dpi;
        RAISE NOTICE 'Renamed dpi to print_density_dpi';
    END IF;

    -- Rename last_seen to last_seen_at if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zebra_printers' 
        AND column_name = 'last_seen'
    ) THEN
        ALTER TABLE zebra_printers RENAME COLUMN last_seen TO last_seen_at;
        RAISE NOTICE 'Renamed last_seen to last_seen_at';
    END IF;

    -- Add websocket_port column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zebra_printers' 
        AND column_name = 'websocket_port'
    ) THEN
        ALTER TABLE zebra_printers ADD COLUMN websocket_port INTEGER;
        RAISE NOTICE 'Added websocket_port column';
    END IF;

    -- Add enabled column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zebra_printers' 
        AND column_name = 'enabled'
    ) THEN
        ALTER TABLE zebra_printers ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE 'Added enabled column';
    END IF;

END $$;

-- Update comments to reflect new column names
COMMENT ON COLUMN zebra_printers.default_darkness IS 'Print darkness setting (0-30, higher = darker)';
COMMENT ON COLUMN zebra_printers.default_print_speed IS 'Print speed setting (2-12, higher = faster)';
COMMENT ON COLUMN zebra_printers.label_width_mm IS 'Label width in millimeters';
COMMENT ON COLUMN zebra_printers.label_height_mm IS 'Label height in millimeters';
COMMENT ON COLUMN zebra_printers.print_density_dpi IS 'Print density in DPI (203 or 300)';
COMMENT ON COLUMN zebra_printers.last_seen_at IS 'Last time printer was seen online';
COMMENT ON COLUMN zebra_printers.websocket_port IS 'WebSocket port for Zebra Printer Setup App (6101, 9100, or 9200)';
COMMENT ON COLUMN zebra_printers.enabled IS 'Whether the printer is enabled for use';
```

---

### **Passo 3: Executar Query**

1. Clique em **"Run"** (botão verde no canto inferior direito)
2. Aguarde execução (deve levar ~2 segundos)
3. Verifique mensagens de sucesso:

```
✅ Renamed darkness to default_darkness
✅ Renamed speed to default_print_speed
✅ Renamed paper_width to label_width_mm
✅ Renamed paper_height to label_height_mm
✅ Renamed dpi to print_density_dpi
✅ Renamed last_seen to last_seen_at
✅ Added websocket_port column
✅ Added enabled column
✅ All expected columns present in zebra_printers table
```

---

### **Passo 4: Atualizar Cache do Supabase**

É necessário atualizar o cache de schema do Supabase:

**Opção A: Via Dashboard (Mais Rápido)**

1. No Supabase Dashboard, vá em **Settings** (menu lateral)
2. Clique em **API**
3. Role até **"Schema Cache"**
4. Clique em **"Reload schema cache"** ou **"Restart services"**

**Opção B: Aguardar (Automático)**

- Cache é atualizado automaticamente a cada **5 minutos**
- Aguarde ~5 minutos e tente novamente

**Opção C: Forçar Deploy (Se necessário)**

```powershell
# No terminal do projeto
git add .
git commit -m "fix: zebra_printers schema columns"
git push origin main
```

Vercel fará novo deploy → Supabase atualiza cache

---

### **Passo 5: Testar no Tampa APP**

1. Recarregue Tampa APP no Safari (F5 ou Cmd+R)
2. Settings → Admin Tab → Zebra Printers
3. Tente adicionar impressora novamente
4. Não deve mais dar erro PGRST204 ✅

---

## 🧪 Verificar Se Foi Aplicado Corretamente

Execute esta query no SQL Editor:

```sql
-- Verificar colunas da tabela zebra_printers
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'zebra_printers'
ORDER BY ordinal_position;
```

**Resultado esperado deve incluir:**
- ✅ `default_darkness` (integer)
- ✅ `default_print_speed` (integer)
- ✅ `label_width_mm` (integer)
- ✅ `label_height_mm` (integer)
- ✅ `print_density_dpi` (integer)
- ✅ `last_seen_at` (timestamp with time zone)
- ✅ `websocket_port` (integer)
- ✅ `enabled` (boolean)

**NÃO deve conter:**
- ❌ `darkness`
- ❌ `speed`
- ❌ `paper_width`
- ❌ `paper_height`
- ❌ `dpi`
- ❌ `last_seen`

---

## 📋 Checklist de Verificação

Após aplicar a migração:

- [ ] Query executada sem erros
- [ ] Mensagens de sucesso apareceram (8 notices)
- [ ] Cache do Supabase atualizado (reload schema cache)
- [ ] Tampa APP recarregado
- [ ] Tentativa de adicionar impressora
- [ ] ✅ **Erro PGRST204 não aparece mais!**
- [ ] Impressora salva com sucesso

---

## ❓ FAQ

### "Ainda dá erro PGRST204 mesmo após aplicar SQL"

**Solução:** Cache do Supabase ainda não atualizou

1. Supabase Dashboard → Settings → API
2. Reload schema cache
3. Aguarde 1 minuto
4. Tente novamente no Tampa APP

---

### "A query falhou com erro"

**Erro comum:** "relation 'zebra_printers' does not exist"

**Solução:** Tabela não foi criada ainda. Execute ANTES:

```sql
-- Criar tabela zebra_printers (se não existir)
\i docs/APPLY_ZEBRA_PRINTER_MANAGEMENT_SCHEMA.sql
```

Depois execute a correção acima.

---

### "Loaded 0 printers" aparece no console

**É normal!** Significa que ainda não há impressoras cadastradas.

Após corrigir schema, adicione uma impressora:
1. Settings → Admin → Zebra Printers
2. "Add Printer"
3. Preencha dados da ZD411
4. Save

Console deve mostrar:
```
✅ Added printer: ZD411-203dpi
Loaded 1 printers
```

---

## 🎯 Resumo

**Problema:** Schema desatualizado (colunas com nomes errados)  
**Solução:** Renomear colunas + adicionar colunas faltantes  
**Tempo:** ~5 minutos  
**Resultado:** Erro PGRST204 eliminado ✅

---

## 📞 Suporte

Se após aplicar ainda houver problemas:

1. Tire screenshot do erro no console
2. Execute query de verificação e copie resultado
3. Entre em contato com suporte técnico

---

**Criado em:** 20 de Janeiro de 2026  
**Prioridade:** 🔥 URGENTE  
**Arquivo SQL:** `docs/FIX_ZEBRA_PRINTERS_SCHEMA.sql`  
**Versão:** 1.0
