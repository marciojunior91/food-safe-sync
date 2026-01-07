# 🚀 Próximos Passos - Implementação Team Members

**Data:** 2026-01-04  
**Status:** 🟢 Pronto para Testes

---

## ✅ O Que Já Foi Feito

### 1. **Arquitetura e Documentação** 📚
- ✅ `AUTHENTICATION_ARCHITECTURE.md` - Arquitetura completa
- ✅ `AUTHENTICATION_IMPLEMENTATION_COMPLETE.md` - Guia de implementação
- ✅ `MIGRATIONS_SYNC_STATUS.md` - Status de sincronização

### 2. **Database - Migrations Aplicadas** 🗄️
- ✅ `20260104000000_add_team_members_to_routine_tasks.sql`
- ✅ `20260104000001_enhance_team_members_auth.sql`
- ✅ `20260104000002_make_team_member_mandatory_routine_tasks.sql`

### 3. **Backend - Hooks React** 🪝
- ✅ `useCurrentTeamMember.ts` - Sessão do tablet
- ✅ `useUserRole.ts` - Roles do sistema
- ✅ `useTeamMembers.ts` - CRUD de team members

### 4. **Frontend - Componentes UI** 🎨
- ✅ `UserSelectionDialog.tsx` - Seleção de team member
- ✅ `PINValidationDialog.tsx` - Validação de PIN
- ✅ `TeamMemberEditDialog.tsx` - Edição de perfil

### 5. **Seed Data Criado** 🌱
- ✅ `seed_test_team_members.sql` - 10 team members de teste

---

## 📋 Próximos Passos (Em Ordem)

### **PASSO 1: Inserir Team Members de Teste** 🌱

#### 1.1. Executar Script de Seed
```bash
cd "c:\Users\Marci\OneDrive\Área de Trabalho\Tampa APP\Tampa APP"

# Via Supabase CLI
npx supabase@latest db execute -f supabase/seeds/seed_test_team_members.sql
```

**OU** copiar e colar o conteúdo de `supabase/seeds/seed_test_team_members.sql` no SQL Editor do Supabase Dashboard.

#### 1.2. Verificar Inserção
```sql
-- Verificar team members criados
SELECT 
  display_name, 
  position, 
  role_type, 
  email, 
  is_active, 
  profile_complete
FROM team_members
WHERE organization_id = (
  SELECT id FROM organizations 
  WHERE slug = 'tampa-test-restaurant'
)
ORDER BY role_type, display_name;
```

#### 1.3. Team Members de Teste Criados

| Nome | Cargo | Role | PIN | Uso |
|------|-------|------|-----|-----|
| João Silva | Head Chef | admin | 1234 | Testar admin sem PIN |
| Maria Santos | Kitchen Manager | manager | 5678 | Testar manager sem PIN |
| Carlos Oliveira | Sous Chef | leader_chef | 9999 | Testar leader_chef |
| Ana Costa | Line Cook | cook | 1111 | Testar staff com PIN |
| Pedro Almeida | Line Cook | cook | 2222 | Testar staff com PIN |
| Lucia Fernandes | Prep Cook | cook | 3333 | Testar staff com PIN |
| Roberto Lima | Head Barista | barista | 4444 | Testar barista |
| Sofia Rodrigues | Barista | barista | 5555 | Testar barista |
| Teste Incomplete | N/A | cook | 0000 | Testar perfil incompleto |
| Ex-Employee Test | Former Cook | cook | N/A | Testar filtro de inativos |

---

### **PASSO 2: Criar User Roles para Testes** 👤

Para testar o fluxo completo, precisamos vincular user_roles aos team members:

```sql
-- Script para criar user_roles de teste
-- Execute no SQL Editor do Supabase

-- 1. Criar usuário admin de teste (se ainda não existir)
-- Nota: Você precisará do user_id real do auth.users
-- Este é um exemplo - ajuste com seus IDs reais

-- Obter IDs dos team members
DO $$
DECLARE
  admin_member_id UUID;
  manager_member_id UUID;
  staff_member_id UUID;
  test_user_id UUID;
BEGIN
  -- Pegar IDs dos team members
  SELECT id INTO admin_member_id 
  FROM team_members 
  WHERE display_name = 'João Silva' 
  LIMIT 1;
  
  SELECT id INTO manager_member_id 
  FROM team_members 
  WHERE display_name = 'Maria Santos' 
  LIMIT 1;
  
  SELECT id INTO staff_member_id 
  FROM team_members 
  WHERE display_name = 'Ana Costa' 
  LIMIT 1;
  
  -- Pegar user_id atual autenticado (você)
  SELECT auth.uid() INTO test_user_id;
  
  RAISE NOTICE 'Admin Member ID: %', admin_member_id;
  RAISE NOTICE 'Manager Member ID: %', manager_member_id;
  RAISE NOTICE 'Staff Member ID: %', staff_member_id;
  RAISE NOTICE 'Current User ID: %', test_user_id;
  
  -- Você pode atualizar manualmente os auth_role_id depois
END $$;
```

---

### **PASSO 3: Testar Hooks no Frontend** 🧪

#### 3.1. Testar useCurrentTeamMember

Criar um componente de teste temporário:

```typescript
// src/components/test/TestCurrentTeamMember.tsx
import { useCurrentTeamMember } from '@/hooks/useCurrentTeamMember';
import { UserSelectionDialog } from '@/components/labels/UserSelectionDialog';
import { Button } from '@/components/ui/button';

export function TestCurrentTeamMember() {
  const { 
    currentMember, 
    selectTeamMember, 
    clearTeamMember,
    isTeamMemberSelected 
  } = useCurrentTeamMember();

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">Test Current Team Member</h2>
      
      {currentMember ? (
        <div className="border p-4 rounded space-y-2">
          <p><strong>Selected:</strong> {currentMember.display_name}</p>
          <p><strong>Position:</strong> {currentMember.position}</p>
          <p><strong>Role:</strong> {currentMember.role_type}</p>
          <p><strong>Email:</strong> {currentMember.email}</p>
          <Button onClick={clearTeamMember}>Clear Selection</Button>
        </div>
      ) : (
        <div>
          <p>No team member selected</p>
          <UserSelectionDialog
            open={!isTeamMemberSelected}
            onOpenChange={() => {}}
            onSelectUser={selectTeamMember}
          />
        </div>
      )}
    </div>
  );
}
```

#### 3.2. Testar useUserRole

```typescript
// src/components/test/TestUserRole.tsx
import { useUserRole } from '@/hooks/useUserRole';

export function TestUserRole() {
  const { 
    role, 
    loading, 
    isAdmin, 
    isManager, 
    canManageTeamMembers,
    canEditWithoutPIN 
  } = useUserRole();

  if (loading) return <div>Loading role...</div>;

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">Test User Role</h2>
      
      <div className="border p-4 rounded space-y-2">
        <p><strong>Current Role:</strong> {role || 'No role'}</p>
        <p><strong>Is Admin:</strong> {isAdmin ? '✅' : '❌'}</p>
        <p><strong>Is Manager:</strong> {isManager ? '✅' : '❌'}</p>
        <p><strong>Can Manage Team Members:</strong> {canManageTeamMembers ? '✅' : '❌'}</p>
        <p><strong>Can Edit Without PIN:</strong> {canEditWithoutPIN ? '✅' : '❌'}</p>
      </div>
    </div>
  );
}
```

#### 3.3. Testar PINValidationDialog

```typescript
// src/components/test/TestPINValidation.tsx
import { useState } from 'react';
import { PINValidationDialog } from '@/components/auth/PINValidationDialog';
import { Button } from '@/components/ui/button';

export function TestPINValidation() {
  const [showDialog, setShowDialog] = useState(false);
  
  // Hash do PIN 1234 (para João Silva)
  const testPinHash = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

  const handleValidated = () => {
    alert('PIN validado com sucesso!');
  };

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">Test PIN Validation</h2>
      
      <div className="space-y-2">
        <p>Test PIN: <strong>1234</strong></p>
        <Button onClick={() => setShowDialog(true)}>
          Open PIN Dialog
        </Button>
      </div>

      <PINValidationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onValidated={handleValidated}
        expectedHash={testPinHash}
      />
    </div>
  );
}
```

---

### **PASSO 4: Adicionar Rota de Testes** 🛣️

```typescript
// src/pages/TestTeamMembers.tsx
import { TestCurrentTeamMember } from '@/components/test/TestCurrentTeamMember';
import { TestUserRole } from '@/components/test/TestUserRole';
import { TestPINValidation } from '@/components/test/TestPINValidation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TestTeamMembers() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Team Members - Tests</h1>
      
      <Tabs defaultValue="current-member">
        <TabsList>
          <TabsTrigger value="current-member">Current Member</TabsTrigger>
          <TabsTrigger value="user-role">User Role</TabsTrigger>
          <TabsTrigger value="pin-validation">PIN Validation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current-member">
          <TestCurrentTeamMember />
        </TabsContent>
        
        <TabsContent value="user-role">
          <TestUserRole />
        </TabsContent>
        
        <TabsContent value="pin-validation">
          <TestPINValidation />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

Adicionar rota em `App.tsx` ou router:
```typescript
<Route path="/test-team-members" element={<TestTeamMembers />} />
```

---

### **PASSO 5: Integrar nos Módulos Existentes** 🔄

#### 5.1. Labeling Module

O `UserSelectionDialog` já está integrado. Testar:

1. Abrir módulo de Labeling
2. Tentar criar um label
3. Verificar se aparece UserSelectionDialog
4. Selecionar um team member
5. Verificar se o label é criado com `prepared_by`

#### 5.2. People Module

Integrar o `TeamMemberEditDialog`:

```typescript
// Em src/pages/People.tsx ou PeopleModule.tsx
import { TeamMemberEditDialog } from '@/components/people/TeamMemberEditDialog';
import { useCurrentTeamMember } from '@/hooks/useCurrentTeamMember';

// No componente
const { currentMember } = useCurrentTeamMember();
const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

// Na UI
<TeamMemberEditDialog
  open={editingMember !== null}
  onOpenChange={(open) => !open && setEditingMember(null)}
  teamMember={editingMember}
  currentTeamMemberId={currentMember?.id}
/>
```

#### 5.3. Routine Tasks Module (Futuro)

Adicionar `UserSelectionDialog` ao criar/atribuir tasks.

---

### **PASSO 6: Cenários de Teste Manual** ✅

#### Cenário 1: Seleção de Team Member
```
1. ✅ Abrir aplicação (sem team member selecionado)
2. ✅ Sistema abre UserSelectionDialog automaticamente
3. ✅ Lista mostra 9 team members ativos (exceto Ex-Employee)
4. ✅ Selecionar "Ana Costa - Line Cook"
5. ✅ Verificar que foi salvo no localStorage
6. ✅ Recarregar página
7. ✅ Verificar que Ana Costa ainda está selecionada
```

#### Cenário 2: Staff Edita Próprio Perfil com PIN
```
1. ✅ Login com conta staff
2. ✅ Selecionar "Ana Costa" como current member
3. ✅ Navegar para People Module
4. ✅ Clicar "Edit" no perfil de Ana Costa
5. ✅ Sistema deve pedir PIN
6. ✅ Digitar PIN errado (0000) → Ver erro
7. ✅ Digitar PIN correto (1111) → Formulário abre
8. ✅ Alterar telefone e salvar
9. ✅ Verificar que salvou
```

#### Cenário 3: Admin Edita Perfil Sem PIN
```
1. ✅ Login com conta admin
2. ✅ Selecionar "João Silva" como current member
3. ✅ Navegar para People Module
4. ✅ Clicar "Edit" em qualquer perfil (ex: Ana Costa)
5. ✅ Sistema NÃO deve pedir PIN
6. ✅ Formulário abre direto
7. ✅ Alterar dados e salvar
8. ✅ Verificar que salvou
```

#### Cenário 4: Criar Label com Team Member
```
1. ✅ Selecionar team member
2. ✅ Navegar para Labeling Module
3. ✅ Selecionar produto
4. ✅ Sistema abre UserSelectionDialog para "prepared_by"
5. ✅ Selecionar team member
6. ✅ Criar label
7. ✅ Verificar que label tem prepared_by correto
```

#### Cenário 5: Perfil Incompleto
```
1. ✅ Verificar que "Teste Incomplete" aparece na lista
2. ✅ Verificar badge/indicador de perfil incompleto
3. ✅ Abrir perfil
4. ✅ Ver campos faltantes destacados
5. ✅ Completar campos
6. ✅ Salvar
7. ✅ Verificar que profile_complete = true
```

---

## 🐛 Troubleshooting

### Problema: Team members não aparecem no UserSelectionDialog

**Possíveis causas:**
- Organization_id não configurada corretamente
- RLS policies bloqueando acesso
- Team members não foram criados

**Solução:**
```sql
-- Verificar organization_id do usuário atual
SELECT 
  p.user_id,
  p.organization_id,
  o.name as org_name
FROM profiles p
JOIN organizations o ON o.id = p.organization_id
WHERE p.user_id = auth.uid();

-- Verificar team members da organização
SELECT * FROM team_members 
WHERE organization_id = (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
);
```

### Problema: PIN validation não funciona

**Possíveis causas:**
- PIN não está sendo hasheado corretamente
- Hash armazenado no banco não corresponde

**Solução:**
```typescript
// Verificar hash do PIN
import { hashPIN } from '@/utils/pinUtils';

const testPin = '1234';
const hash = await hashPIN(testPin);
console.log('Hash:', hash);

// Comparar com hash no banco
```

### Problema: RLS bloqueando operações

**Solução:**
```sql
-- Verificar policies da tabela
SELECT * FROM pg_policies WHERE tablename = 'team_members';

-- Verificar user_roles do usuário
SELECT * FROM user_roles WHERE user_id = auth.uid();
```

---

## 📊 Checklist de Validação Final

- [ ] **Database**
  - [ ] Seed script executado com sucesso
  - [ ] 10 team members criados
  - [ ] user_roles configurados para teste

- [ ] **Frontend - Hooks**
  - [ ] useCurrentTeamMember salva e recupera do localStorage
  - [ ] useUserRole retorna role correto
  - [ ] useTeamMembers lista team members da organização

- [ ] **Frontend - Componentes**
  - [ ] UserSelectionDialog lista team members
  - [ ] PINValidationDialog valida PIN corretamente
  - [ ] TeamMemberEditDialog mostra PIN dialog condicionalmente

- [ ] **Integração - Labeling**
  - [ ] UserSelectionDialog aparece ao criar label
  - [ ] Label salva com prepared_by correto

- [ ] **Integração - People**
  - [ ] Lista team members
  - [ ] Edição com PIN para staff
  - [ ] Edição sem PIN para admin/manager

- [ ] **Segurança**
  - [ ] RLS isola team members por organização
  - [ ] Admin pode editar qualquer perfil
  - [ ] Staff só edita próprio perfil com PIN

---

## 🎯 Métricas de Sucesso

| Métrica | Alvo | Como Medir |
|---------|------|------------|
| Tempo de seleção | < 5 seg | Cronometrar seleção de team member |
| Taxa de erro PIN | < 5% | Contar tentativas falhas / total |
| Labels com prepared_by | 100% | Query no banco |
| Isolamento org | 0 vazamentos | Tentar acessar team members de outra org |

---

## 📚 Documentação Relacionada

- [AUTHENTICATION_ARCHITECTURE.md](./AUTHENTICATION_ARCHITECTURE.md)
- [AUTHENTICATION_IMPLEMENTATION_COMPLETE.md](./AUTHENTICATION_IMPLEMENTATION_COMPLETE.md)
- [MIGRATIONS_SYNC_STATUS.md](./MIGRATIONS_SYNC_STATUS.md)
- [TEAM_MEMBERS_ARCHITECTURE.md](./TEAM_MEMBERS_ARCHITECTURE.md)

---

**Próximo Check-Point:** Após completar PASSO 1-3, validar se hooks e componentes funcionam corretamente antes de integrar nos módulos.

**Estimativa de Tempo:**
- PASSO 1: 15 min
- PASSO 2: 15 min
- PASSO 3-4: 1 hora
- PASSO 5: 2 horas
- PASSO 6: 1 hora

**Total:** ~4.5 horas de desenvolvimento e testes
