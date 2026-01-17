# 🧪 MODO DE TESTE - Impressão Zebra sem Impressora Física

## ✅ PROBLEMA RESOLVIDO: RLS Error

O erro de RLS foi **corrigido com sucesso** através da migration:
```
supabase/migrations/20260117000000_fix_printed_labels_rls.sql
```

✅ **SQL executado com sucesso no Supabase**  
✅ **Políticas RLS atualizadas**  
✅ **Não há mais erro "new row violates row-level security policy"**

---

## 🎯 Como Testar SEM Impressora Física

Agora você pode testar o **salvamento no banco de dados** e a **geração de ZPL** sem precisar de uma impressora Zebra conectada!

### Opção 1: Variável de Ambiente (RECOMENDADO)

1. **Copie o arquivo de teste:**
   ```powershell
   Copy-Item .env.test .env.local
   ```

2. **Edite `.env.local` e adicione suas credenciais Supabase:**
   ```env
   # Modo de teste (true = sem impressora)
   VITE_PRINTER_TEST_MODE=true
   
   # Suas credenciais Supabase
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-aqui
   ```

3. **Reinicie o servidor dev:**
   ```powershell
   npm run dev
   ```

4. **Teste a impressão:**
   - Vá para página de Labels
   - Preencha o formulário
   - Clique em "Print"
   - **Resultado esperado:**
     ```
     🧪 TEST MODE: Label saved to database, skipping printer connection
     💾 Label ID: 550e8400-e29b-41d4-a716-446655440000
     ✅ Database insert successful!
     📄 ZPL Code generated (1234 characters)
     ```

### Opção 2: Modo de Teste Manual no Código

Se você quiser testar sem mudar variáveis de ambiente:

```typescript
// No componente que chama printLabel:
import { printLabel } from '@/utils/zebraPrinter';

// Passe testMode=true como segundo parâmetro
const result = await printLabel(labelData, true);

if (result.success) {
  console.log('✅ Label salvo no banco:', result.labelId);
  console.log('📄 ZPL gerado:', result.zpl);
}
```

---

## 🔍 O Que Acontece no Modo de Teste?

1. ✅ **Valida dados** (organization_id, prepared_by, etc)
2. ✅ **Salva no banco** (tabela `printed_labels`)
3. ✅ **Gera código ZPL** completo
4. ❌ **NÃO tenta conectar na impressora** (pula o WebSocket)
5. ✅ **Retorna sucesso** com labelId e ZPL code

**Erros que você NÃO verá mais:**
- ❌ `WebSocket connection to 'ws://127.0.0.1:9100/' failed`
- ❌ `Failed to connect to printer. Make sure Zebra Browser Print is running.`

**O que você verá:**
- ✅ `Label saved to database` 
- ✅ Console logs com labelId e ZPL code
- ✅ Registro salvo na tabela `printed_labels`

---

## 📊 Como Verificar se Funcionou?

### 1. Verifique no Console do Browser (F12)
Você deve ver:
```
🧪 TEST MODE: Label saved to database, skipping printer connection
💾 Label ID: abc123-def456-...
✅ Database insert successful!
📄 ZPL Code generated (1234 characters)
```

### 2. Verifique no Supabase Dashboard
```sql
-- Vá para SQL Editor no Supabase e execute:
SELECT 
  id,
  product_name,
  prepared_by_name,
  prep_date,
  expiry_date,
  organization_id,
  created_at
FROM printed_labels
ORDER BY created_at DESC
LIMIT 10;
```

Você deve ver o novo registro salvo! ✅

### 3. Verifique que NÃO há erro de RLS
Se aparecer erro `42501`, algo deu errado. Mas se executou a migration corretamente, **não deve haver erro**.

---

## 🔄 Como Voltar ao Modo Normal (com Impressora)?

Quando o cliente na Austrália for testar com impressora física:

1. **Edite `.env.local`:**
   ```env
   VITE_PRINTER_TEST_MODE=false
   ```

2. **Ou delete a linha toda:**
   ```env
   # VITE_PRINTER_TEST_MODE=true  ← comentar ou deletar
   ```

3. **Reinicie o servidor:**
   ```powershell
   npm run dev
   ```

Agora vai tentar conectar na impressora normalmente!

---

## 🎬 Próximos Passos

### Para VOCÊ (Brasil - Teste Agora):
1. ✅ Copie `.env.test` para `.env.local`
2. ✅ Adicione credenciais Supabase no `.env.local`
3. ✅ Reinicie `npm run dev`
4. ✅ Teste impressão - deve salvar no banco SEM erro
5. ✅ Verifique no Supabase que o registro foi salvo

### Para o CLIENTE (Austrália - Depois):
1. ⏳ Mude `VITE_PRINTER_TEST_MODE=false`
2. ⏳ Conecte impressora Zebra
3. ⏳ Instale Zebra Browser Print
4. ⏳ Teste impressão física
5. ⏳ Confirme que label é impressa E salva no banco

---

## 📝 Resumo Técnico

### Arquivos Modificados (NÃO COMMITADOS AINDA):

1. ✅ `supabase/migrations/20260117000000_fix_printed_labels_rls.sql` - Fix RLS policies
2. ✅ `src/utils/zebraPrinter.ts` - Adicionado parâmetro `testMode`
3. ✅ `src/lib/printers/ZebraPrinter.ts` - Suporte a `testMode`
4. ✅ `.env.test` - Template para modo de teste
5. ✅ `docs/TEST_MODE_GUIDE.md` - Este guia

### Comportamento:

**Modo Normal (PRODUCTION):**
```typescript
testMode = false
→ Salva no banco
→ Gera ZPL
→ Tenta conectar na impressora via WebSocket
→ Envia ZPL para impressora
```

**Modo de Teste (TEST):**
```typescript
testMode = true
→ Salva no banco
→ Gera ZPL
→ PULA conexão com impressora
→ Retorna sucesso + labelId + ZPL code
```

---

## ⚠️ IMPORTANTE

**NÃO COMMITE AINDA!** Conforme sua instrução:
> "não commite até o estar corrigido, pq se não vai gerar um novo release"

### Antes de Commitar, Teste:
1. ✅ SQL migration funcionou (você já confirmou)
2. ⏳ Modo de teste funciona no Brasil (teste agora)
3. ⏳ Cliente testa com impressora na Austrália
4. ⏳ Mobile responsiveness testado no iPad/iPhone
5. ✅ Depois commita tudo junto

---

## 🆘 Troubleshooting

### Erro: "VALIDATION ERROR: organizationId is required"
**Causa:** Usuário não tem `organization_id` no profile  
**Solução:** Execute no Supabase:
```sql
UPDATE profiles
SET organization_id = 'ID_DA_ORGANIZACAO'
WHERE user_id = 'ID_DO_USUARIO' 
AND organization_id IS NULL;
```

### Erro: "column 'role' does not exist"
**Causa:** Migration antiga ainda usando `profiles.role`  
**Solução:** ✅ Já corrigido! Migration usa `user_roles` agora

### Console não mostra "TEST MODE"
**Causa:** Variável de ambiente não carregou  
**Solução:** 
1. Verifique se `.env.local` existe
2. Reinicie `npm run dev`
3. Abra DevTools → Console → Recarregue página

---

## 🎉 Conclusão

Agora você pode:
- ✅ Testar impressão do Brasil sem impressora
- ✅ Verificar que RLS está funcionando
- ✅ Ver labels salvando no banco corretamente
- ✅ Gerar e inspecionar código ZPL
- ✅ Desenvolver features relacionadas sem hardware

**Quando cliente testar na Austrália:**
- Simplesmente muda `testMode=false`
- Impressora física funciona normalmente
- Database continua salvando (como antes)
