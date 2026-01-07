# Atualização Completa - Sistema de Team Members

## ✅ O que foi feito

### 1. Sincronização de Migrações ✅

**Problema**: Você aplicou as migrações manualmente via SQL Editor, mas o Supabase CLI local não sabia disso.

**Solução**: Usamos `supabase migration repair` para sincronizar:
```powershell
# Executado com sucesso
npx supabase migration repair --status applied 20260103000000
npx supabase migration repair --status applied 20260103000001
```

**Resultado**:
```
   Local          | Remote         | Time (UTC)
  ----------------|----------------|---------------------
   20260103000000 | 20260103000000 | 2026-01-03 00:00:00 ✓
   20260103000001 | 20260103000001 | 2026-01-03 00:00:01 ✓
```

Agora futuras migrações com `npx supabase db push` funcionarão perfeitamente!

---

### 2. Atualização do useAuth Hook ✅

**Arquivo**: `src/hooks/useAuth.tsx`

**Alterações**:

#### Novos imports:
```typescript
import type { TeamMember } from '@/types/teamMembers';
```

#### Interface estendida:
```typescript
interface AuthContextType {
  // ... campos existentes
  selectedTeamMember: TeamMember | null;
  selectTeamMember: (member: TeamMember) => void;
  clearTeamMember: () => void;
  isSharedAccount: boolean;
}
```

#### Novo estado:
```typescript
// Persiste no sessionStorage
const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(() => {
  const stored = sessionStorage.getItem('selected_team_member');
  return stored ? JSON.parse(stored) : null;
});

// Detecta conta compartilhada (cook@, barista@, etc)
const [isSharedAccount, setIsSharedAccount] = useState(false);
```

#### Nova lógica no auth listener:
```typescript
// Detecta automaticamente se é conta compartilhada
if (session?.user?.email) {
  const email = session.user.email.toLowerCase();
  const sharedAccountPrefixes = ['cook@', 'barista@', 'manager@', 'chef@'];
  setIsSharedAccount(sharedAccountPrefixes.some(prefix => email.startsWith(prefix)));
}

// Limpa team member ao fazer logout
if (event === 'SIGNED_OUT') {
  setSelectedTeamMember(null);
  sessionStorage.removeItem('selected_team_member');
}
```

#### Novas funções:
```typescript
const selectTeamMember = (member: TeamMember) => {
  setSelectedTeamMember(member);
  sessionStorage.setItem('selected_team_member', JSON.stringify(member));
};

const clearTeamMember = () => {
  setSelectedTeamMember(null);
  sessionStorage.removeItem('selected_team_member');
};
```

---

## 🎯 Como Usar Agora

### Em qualquer componente:

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { 
    user,                  // Usuário autenticado (conta compartilhada)
    selectedTeamMember,    // Membro da equipe selecionado
    selectTeamMember,      // Função para selecionar membro
    clearTeamMember,       // Função para limpar seleção
    isSharedAccount        // Se é conta compartilhada
  } = useAuth();
  
  if (isSharedAccount && !selectedTeamMember) {
    return <TeamMemberSelector ... />;
  }
  
  return (
    <div>
      {isSharedAccount ? (
        <p>Logged in as: {selectedTeamMember?.display_name}</p>
      ) : (
        <p>Logged in as: {user?.email}</p>
      )}
    </div>
  );
}
```

---

## 📋 Próximos Passos

### 1. Integrar TeamMemberSelector no Fluxo de Auth

**Arquivo a modificar**: `src/App.tsx` ou arquivo de rotas

**O que fazer**:
- Adicionar rota `/select-team-member`
- Redirecionar contas compartilhadas após login
- Salvar seleção no contexto

**Exemplo**:
```typescript
// Após login bem-sucedido
const handleLoginSuccess = async () => {
  if (isSharedAccount && !selectedTeamMember) {
    navigate('/select-team-member');
  } else {
    navigate('/dashboard');
  }
};

// Nova rota
<Route 
  path="/select-team-member" 
  element={
    <TeamMemberSelector
      authRoleId={user!.id}
      organizationId={user!.user_metadata.organization_id}
      onSelect={(member) => {
        selectTeamMember(member);
        navigate('/dashboard');
      }}
      onCancel={() => {
        signOut();
        navigate('/login');
      }}
    />
  } 
/>
```

---

### 2. Adicionar "Switch Profile" no User Menu

**Onde**: Dropdown do usuário no Layout/Header

```typescript
{isSharedAccount && (
  <DropdownMenuItem onClick={() => navigate('/select-team-member')}>
    <Users className="mr-2 h-4 w-4" />
    Switch Profile
  </DropdownMenuItem>
)}
```

---

### 3. Refatorar Módulo People

**Arquivos a modificar**:
- `src/pages/PeopleModule.tsx`
- `src/components/people/PeopleList.tsx`
- `src/components/people/UserProfile.tsx`
- `src/components/people/EditUserDialog.tsx`

**Mudanças principais**:
- Trocar `usePeople` por `useTeamMembers`
- Adicionar verificação de PIN para auto-edição
- Mostrar dados de `team_members` ao invés de `profiles`

---

## 🔄 Fluxo Completo do Sistema

### Login com Conta Compartilhada:

```
1. Usuário faz login com cook@restaurant.com
   ↓
2. useAuth detecta isSharedAccount = true
   ↓
3. App redireciona para /select-team-member
   ↓
4. TeamMemberSelector mostra lista de cozinheiros
   ↓
5. Usuário clica em seu nome
   ↓
6. PINInput dialog aparece
   ↓
7. Usuário digita PIN de 4 dígitos
   ↓
8. Sistema verifica PIN via RPC (verify_team_member_pin)
   ↓
9. Se correto: selectTeamMember(member) + sessionStorage
   ↓
10. Redireciona para dashboard
   ↓
11. selectedTeamMember disponível em toda app via useAuth
```

### Trocar de Perfil:

```
1. Usuário clica em "Switch Profile" no menu
   ↓
2. Redireciona para /select-team-member
   ↓
3. Repete processo de seleção + PIN
   ↓
4. sessionStorage atualizado com novo membro
   ↓
5. App re-renderiza com novo contexto
```

### Logout:

```
1. Usuário clica em "Logout"
   ↓
2. signOut() é chamado
   ↓
3. selectedTeamMember = null
   ↓
4. sessionStorage.removeItem('selected_team_member')
   ↓
5. Supabase auth.signOut()
   ↓
6. Redireciona para /login
```

---

## 🧪 Para Testar Agora

### 1. Verificar sincronização:
```powershell
npx supabase migration list
```
Deve mostrar as 2 últimas migrações com ✓ na coluna Remote.

### 2. Verificar useAuth atualizado:
```typescript
// Em qualquer componente
import { useAuth } from '@/hooks/useAuth';

function Test() {
  const { isSharedAccount, selectedTeamMember, selectTeamMember } = useAuth();
  
  console.log('Is Shared?', isSharedAccount);
  console.log('Selected Member:', selectedTeamMember);
  
  return <div>Check console!</div>;
}
```

### 3. Criar primeiro team member de teste:

Execute no Supabase SQL Editor:
```sql
-- Substitua os IDs pelos seus
INSERT INTO team_members (
  display_name,
  email,
  position,
  role_type,
  organization_id,
  auth_role_id,
  pin_hash
) VALUES (
  'Seu Nome',
  'seu.email@example.com',
  'Cook',
  'cook',
  'your-org-id',
  'your-user-id',
  -- PIN: 1234 (para teste)
  'testsalt123456' || encode(digest('testsalt123456' || '1234', 'sha256'), 'hex')
);
```

---

## 📊 Status Atual do Projeto

```
✅ Database
  ├── ✅ team_members table created
  ├── ✅ team_member_role enum created
  ├── ✅ RLS policies configured
  ├── ✅ Triggers for profile completion
  ├── ✅ Feed notification integration
  └── ✅ verify_team_member_pin RPC function

✅ Backend/Logic
  ├── ✅ PIN hashing utilities (pinUtils.ts)
  ├── ✅ Team member types (teamMembers.ts)
  ├── ✅ useTeamMembers hook (CRUD + PIN verification)
  └── ✅ useAuth extended with team member support

✅ Components
  ├── ✅ PINInput (4-digit entry dialog)
  └── ✅ TeamMemberSelector (selection screen)

⏳ Integration (Next)
  ├── ⏳ Add /select-team-member route
  ├── ⏳ Redirect shared accounts after login
  ├── ⏳ Add "Switch Profile" to user menu
  ├── ⏳ Refactor People module components
  └── ⏳ Data migration script
```

---

## 🚀 Você está aqui: 75% Completo!

**Feito**:
- ✅ Database schema
- ✅ Migrações sincronizadas
- ✅ PIN system completo
- ✅ Hooks e tipos
- ✅ Componentes UI
- ✅ useAuth estendido

**Falta**:
- ⏳ Integrar no fluxo de login (15 min)
- ⏳ Refatorar People module (30 min)
- ⏳ Migração de dados (opcional)

---

## 💡 Quer continuar?

Me avise e eu:
1. Integro o TeamMemberSelector no fluxo de auth
2. Adiciono o botão "Switch Profile"
3. Refatoro o módulo People para usar team_members

Ou você prefere fazer alguma parte específica primeiro? 🎯
