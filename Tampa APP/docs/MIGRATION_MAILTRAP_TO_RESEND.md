# 🔄 Migração Mailtrap → Resend (Produção)

## Quando migrar para produção

### Checklist antes de publicar:
- [ ] App testado e funcionando
- [ ] Usuários de teste criados e funcionando
- [ ] Pronto para lançar ao público

---

## 🚀 Migração Rápida (5 minutos)

### 1. Criar conta Resend
```
https://resend.com/signup
```

### 2. Obter API Key
- Dashboard → API Keys → Create
- Nome: "Tampa APP Production"
- Copiar key (começa com `re_`)

### 3. Trocar no Supabase
```
URL: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/settings/auth

ANTES (Mailtrap):
SMTP Host: sandbox.smtp.mailtrap.io
SMTP Port: 587
SMTP User: [mailtrap username]
SMTP Password: [mailtrap password]
Sender Email: noreply@tampaapp.com
Sender Name: Tampa APP

DEPOIS (Resend):
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: [SUA API KEY - re_xxxxx]
Sender Email: onboarding@resend.dev
Sender Name: Tampa APP
```

### 4. Testar em produção
- Criar usuário com email real
- Verificar se email chega
- Testar link de reset de senha

---

## 🎯 Diferenças Importantes

| Feature | Mailtrap (Dev) | Resend (Prod) |
|---------|----------------|---------------|
| Envio real | ❌ Não | ✅ Sim |
| Email de teste | ✅ Qualquer | ❌ Somente reais |
| Custo | 💚 Free | 💚 Free (3k/mês) |
| Limite | 500 emails/mês | 3,000 emails/mês |
| Validade | 7 dias | Permanente |
| Deliverability | N/A | ~99% |

---

## ⚠️ IMPORTANTE

### NUNCA use Mailtrap em produção!
- Emails não chegarão aos usuários reais
- Usuários não conseguirão resetar senha
- Apenas a senha backup (TampaAPP@2026) funcionará

### Quando trocar:
✅ **Antes** de fazer deploy para produção
✅ **Antes** de divulgar o app
✅ **Antes** de aceitar usuários reais

---

## 📋 Checklist de Produção

Antes de lançar:
- [ ] Trocar Mailtrap por Resend
- [ ] Testar com email real
- [ ] Verificar domínio próprio (opcional)
- [ ] Customizar templates de email
- [ ] Configurar alertas no Resend
- [ ] Documentar para equipe

---

## 🆘 Suporte

Se tiver dúvidas na hora de migrar:
1. Confira documentação: docs/RESEND_IMPLEMENTATION.md
2. Siga o passo a passo acima
3. Teste antes de anunciar

**Boa sorte no desenvolvimento!** 🚀
