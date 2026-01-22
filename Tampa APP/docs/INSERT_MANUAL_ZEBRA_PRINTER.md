# 🔧 INSERT Manual: Cadastrar Impressora ZD411 no Supabase

## 📋 Dados Necessários

Para cadastrar uma impressora Zebra ZD411 via INSERT direto no Supabase, você precisa:

### **Dados Obrigatórios:**

| Campo | Tipo | Valor para ZD411 | Descrição |
|-------|------|------------------|-----------|
| `id` | UUID | (auto-gerado) | ID único da impressora |
| `organization_id` | UUID | **SEU ORG ID** | ID da organização do usuário |
| `name` | TEXT | "Printer123" ou "ZD411-Kitchen" | Nome amigável |
| `connection_type` | TEXT | "bluetooth" | Tipo de conexão |
| `bluetooth_address` | TEXT | "60:95:32:55:3F:99" | Endereço MAC Bluetooth |
| `model` | TEXT | "ZD411" | Modelo da impressora |
| `enabled` | BOOLEAN | true | Se está habilitada |

### **Dados Opcionais (com defaults):**

| Campo | Tipo | Valor Padrão ZD411 | Descrição |
|-------|------|-------------------|-----------|
| `default_darkness` | INTEGER | 15 | Escuridão (0-30) |
| `default_print_speed` | INTEGER | 4 | Velocidade (2-12) |
| `label_width_mm` | INTEGER | 101 | Largura etiqueta (4" = 101mm) |
| `label_height_mm` | INTEGER | 152 | Altura etiqueta (6" = 152mm) |
| `print_density_dpi` | INTEGER | 203 | Resolução (203 DPI) |
| `websocket_port` | INTEGER | 6101 | Porta WebSocket |
| `ip_address` | TEXT | NULL | (não usado em Bluetooth) |
| `description` | TEXT | NULL | Descrição opcional |
| `last_seen_at` | TIMESTAMPTZ | NULL | Última vez vista |

---

## 🚀 Passo a Passo: INSERT no Supabase

### **PASSO 1: Obter Organization ID**

Primeiro, descubra o `organization_id` do seu cliente:

```sql
-- Buscar organization_id do usuário logado
SELECT 
    u.id as user_id,
    u.email,
    u.organization_id,
    o.name as organization_name
FROM auth.users u
LEFT JOIN organizations o ON o.id = u.organization_id
WHERE u.email = 'email_do_cliente@exemplo.com';
```

**Resultado esperado:**
```
user_id: 39049e8c-1c7f-41b8-80ee-19a4b9b9b3a7
email: email_do_cliente@exemplo.com
organization_id: a1b2c3d4-e5f6-7890-abcd-ef1234567890  ← COPIE ESTE ID!
organization_name: Tampa Test Restaurant
```

---

### **PASSO 2: Obter Endereço Bluetooth da Impressora**

No iPhone do cliente, **Configurações → Bluetooth → ZD411**:

```
Nome: ZD411-203dpi
Endereço: 60:95:32:55:3F:99  ← COPIE ESTE ENDEREÇO!
Status: Conectado
```

**Ou** no app Zebra Printer Setup:
- Toque na impressora conectada
- Endereço Bluetooth aparece abaixo do nome

---

### **PASSO 3: Executar INSERT**

No **Supabase SQL Editor**, execute:

```sql
-- SUBSTITUA OS VALORES DESTACADOS ANTES DE EXECUTAR!

INSERT INTO zebra_printers (
    -- Obrigatórios
    organization_id,
    name,
    connection_type,
    bluetooth_address,
    model,
    enabled,
    
    -- Configurações ZD411 (valores otimizados)
    default_darkness,
    default_print_speed,
    label_width_mm,
    label_height_mm,
    print_density_dpi,
    websocket_port,
    
    -- Metadados
    description,
    created_at,
    updated_at
)
VALUES (
    -- ⚠️ SUBSTITUA COM O organization_id DO PASSO 1
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- organization_id
    
    -- ⚠️ PERSONALIZE O NOME (ou deixe como está)
    'ZD411-Kitchen',  -- name
    
    -- ✅ Fixos para ZD411 Bluetooth
    'bluetooth',  -- connection_type
    
    -- ⚠️ SUBSTITUA COM O ENDEREÇO BLUETOOTH DO PASSO 2
    '60:95:32:55:3F:99',  -- bluetooth_address
    
    'ZD411',  -- model
    true,  -- enabled
    
    -- ✅ Valores otimizados para ZD411 203 DPI
    15,  -- default_darkness (15 é bom para etiquetas térmicas)
    4,   -- default_print_speed (4 = velocidade média, boa qualidade)
    101, -- label_width_mm (4 polegadas = 101.6mm)
    152, -- label_height_mm (6 polegadas = 152.4mm)
    203, -- print_density_dpi (ZD411 padrão)
    6101, -- websocket_port (porta mais comum para Zebra Setup App)
    
    -- ✅ Opcional
    'Impressora Zebra ZD411 da cozinha - Bluetooth',  -- description
    NOW(),  -- created_at
    NOW()   -- updated_at
)
RETURNING *;
```

---

### **PASSO 4: Verificar Inserção**

Após executar, você deve ver:

```sql
-- Confirmar que foi criado
SELECT 
    id,
    name,
    model,
    connection_type,
    bluetooth_address,
    enabled,
    default_darkness,
    default_print_speed,
    label_width_mm,
    label_height_mm,
    print_density_dpi,
    websocket_port,
    organization_id
FROM zebra_printers
WHERE organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'  -- ⚠️ SEU ORG ID
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado:**
```
✅ 1 row returned

id: f1a2b3c4-d5e6-7890-abcd-1234567890ef
name: ZD411-Kitchen
model: ZD411
connection_type: bluetooth
bluetooth_address: 60:95:32:55:3F:99
enabled: true
default_darkness: 15
default_print_speed: 4
label_width_mm: 101
label_height_mm: 152
print_density_dpi: 203
websocket_port: 6101
organization_id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## 🧪 Testar no Tampa APP

Após o INSERT:

1. **Recarregue a página Settings no Tampa APP:**
   ```
   Safari → Recarregar (⟳)
   ```

2. **Verifique se a impressora aparece:**
   ```
   Settings → Impressoras
   
   Deve aparecer:
   📋 ZD411-Kitchen
   Status: Bluetooth
   Endereço: 60:95:32:55:3F:99
   ```

3. **Teste impressão:**
   ```
   Labeling → Produto → Print
   → Deve imprimir ✅
   ```

---

## 📊 Valores Recomendados por Etiqueta

Se precisar ajustar para diferentes tamanhos de etiqueta:

### **Etiquetas 4" x 6" (Tampa APP padrão):**
```sql
label_width_mm: 101,   -- 4 polegadas
label_height_mm: 152,  -- 6 polegadas
default_darkness: 15,  -- Escuridão média
default_print_speed: 4 -- Velocidade média
```

### **Etiquetas 4" x 3":**
```sql
label_width_mm: 101,   -- 4 polegadas
label_height_mm: 76,   -- 3 polegadas
default_darkness: 15,
default_print_speed: 5 -- Pode ir mais rápido (menor)
```

### **Etiquetas 2" x 1":**
```sql
label_width_mm: 50,    -- 2 polegadas
label_height_mm: 25,   -- 1 polegada
default_darkness: 18,  -- Mais escuro (pequena)
default_print_speed: 6 -- Mais rápido
```

---

## 🔍 Troubleshooting

### Erro: "Foreign key violation - organization_id"

**Causa:** Organization ID inválido

**Solução:**
```sql
-- Verificar organizations disponíveis
SELECT id, name FROM organizations;

-- Copie o ID correto e use no INSERT
```

---

### Erro: "Duplicate key value violates unique constraint"

**Causa:** Já existe impressora com mesmo bluetooth_address

**Solução:**
```sql
-- Verificar se já existe
SELECT * FROM zebra_printers 
WHERE bluetooth_address = '60:95:32:55:3F:99';

-- Se existir, UPDATE ao invés de INSERT:
UPDATE zebra_printers
SET 
    name = 'ZD411-Kitchen',
    enabled = true,
    default_darkness = 15,
    updated_at = NOW()
WHERE bluetooth_address = '60:95:32:55:3F:99';
```

---

### Console ainda mostra "Loaded 0 printers"

**Causa:** RLS (Row Level Security) bloqueando

**Solução:**
```sql
-- Verificar policies
SELECT * FROM zebra_printers 
WHERE organization_id = 'SEU_ORG_ID';

-- Se não aparecer nada, problema de RLS
-- Verificar se usuário está na organização correta
SELECT 
    u.id,
    u.email,
    u.organization_id,
    zp.id as printer_id,
    zp.name as printer_name
FROM auth.users u
LEFT JOIN zebra_printers zp ON zp.organization_id = u.organization_id
WHERE u.email = 'email_do_cliente@exemplo.com';
```

---

## 🎯 Template Completo (Copiar e Colar)

```sql
-- 1️⃣ PASSO 1: Buscar organization_id
SELECT 
    u.id as user_id,
    u.email,
    u.organization_id,
    o.name as organization_name
FROM auth.users u
LEFT JOIN organizations o ON o.id = u.organization_id
WHERE u.email = 'email_do_cliente@exemplo.com';
-- Copie o organization_id do resultado ↑

-- 2️⃣ PASSO 2: Inserir impressora
-- ⚠️ SUBSTITUA os valores destacados:
-- - organization_id (do passo 1)
-- - bluetooth_address (do iPhone/app Zebra)
-- - name (personalize se quiser)

INSERT INTO zebra_printers (
    organization_id,
    name,
    connection_type,
    bluetooth_address,
    model,
    enabled,
    default_darkness,
    default_print_speed,
    label_width_mm,
    label_height_mm,
    print_density_dpi,
    websocket_port,
    description,
    created_at,
    updated_at
)
VALUES (
    'COLE_SEU_ORGANIZATION_ID_AQUI',  -- ⚠️ DO PASSO 1
    'ZD411-Kitchen',
    'bluetooth',
    '60:95:32:55:3F:99',  -- ⚠️ ENDEREÇO BLUETOOTH REAL
    'ZD411',
    true,
    15,
    4,
    101,
    152,
    203,
    6101,
    'Impressora Zebra ZD411 - Bluetooth',
    NOW(),
    NOW()
)
RETURNING *;

-- 3️⃣ PASSO 3: Verificar
SELECT 
    id,
    name,
    bluetooth_address,
    enabled
FROM zebra_printers
WHERE organization_id = 'COLE_SEU_ORGANIZATION_ID_AQUI'  -- ⚠️ DO PASSO 1
ORDER BY created_at DESC;
```

---

## 💡 Resposta Final

### ✅ Sobre o Erro:

**SIM**, quando o erro de INSERT apareceu, significa que:

1. ✅ Tampa APP estava carregado
2. ✅ Usuário autenticado
3. ✅ Página Settings funcionando
4. ✅ Dialog "Adicionar Impressora" abriu
5. ✅ Comunicação Bluetooth → Zebra Setup → Tampa APP **PRONTA**
6. ❌ **APENAS** o salvamento no banco falhou

**Conclusão:** A impressora estava **APTA** a receber requisições! O problema era só persistir a configuração.

---

### 📝 Dados Necessários para INSERT:

**Mínimos obrigatórios:**
- `organization_id` (buscar com SELECT)
- `name` (qualquer nome)
- `connection_type` = "bluetooth"
- `bluetooth_address` (do iPhone/app Zebra)
- `model` = "ZD411"
- `enabled` = true

**Recomendados (com valores padrão ZD411):**
- `default_darkness` = 15
- `default_print_speed` = 4
- `label_width_mm` = 101
- `label_height_mm` = 152
- `print_density_dpi` = 203
- `websocket_port` = 6101

---

**Última atualização:** 20 de Janeiro de 2026  
**Versão:** 1.0
