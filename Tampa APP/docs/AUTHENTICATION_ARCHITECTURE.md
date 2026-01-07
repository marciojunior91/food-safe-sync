# 🔐 Tampa APP - Authentication Architecture
## Multi-Layer Authentication for Kitchen Tablets

**Version:** 1.0  
**Date:** 2026-01-04  
**Status:** 🚧 Planning

---

## 📋 Executive Summary

Este documento descreve a arquitetura de autenticação multi-camadas para o Tampa APP, projetada especificamente para o cenário de **tablets compartilhados em cozinhas de restaurantes**.

### Cenário Real
- **Tablets fixos nas estações da cozinha** (logados persistentemente)
- **Contas compartilhadas** (cook@restaurant.com, barista@restaurant.com)
- **Identificação individual** para rastreabilidade e compliance
- **Proteção de dados pessoais** com PINs individuais

---

## 🏗️ Arquitetura em Camadas

### 📊 Diagrama de Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 1: System Access                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  auth.users + profiles + user_roles                   │  │
│  │  - Contas compartilhadas: cook@restaurant.com         │  │
│  │  - Roles do sistema: admin, manager, leader_chef      │  │
│  │  - Login persistente nos tablets                      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 LAYER 2: Individual Identity                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  team_members                                         │  │
│  │  - Identidades operacionais individuais               │  │
│  │  - Seleção via UserSelectionDialog                    │  │
│  │  - PIN de 4 dígitos para edição de perfil próprio    │  │
│  │  - Associação a routine tasks e labeling              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              LAYER 3: Organizational Structure              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  locations + departments (future)                     │  │
│  │  - Amarrados aos users da organização                 │  │
│  │  - Hierarquia física do estabelecimento               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 LAYER 1: System Access (user_roles)

### Propósito
Controlar **acesso ao sistema** e **permissões administrativas**.

### Estrutura Atual

#### Tabela: `user_roles`
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id), -- Login real
  role app_role NOT NULL, -- 'admin' | 'manager' | 'leader_chef' | 'staff'
  created_at TIMESTAMPTZ,
  created_by UUID
);
```

### Fluxo de Login
```
1. Tablet inicia → cook@restaurant.com já está logado
2. Sistema verifica user_roles → obtém permissões
3. Se role = 'admin' → acesso completo
4. Se role = 'staff' → acesso limitado
```

### Roles e Permissões

| Role | Descrição | Permissões |
|------|-----------|-----------|
| **admin** | Administrador do sistema | • Gerenciar team_members<br>• Gerenciar routine tasks<br>• Configurar sistema<br>• Acessar todos módulos |
| **manager** | Gerente/Supervisor | • Gerenciar team_members<br>• Gerenciar routine tasks<br>• Ver relatórios<br>• Aprovar tarefas |
| **leader_chef** | Chef de cozinha | • Criar team_members<br>• Atribuir routine tasks<br>• Ver relatórios de equipe |
| **staff** | Usuário comum | • Selecionar team_member<br>• Executar tarefas<br>• Ver próprio perfil (com PIN) |

---

## 👥 LAYER 2: Individual Identity (team_members)

### Propósito
Identificar **quem realmente executa** as tarefas operacionais.

### Estrutura Atual

#### Tabela: `team_members`
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  
  -- Personal Info
  display_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT, -- "Head Chef", "Line Cook", "Barista"
  
  -- Employment
  hire_date DATE,
  department_id UUID,
  role_type team_member_role, -- 'cook' | 'barista' | 'manager' | 'leader_chef' | 'admin'
  is_active BOOLEAN DEFAULT true,
  
  -- Authentication Link
  auth_role_id UUID REFERENCES profiles(user_id), -- Opcional
  pin_hash TEXT, -- PIN de 4 dígitos (hashed)
  
  -- Profile Tracking
  profile_complete BOOLEAN DEFAULT false,
  required_fields_missing TEXT[],
  
  -- Organization
  organization_id UUID NOT NULL,
  location_id UUID,
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Separação de Conceitos

| Campo | Uso Atual | Novo Uso |
|-------|-----------|----------|
| **auth_role_id** | ❌ Confuso (referencia profiles.user_id) | ✅ Opcional: link para conta compartilhada que criou o membro |
| **pin_hash** | ✅ Correto | ✅ PIN individual para edição do próprio perfil |
| **role_type** | ✅ Correto | ✅ Tipo operacional (cook, barista, etc) - NÃO é role de sistema |

### Fluxo de Identificação
```
1. Conta compartilhada já está logada no tablet
2. Sistema abre UserSelectionDialog
3. Usuário seleciona seu team_member (ex: "João Silva - Cook")
4. Sistema armazena team_member_id na sessão local
5. Todas ações são atribuídas a este team_member_id
```

### Proteção de Perfil com PIN

#### Cenário: Usuário Comum (staff) edita próprio perfil
```
1. João (team_member) quer editar seu telefone
2. Sistema verifica:
   - auth_role_id do João == current user_id? ❌ Não, conta compartilhada
   - current user_role == 'admin' ou 'manager'? ❌ Não, é 'staff'
3. Sistema solicita PIN de 4 dígitos
4. João digita PIN → Sistema valida pin_hash
5. Se correto → permite edição
6. Se incorreto → bloqueia
```

#### Cenário: Admin edita qualquer perfil
```
1. Admin Maria quer editar perfil do João
2. Sistema verifica:
   - current user_role == 'admin'? ✅ Sim
3. Sistema permite edição sem solicitar PIN
```

---

## 🔄 Integração com Módulos

### 🏷️ Labeling Module
```typescript
// UserSelectionDialog já implementado
<UserSelectionDialog
  open={showDialog}
  onSelectUser={(teamMember) => {
    // Salva team_member.id no label
    setSelectedPreparer(teamMember);
  }}
/>
```

**Fluxo:**
1. Usuário seleciona produto para imprimir label
2. Sistema abre UserSelectionDialog
3. Usuário seleciona quem está preparando
4. Label é impresso com team_member.display_name

### 📋 Routine Tasks Module
```sql
-- Adicionar team_member_id obrigatório
ALTER TABLE routine_task_assignments 
ADD COLUMN team_member_id UUID NOT NULL REFERENCES team_members(id);

ALTER TABLE routine_task_completions 
ADD COLUMN team_member_id UUID NOT NULL REFERENCES team_members(id);
```

**Fluxo:**
1. Tarefa é criada por admin/manager
2. Sistema requer seleção de team_member para atribuição
3. Team_member completa tarefa
4. Sistema registra completion com team_member_id

### 👥 People Module
```typescript
// Adicionar validação de PIN para edição
interface EditProfileProps {
  teamMember: TeamMember;
  currentUserRole: app_role;
}

function EditProfile({ teamMember, currentUserRole }) {
  // Se é admin/manager → edita sem PIN
  if (['admin', 'manager'].includes(currentUserRole)) {
    return <EditForm />;
  }
  
  // Se é staff → solicita PIN primeiro
  return (
    <>
      <PINValidationDialog
        onValidated={() => setCanEdit(true)}
        expectedHash={teamMember.pin_hash}
      />
      {canEdit && <EditForm />}
    </>
  );
}
```

---

## 🛡️ RLS Policies

### team_members - Leitura
```sql
-- Todos da organização podem ver team members ativos
CREATE POLICY "view_team_members_in_org"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
    AND is_active = true
  );
```

### team_members - Criação
```sql
-- Apenas admin/manager/leader_chef podem criar
CREATE POLICY "create_team_members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT p.organization_id 
      FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.user_id
      WHERE p.user_id = auth.uid()
        AND ur.role IN ('admin', 'manager', 'leader_chef')
    )
  );
```

### team_members - Edição
```sql
-- Admin/manager podem editar qualquer perfil da org
CREATE POLICY "admin_edit_team_members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT p.organization_id 
      FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.user_id
      WHERE p.user_id = auth.uid()
        AND ur.role IN ('admin', 'manager')
    )
  );

-- NOTA: Validação de PIN é feita na aplicação, não no RLS
-- RLS não consegue validar PIN, então:
-- - Admin/manager: passa pelo RLS
-- - Staff: passa pelo RLS MAS aplicação valida PIN antes de submeter
```

### routine_task_assignments - Criação
```sql
-- Requer team_member_id e organização válida
CREATE POLICY "create_task_assignments"
  ON routine_task_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Validar que team_member pertence à mesma org
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.id = routine_task_assignments.team_member_id
        AND tm.organization_id IN (
          SELECT organization_id FROM profiles WHERE user_id = auth.uid()
        )
    )
  );
```

---

## 🚀 Implementação - Fases

### ✅ Fase 0: Foundation (Completo)
- [x] Tabela `team_members` criada
- [x] RLS policies básicas implementadas
- [x] `UserSelectionDialog` funcional
- [x] PIN hash utilities (`pinUtils.ts`)

### 🔄 Fase 1: Core Integration (Em Progresso)
- [ ] 1.1: Ajustar `TeamMemberFilters` para incluir `organization_id`
- [ ] 1.2: Atualizar RLS policies com validações de `user_roles`
- [ ] 1.3: Documentar fluxo de autenticação nos componentes
- [ ] 1.4: Criar hook `useCurrentTeamMember` para sessão local

### 📋 Fase 2: Routine Tasks Integration
- [ ] 2.1: Tornar `team_member_id` obrigatório em `routine_task_assignments`
- [ ] 2.2: Adicionar `UserSelectionDialog` ao criar/atribuir tasks
- [ ] 2.3: Atualizar UI para mostrar `team_member.display_name` em vez de `user.email`
- [ ] 2.4: Migrar tasks existentes (associar a team_members padrão)

### 🔒 Fase 3: PIN Protection
- [ ] 3.1: Criar `PINValidationDialog` component
- [ ] 3.2: Adicionar validação de PIN no People Module
- [ ] 3.3: Implementar lógica: admin bypass, staff requer PIN
- [ ] 3.4: Adicionar UI para mudar PIN (requer PIN antigo)

### 🏢 Fase 4: Locations & Departments (Futuro)
- [ ] 4.1: Criar tabela `locations`
- [ ] 4.2: Criar tabela `departments`
- [ ] 4.3: Amarrar a `user_roles` (organização)
- [ ] 4.4: Adicionar filtros por location/department

---

## 🎯 Decisões de Arquitetura

### ✅ DO's

1. **Separar Autenticação de Identidade**
   - `user_roles` = login e permissões do sistema
   - `team_members` = identidade operacional real

2. **PIN para Proteção Individual**
   - Cada team_member tem seu PIN
   - Apenas para editar próprio perfil (staff)
   - Admins não precisam de PIN

3. **Seleção Explícita de Team Member**
   - `UserSelectionDialog` em todos workflows operacionais
   - Armazenar `team_member_id` em todas operações (labels, tasks, etc)

4. **RLS Baseado em Organização**
   - Todas queries filtradas por `organization_id`
   - Isolamento total entre organizações

5. **Roles Hierárquicos**
   - admin > manager > leader_chef > staff
   - Roles superiores podem fazer tudo dos inferiores

### ❌ DON'Ts

1. **Não usar `auth_role_id` para autenticação operacional**
   - É apenas referência histórica (quem criou)
   - NÃO usar para controle de acesso

2. **Não misturar `role_type` com `user_roles.role`**
   - `role_type` = tipo operacional (cook, barista)
   - `user_roles.role` = role do sistema (admin, staff)

3. **Não validar PIN no RLS**
   - RLS não tem acesso ao PIN digitado
   - Validação deve ser na aplicação (frontend/backend)

4. **Não permitir edição cross-organization**
   - Sempre validar `organization_id` em todas operações

---

## 📝 Exemplos de Código

### Hook: useCurrentTeamMember
```typescript
// src/hooks/useCurrentTeamMember.ts
import { useState, useEffect } from 'react';
import { TeamMember } from '@/types/teamMembers';

export const useCurrentTeamMember = () => {
  const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);
  
  useEffect(() => {
    // Carregar do localStorage (sessão do tablet)
    const stored = localStorage.getItem('current_team_member');
    if (stored) {
      setCurrentMember(JSON.parse(stored));
    }
  }, []);
  
  const selectTeamMember = (member: TeamMember) => {
    setCurrentMember(member);
    localStorage.setItem('current_team_member', JSON.stringify(member));
  };
  
  const clearTeamMember = () => {
    setCurrentMember(null);
    localStorage.removeItem('current_team_member');
  };
  
  return { currentMember, selectTeamMember, clearTeamMember };
};
```

### Component: PINValidationDialog
```typescript
// src/components/auth/PINValidationDialog.tsx
interface PINValidationDialogProps {
  open: boolean;
  onValidated: () => void;
  onCancel: () => void;
  expectedHash: string;
}

export function PINValidationDialog({ 
  open, 
  onValidated, 
  onCancel, 
  expectedHash 
}: PINValidationDialogProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  
  const handleValidate = async () => {
    const inputHash = await hashPIN(pin);
    if (inputHash === expectedHash) {
      onValidated();
    } else {
      setError('PIN incorreto');
      setPin('');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Validação de PIN</DialogTitle>
          <DialogDescription>
            Digite seu PIN de 4 dígitos para editar seu perfil
          </DialogDescription>
        </DialogHeader>
        <PinInput
          value={pin}
          onChange={setPin}
          onComplete={handleValidate}
          error={error}
        />
      </DialogContent>
    </Dialog>
  );
}
```

### RLS Function: validate_team_member_edit
```sql
-- Função auxiliar para validar edição de team_member
CREATE OR REPLACE FUNCTION validate_team_member_edit(
  target_member_id UUID,
  editor_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  editor_role app_role;
  same_org BOOLEAN;
BEGIN
  -- Buscar role do editor
  SELECT ur.role INTO editor_role
  FROM user_roles ur
  WHERE ur.user_id = editor_user_id
  LIMIT 1;
  
  -- Admin/manager podem editar qualquer um da org
  IF editor_role IN ('admin', 'manager') THEN
    -- Validar mesma organização
    SELECT EXISTS (
      SELECT 1 FROM team_members tm
      JOIN profiles p ON p.organization_id = tm.organization_id
      WHERE tm.id = target_member_id
        AND p.user_id = editor_user_id
    ) INTO same_org;
    
    RETURN same_org;
  END IF;
  
  -- Staff não pode editar via SQL direto
  -- (validação de PIN é na aplicação)
  RETURN FALSE;
END;
$$;
```

---

## 🧪 Cenários de Teste

### Teste 1: Login e Seleção
```
✓ Tablet inicia com cook@restaurant.com logado
✓ Sistema mostra UserSelectionDialog
✓ Lista exibe todos team_members ativos da organização
✓ Usuário seleciona "João Silva - Cook"
✓ Sistema armazena no localStorage
✓ Dashboard mostra "Logged as: João Silva"
```

### Teste 2: Criar Label (Labeling Module)
```
✓ João seleciona produto "Chicken Breast"
✓ Sistema abre UserSelectionDialog
✓ João seleciona a si mesmo
✓ Label é criada com prepared_by = João's team_member_id
✓ Label impressa mostra "Prepared by: João Silva"
```

### Teste 3: Editar Perfil (Staff com PIN)
```
✓ João acessa People → Seu perfil
✓ João clica "Edit"
✓ Sistema detecta: role = 'staff'
✓ Sistema abre PINValidationDialog
✓ João digita PIN "1234"
✓ Sistema valida hash
✗ PIN incorreto → erro, tenta novamente
✓ PIN correto → abre formulário de edição
✓ João altera telefone e salva
```

### Teste 4: Editar Perfil (Admin sem PIN)
```
✓ Maria (admin) acessa People → Perfil do João
✓ Maria clica "Edit"
✓ Sistema detecta: role = 'admin'
✓ Sistema abre formulário direto (sem PIN)
✓ Maria altera telefone do João e salva
```

### Teste 5: Atribuir Routine Task
```
✓ Manager Carlos acessa Routine Tasks
✓ Carlos cria task "Clean Grill - 14:00"
✓ Sistema requer seleção de team_member
✓ Carlos abre UserSelectionDialog
✓ Carlos seleciona "João Silva - Cook"
✓ Task é criada com team_member_id = João
✓ João vê task na sua lista
✓ João completa task
✓ Sistema registra completion com João's team_member_id
```

### Teste 6: Isolamento de Organização
```
✓ Restaurant A tem team_members: João, Maria, Pedro
✓ Restaurant B tem team_members: Ana, Carlos
✓ João (Restaurant A) faz login
✓ UserSelectionDialog mostra apenas João, Maria, Pedro
✗ Não mostra Ana, Carlos (Restaurant B)
✓ Todas queries filtradas por organization_id
```

---

## 📊 Métricas de Sucesso

| Métrica | Alvo | Status |
|---------|------|--------|
| Tempo médio de seleção de team_member | < 5 segundos | ⏳ A medir |
| Taxa de erro de PIN | < 5% | ⏳ A medir |
| Tasks com team_member atribuído | 100% | 🎯 Objetivo |
| Labels com prepared_by preenchido | 100% | ✅ Funcional |
| Violações de isolamento cross-org | 0 | 🛡️ Garantido por RLS |

---

## 🔮 Roadmap Futuro

### Curto Prazo (1-2 semanas)
- [ ] Implementar Fase 1 (Core Integration)
- [ ] Implementar Fase 2 (Routine Tasks)
- [ ] Implementar Fase 3 (PIN Protection)

### Médio Prazo (1 mês)
- [ ] Implementar Fase 4 (Locations & Departments)
- [ ] Adicionar biometria (opcional) para team_members
- [ ] Dashboard de produtividade por team_member

### Longo Prazo (3+ meses)
- [ ] Integração com relógio de ponto
- [ ] Relatórios de compliance com rastreabilidade individual
- [ ] App mobile para team_members consultarem suas tarefas

---

## 📚 Referências

- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [FDA Food Traceability Requirements](https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-requirements-additional-traceability-records-certain-foods)
- [Multi-tenant Architecture Patterns](https://aws.amazon.com/blogs/apn/multi-tenant-saas-patterns/)

---

**Autor:** Tampa APP Development Team  
**Revisão:** Pending  
**Próxima Revisão:** Após Fase 3 completada
