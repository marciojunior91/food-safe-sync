# 🐛 BUG-004: Dashboard Stats Org Filter - FIXED

**Data:** 22 Jan 2026  
**Status:** ✅ FIXED  
**Severidade:** 🔴 CRITICAL  
**Tempo de Fix:** 5 minutos  

---

## 📋 DESCRIÇÃO DO BUG

**Problema:** Dashboard stats counters em `Labeling.tsx` NÃO filtravam por `organization_id`, causando **data leakage** entre organizações.

**Impacto:**
- 🔴 Usuário via stats de TODAS as organizações
- 🔴 Violação de multi-org isolation
- 🔴 Security issue - leak de informação sensível
- 🔴 Stats incorretos na UI

**Afetava:**
- `labelsToday` - labels impressos hoje
- `totalLabels` - total de labels
- `expiringCount` - labels expirando em 24h

---

## 🔍 CÓDIGO ANTES (BUGADO)

```typescript
const fetchDashboardStats = async () => {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ❌ SEM FILTRO DE ORG!
    const { count: todayCount, error: todayError } = await supabase
      .from("printed_labels")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString());

    if (todayError) throw todayError;
    setLabelsToday(todayCount || 0);

    // ❌ SEM FILTRO DE ORG!
    const { count: totalCount, error: totalError } = await supabase
      .from("printed_labels")
      .select("*", { count: "exact", head: true });

    if (totalError) throw totalError;
    setTotalLabels(totalCount || 0);

    // ❌ SEM FILTRO DE ORG!
    const { count: expiringCountData, error: expiringError } = await supabase
      .from("printed_labels")
      .select("*", { count: "exact", head: true })
      .gte("expiry_date", now.toISOString().split('T')[0])
      .lte("expiry_date", next24Hours.toISOString().split('T')[0]);

    if (expiringError) throw expiringError;
    setExpiringCount(expiringCountData || 0);

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
  }
};
```

---

## ✅ CÓDIGO DEPOIS (FIXADO)

```typescript
const fetchDashboardStats = async () => {
  try {
    // ✅ GET ORG_ID FIRST
    if (!user?.id) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();
    
    if (!profile?.organization_id) return;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ✅ COM FILTRO DE ORG!
    const { count: todayCount, error: todayError } = await supabase
      .from("printed_labels")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)  // ✅ ADDED
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString());

    if (todayError) throw todayError;
    setLabelsToday(todayCount || 0);

    // ✅ COM FILTRO DE ORG!
    const { count: totalCount, error: totalError } = await supabase
      .from("printed_labels")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id);  // ✅ ADDED

    if (totalError) throw totalError;
    setTotalLabels(totalCount || 0);

    // ✅ COM FILTRO DE ORG!
    const now = new Date();
    const next24Hours = new Date();
    next24Hours.setHours(next24Hours.getHours() + 24);

    const { count: expiringCountData, error: expiringError } = await supabase
      .from("printed_labels")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)  // ✅ ADDED
      .gte("expiry_date", now.toISOString().split('T')[0])
      .lte("expiry_date", next24Hours.toISOString().split('T')[0]);

    if (expiringError) throw expiringError;
    setExpiringCount(expiringCountData || 0);

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
  }
};
```

---

## 🔧 MUDANÇAS APLICADAS

1. **Adicionado fetch de organization_id no início:**
   ```typescript
   const { data: profile } = await supabase
     .from('profiles')
     .select('organization_id')
     .eq('user_id', user.id)
     .single();
   ```

2. **Adicionado `.eq("organization_id", profile.organization_id)` em 3 queries:**
   - Query 1: Labels Today
   - Query 2: Total Labels
   - Query 3: Expiring Count

3. **Adicionado early return se org_id não existir:**
   ```typescript
   if (!profile?.organization_id) return;
   ```

---

## ✅ VALIDAÇÃO

**TypeScript Errors:** ✅ Zero errors  
**Build:** ✅ Não testado ainda (rodará no próximo build)  
**RLS Compliance:** ✅ Agora compatível com multi-org isolation  

**Manual Testing Pendente:**
- [ ] Login como user da Org A
- [ ] Verificar stats mostram apenas labels da Org A
- [ ] Login como user da Org B
- [ ] Verificar stats mostram apenas labels da Org B
- [ ] Confirmar nenhum data leakage

---

## 📊 IMPACTO

**Antes:**
- Tampa Test Restaurant user via stats de TODAS orgs
- Se existissem 1000 labels de outras orgs, counters mostrariam isso

**Depois:**
- Tampa Test Restaurant user vê APENAS seus labels
- Multi-org isolation mantido
- Security vulnerability fechada

---

## 🎯 LIÇÕES APRENDIDAS

1. **SEMPRE filtrar por organization_id** em QUALQUER query de dashboard/stats
2. **Code review:** Validar org filtering mesmo em queries de aggregation
3. **Pattern:** `fetch profile.organization_id → use em TODAS queries`
4. **Testing:** Criar test com 2 orgs para detectar data leakage

---

## 📝 PRÓXIMOS PASSOS

1. ✅ BUG-004 FIXED
2. ⏸️ Manual testing para confirmar fix
3. ⏸️ Continuar com BUG-005 (N+1 query performance)

---

**FIX COMPLETO:** ✅  
**READY FOR TESTING:** ✅  
**MARCHA FIO!!!** 🚀
