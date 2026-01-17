# 📧 Como Aplicar Templates de Email no Supabase

## 🎨 Templates Criados

1. **EMAIL_TEMPLATE_INVITE.html** - Para convites de novos usuários
2. **EMAIL_TEMPLATE_PASSWORD_RESET.html** - Para reset de senha

Ambos usam o tema **preto e laranja** moderno do Tampa APP!

---

## 📋 Passo a Passo

### 1️⃣ **Acessar Email Templates no Supabase**

```
https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/auth/templates
```

### 2️⃣ **Configurar Template de Convite**

1. Clique na aba **"Invite user"** (ou "Confirm signup")
2. Abra o arquivo: `docs/EMAIL_TEMPLATE_INVITE.html`
3. **Copie TODO o conteúdo** do arquivo
4. **Cole** na caixa de texto do Supabase
5. Clique em **"Save"**

### 3️⃣ **Configurar Template de Password Reset**

1. Clique na aba **"Reset password"** (ou "Change Email / Recovery")
2. Abra o arquivo: `docs/EMAIL_TEMPLATE_PASSWORD_RESET.html`
3. **Copie TODO o conteúdo** do arquivo
4. **Cole** na caixa de texto do Supabase
5. Clique em **"Save"**

---

## 🎯 Design Features

### 🎨 **Visual**
- ✅ Tema escuro (preto #0a0a0a, cinza escuro)
- ✅ Cor primária laranja (#ff6b35, #ff8c42)
- ✅ Gradientes modernos
- ✅ Sombras e bordas arredondadas
- ✅ Ícones emoji (🎉, 🔐, ℹ️)

### 📱 **Responsivo**
- ✅ Funciona em mobile, tablet, desktop
- ✅ Largura máxima de 600px
- ✅ Padding adequado para todas as telas
- ✅ Fontes system-native (Apple, Android, Windows)

### ✉️ **Compatibilidade**
- ✅ Gmail ✅
- ✅ Outlook ✅
- ✅ Apple Mail ✅
- ✅ Yahoo Mail ✅
- ✅ Thunderbird ✅
- ✅ Mobile clients ✅

### 🔒 **Segurança**
- ✅ Link alternativo caso botão não funcione
- ✅ Avisos de expiração
- ✅ Instruções claras
- ✅ Warning sobre segurança

---

## 🧪 Testar Templates

### Teste 1: Via Dashboard
1. Supabase → Auth → Users → "Invite User"
2. Digite qualquer email
3. Verifique no Mailtrap inbox
4. Veja se o template está bonito!

### Teste 2: Via Aplicação
1. Módulo People → Create Auth User
2. Preencha o formulário
3. Verifique no Mailtrap
4. Clique no link para testar funcionalidade

### Teste 3: Password Reset
1. Na tela de login, clique "Forgot Password"
2. Digite um email
3. Verifique no Mailtrap
4. Teste o link de reset

---

## 🎨 Personalização (Opcional)

### Alterar Cores

**Laranja principal** (#ff6b35):
- Procure por `#ff6b35` e `#ff8c42` nos templates
- Substitua pela cor desejada

**Background escuro** (#0a0a0a, #1a1a1a):
- Procure por `#0a0a0a`, `#1a1a1a`, `#2d2d2d`
- Substitua pelos tons desejados

### Alterar Logo/Ícone

Atualmente usa emoji 🍴 e 🔐.

Para usar imagem:
```html
<!-- Substituir: -->
<div style="display: inline-block; background-color: #ff6b35; width: 64px; height: 64px; border-radius: 16px; line-height: 64px; font-size: 32px;">
    🍴
</div>

<!-- Por: -->
<img src="https://seu-dominio.com/logo.png" alt="Tampa APP" style="width: 64px; height: 64px; border-radius: 16px; display: block; margin: 0 auto 24px;">
```

### Alterar Textos

Todos os textos podem ser editados diretamente no HTML:
- Títulos (dentro de `<h1>`, `<h2>`)
- Parágrafos (dentro de `<p>`)
- Botões (dentro de `<a>`)
- Footer (final do template)

---

## 📊 Preview

### Invitation Email:
```
┌─────────────────────────┐
│ [Orange gradient bar]   │
├─────────────────────────┤
│       🍴                │
│   Tampa APP             │
│   FOOD SAFETY SYNC      │
├─────────────────────────┤
│ 🎉 You've Been Invited! │
│                         │
│ Welcome to the team...  │
│                         │
│ [Accept Invitation BTN] │
│                         │
│ ℹ️ Important Info:      │
│ • Expires in 24h        │
│ • Login at: URL         │
└─────────────────────────┘
```

### Password Reset Email:
```
┌─────────────────────────┐
│ [Orange gradient bar]   │
├─────────────────────────┤
│       🔐                │
│   Tampa APP             │
│   PASSWORD RESET        │
├─────────────────────────┤
│ 🔑 Reset Your Password  │
│                         │
│ We received request...  │
│                         │
│ [Reset Password BTN]    │
│                         │
│ ⚠️ Security Notice:     │
│ • Expires in 1h         │
│ • Ignore if not you     │
└─────────────────────────┘
```

---

## 🔄 Variáveis do Supabase

Estas variáveis são automaticamente substituídas:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{ .ConfirmationURL }}` | Link de confirmação/reset | https://... |
| `{{ .SiteURL }}` | URL do seu site | https://tampaapp.com |
| `{{ .Email }}` | Email do destinatário | user@example.com |
| `{{ .Token }}` | Token de confirmação | abc123... |

**Não é necessário alterar nada!** O Supabase substitui automaticamente.

---

## ✅ Checklist de Aplicação

- [ ] Template de Invite copiado e colado
- [ ] Template de Password Reset copiado e colado
- [ ] Templates salvos no Supabase
- [ ] Teste enviado via Dashboard
- [ ] Email recebido no Mailtrap
- [ ] Visual conferido (preto e laranja)
- [ ] Link do botão funcionando
- [ ] Link alternativo funcionando
- [ ] Responsivo testado (mobile)

---

## 🆘 Troubleshooting

### Template não aparece formatado
- Certifique-se de copiar **TODO** o HTML (incluindo `<!DOCTYPE html>`)
- Verifique se colou no campo correto do Supabase
- Salve e teste novamente

### Cores não aparecem
- Alguns email clients bloqueiam CSS inline
- Os templates usam tabelas (melhor compatibilidade)
- Teste em diferentes clients (Gmail, Outlook)

### Imagens não carregam
- Templates atuais usam apenas emojis (sem imagens externas)
- Se adicionar imagens, hospede em CDN confiável
- Use URLs HTTPS absolutas

### Links não funcionam
- Variáveis `{{ .ConfirmationURL }}` são substituídas pelo Supabase
- Não altere essas variáveis!
- Se não funcionar, verifique configuração SMTP

---

## 📚 Recursos Adicionais

### Ferramentas de Teste
- **Litmus**: https://litmus.com (teste em múltiplos clients)
- **Email on Acid**: https://www.emailonacid.com
- **Mailtrap**: Já mostra preview de como vai aparecer

### Aprenda Mais
- **Can I Email**: https://www.caniemail.com (compatibilidade CSS)
- **Really Good Emails**: https://reallygoodemails.com (inspiração)

---

## 🎉 Pronto!

Seus templates estão prontos para uso! Basta aplicá-los no Supabase seguindo os passos acima.

**Design moderno ✅**
**Cores do Tampa APP ✅**
**Mobile-friendly ✅**
**Profissional ✅**

Boa sorte! 🚀
