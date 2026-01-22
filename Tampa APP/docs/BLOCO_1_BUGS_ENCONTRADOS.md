# 🐛 BUGS ENCONTRADOS - BLOCO 1

**Timestamp:** 2026-01-20 10:00  
**Análise:** Código proativa antes de testes de produção  

---

## 🔴 CRITICAL - STRIPE FEATURE FLAG (3 bugs)

### **BUG-001: Onboarding sem feature flag check**
- **Arquivo:** `src/pages/Onboarding.tsx`
- **Linha:** ~25 (useEffect)
- **Descrição:** Rota `/onboarding` acessível mesmo com `ONBOARDING_ENABLED=false`
- **Impacto:** Usuários podem tentar self-service signup no MVP (deve ser manual)
- **Fix Estimado:** 5 minutos

**Solução:**
```typescript
// src/pages/Onboarding.tsx - adicionar no topo
import { FEATURES } from '@/lib/featureFlags';

// Adicionar dentro do componente
useEffect(() => {
  if (!FEATURES.ONBOARDING_ENABLED) {
    navigate('/dashboard');
    toast({
      title: "Onboarding Disabled",
      description: "Please contact support to set up your account.",
      variant: "destructive",
    });
  }
}, [navigate, toast]);
```

---

### **BUG-002: startCheckout() não guarda por feature flag**
- **Arquivo:** `src/lib/stripe.ts`
- **Linha:** Função `startCheckout()` (~250)
- **Descrição:** Função não verifica `STRIPE_ENABLED` antes de iniciar checkout
- **Impacto:** Usuários podem tentar pagamento quando Stripe desligado
- **Fix Estimado:** 3 minutos

**Solução:**
```typescript
// src/lib/stripe.ts
import { FEATURES } from './featureFlags';

export const startCheckout = async (planId: string) => {
  // Guard: feature flag check
  if (!FEATURES.STRIPE_ENABLED) {
    console.info('[MVP] Stripe payments disabled');
    throw new Error('Payments are currently disabled. Please contact support.');
  }

  // ... resto da função
};
```

---

### **BUG-003: SubscriptionPlans não verifica STRIPE_ENABLED**
- **Arquivo:** `src/components/billing/SubscriptionPlans.tsx`
- **Linha:** Componente render (~75)
- **Descrição:** UI de planos mostrada mesmo com pagamentos desligados
- **Impacto:** Confusão do usuário - vê planos mas não pode pagar
- **Fix Estimado:** 5 minutos

**Solução:**
```typescript
// src/components/billing/SubscriptionPlans.tsx - adicionar no topo
import { FEATURES } from '@/lib/featureFlags';

// Adicionar no início do componente
export function SubscriptionPlans({ organizationId, onPlanSelected }: SubscriptionPlansProps) {
  // Guard: feature flag
  if (!FEATURES.STRIPE_ENABLED) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Payments Temporarily Disabled</h2>
        <p className="text-muted-foreground">
          Please contact support to activate your subscription.
        </p>
      </div>
    );
  }

  // ... resto do componente
}
```

---

## 🟡 MINOR - UX IMPROVEMENTS (não bloqueiam MVP)

### **MINOR-001: No loading state durante auth**
- **Arquivo:** `src/pages/Auth.tsx`
- **Descrição:** Botões de Sign In/Sign Up não mostram loading state
- **Impacto:** UX - usuário não sabe se clique funcionou
- **Prioridade:** v1.0.1 (não MVP)

### **MINOR-002: Toast não mostra quando Stripe disabled**
- **Arquivo:** `src/lib/stripe.ts`
- **Descrição:** `getStripe()` retorna `null` silenciosamente
- **Impacto:** Desenvolvedor pode não perceber que Stripe está off
- **Prioridade:** v1.0.1 (já tem console.info)

---

## ✅ AREAS VALIDATED (sem bugs)

### **Authentication Flow ✅**
- ✅ AuthProvider properly configured
- ✅ Session state managed correctly
- ✅ Team member selection persists
- ✅ Shared account detection works
- ✅ Sign-out clears session properly

### **Organization Isolation ✅**
- ✅ All queries filter by `organization_id`
- ✅ Consistent pattern across codebase:
  ```typescript
  .eq('organization_id', profile.organization_id)
  ```
- ✅ Files verified (20+ locations):
  - Labeling.tsx
  - QuickPrintGrid.tsx
  - useRoutineTasks.ts
  - useTeamMembers.ts
  - useFeed.ts
  - zebraPrinterManager.ts

### **Feature Flags System ✅**
- ✅ `src/lib/featureFlags.ts` created
- ✅ Central configuration
- ✅ Helper functions implemented
- ✅ MVP_MODE documented

---

## 📊 SUMMARY

### Bugs Found:
- 🔴 **CRITICAL:** 3 bugs (Stripe feature flag)
- 🟡 **MINOR:** 2 bugs (UX improvements)

### Time to Fix:
- **CRITICAL bugs:** ~13 minutes total
- **MINOR bugs:** Deferred to v1.0.1

### Next Steps:
1. ✅ Fix BUG-001: Onboarding feature flag guard
2. ✅ Fix BUG-002: startCheckout() feature flag guard
3. ✅ Fix BUG-003: SubscriptionPlans feature flag guard
4. ⏸️ Continue BLOCO 1: RLS audit
5. ⏸️ Production testing

---

**Status:** READY TO FIX (3 critical, 13min total)
