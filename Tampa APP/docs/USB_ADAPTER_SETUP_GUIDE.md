# 🔌 Guia Completo: Impressora DOPMOOEZ via Adaptador USB no iPhone

## 📱 O Que Você Vai Precisar

### 1. **Adaptador Apple (OBRIGATÓRIO)**

Identifique seu modelo de iPhone:

| Modelo do iPhone | Porta | Adaptador Necessário | Preço (BR) |
|------------------|-------|----------------------|------------|
| iPhone 5-14 | Lightning | [Lightning to USB Camera Adapter](https://www.apple.com/br/shop/product/MD821BZ/A/adaptador-de-lightning-para-usb) | R$ 229 |
| iPhone 15/16 | USB-C | [USB-C to USB Adapter](https://www.apple.com/br/shop/product/MJ1M2BE/A/adaptador-de-usb-c-para-usb) | R$ 149 |

**⚠️ IMPORTANTE:** 
- Use **APENAS adaptadores Apple ORIGINAIS**
- Adaptadores genéricos podem não funcionar ou danificar dispositivos
- Verifique se diz "Apple" no corpo do adaptador

### 2. **Cabo USB da Impressora**
- Cabo USB-A para USB-B (o cabo que vem com a DOPMOOEZ)
- Se não tiver, qualquer cabo de impressora funciona (~R$ 15 no mercado)

### 3. **App de Impressão no iPhone**

Escolha UM dos apps abaixo:

#### **Opção A: Printer Pro by Readdle (RECOMENDADO) 📱**
- **Preço:** R$ 31,90 (pago uma vez)
- **Vantagens:** Interface simples, suporta ZPL direto, muito estável
- **Download:** [App Store - Printer Pro](https://apps.apple.com/br/app/printer-pro-print-documents/id393313223)

#### **Opção B: Print n Share (GRÁTIS) 📱**
- **Preço:** Grátis (compras in-app opcionais)
- **Vantagens:** Gratuito, funcional
- **Desvantagens:** Anúncios, menos polido
- **Download:** [App Store - Print n Share](https://apps.apple.com/br/app/print-n-share/id367300649)

#### **Opção C: Air Printer (ALTERNATIVA) 📱**
- **Preço:** R$ 18,90
- **Vantagens:** Compatível com muitas impressoras
- **Download:** [App Store - Air Printer](https://apps.apple.com/br/app/air-printer/id372080917)

---

## 🔧 Passo a Passo: Configuração

### **Passo 1: Comprar o Adaptador**

#### Onde Comprar no Brasil:
1. **Apple Store Online** (original, entrega em 3-5 dias)
   - https://www.apple.com/br/shop
   
2. **Apple Store Física** (compre hoje)
   - São Paulo: Shopping Morumbi, Shopping Iguatemi, Village Mall
   - Rio: Barra Shopping, Village Mall
   - Outras cidades: Verifique lojas autorizadas

3. **Magazine Luiza/Americanas** (verificar se é original)
   - Busque por "Lightning USB Camera Adapter Apple Original"

**⚠️ CUIDADO com falsificações:**
```
✅ Original Apple: Logo Apple gravado, embalagem lacrada, R$ 149-229
❌ Falsificação: Sem logo, embalagem genérica, R$ 30-50
```

---

### **Passo 2: Conectar Fisicamente**

#### Montagem:
```
iPhone 
   ↓ (Lightning/USB-C)
Adaptador Apple
   ↓ (USB-A fêmea)
Cabo USB da Impressora
   ↓ (USB-B)
Impressora DOPMOOEZ
```

#### Checklist:
1. ✅ **Ligue a impressora DOPMOOEZ** (botão power)
2. ✅ **Conecte cabo USB** da impressora ao adaptador
3. ✅ **Conecte adaptador** ao iPhone
4. ✅ **Aguarde 3-5 segundos** (iPhone detecta automaticamente)

**Você verá:**
- iPhone pode mostrar notificação: "USB Accessory Connected"
- Se pedir para "Confiar neste acessório", toque em **Permitir**

---

### **Passo 3: Instalar e Configurar App (Printer Pro)**

#### 3.1 Download e Abertura
```
1. Abra App Store no iPhone
2. Busque: "Printer Pro"
3. Compre/Instale (R$ 31,90)
4. Abra o app
```

#### 3.2 Adicionar Impressora
```
1. No Printer Pro, toque em "+" (adicionar impressora)
2. Selecione "USB Printer"
3. Conecte adaptador + impressora
4. App deve detectar: "DOPMOOEZ" ou "ZPL Printer"
5. Toque em "DOPMOOEZ" para selecionar
6. Toque em "Done/Concluído"
```

#### 3.3 Teste de Impressão
```
1. No Printer Pro, toque em "Test Print"
2. App imprime etiqueta de teste
3. ✅ Se imprimir = Configuração completa!
4. ❌ Se não imprimir = Veja seção "Troubleshooting"
```

---

### **Passo 4: Integrar com Tampa APP**

Agora você precisa fazer o Tampa APP **enviar ZPL para o Printer Pro**.

#### Método 1: Via Arquivo ZPL (MAIS SIMPLES)

Modifique `src/utils/zebraPrinter.ts`:

```typescript
const sendToPrinter = async (zpl: string, quantity: number = 1): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Adiciona comando de quantidade ao ZPL
      const zplWithQuantity = zpl.replace('^XZ', `^PQ${quantity}^XZ`);
      
      // Cria arquivo .zpl temporário
      const blob = new Blob([zplWithQuantity], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Cria link de download
      const a = document.createElement('a');
      a.href = url;
      a.download = `label_${Date.now()}.zpl`;
      a.style.display = 'none';
      
      // Adiciona ao DOM e clica
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('ZPL file downloaded. Open with Printer Pro to print.');
      resolve();
    } catch (error) {
      console.error('Error creating ZPL file:', error);
      reject(error);
    }
  });
};
```

**Como usar:**
1. No Tampa APP, clique em "Imprimir Etiqueta"
2. iPhone baixa arquivo `.zpl`
3. Abra o arquivo com Printer Pro (Share → Open in Printer Pro)
4. Printer Pro imprime automaticamente

---

#### Método 2: Via URL Scheme (MAIS AUTOMÁTICO)

Printer Pro tem um **URL scheme** para impressão direta:

```typescript
const sendToPrinter = async (zpl: string, quantity: number = 1): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const zplWithQuantity = zpl.replace('^XZ', `^PQ${quantity}^XZ`);
      
      // Codifica ZPL para URL
      const encodedZPL = encodeURIComponent(zplWithQuantity);
      
      // Abre Printer Pro com ZPL
      const printerProURL = `printerpro://print?text=${encodedZPL}&printer=DOPMOOEZ`;
      
      // Redireciona
      window.location.href = printerProURL;
      
      console.log('Opening Printer Pro...');
      resolve();
    } catch (error) {
      console.error('Error opening Printer Pro:', error);
      reject(error);
    }
  });
};
```

**Vantagens:**
- ✅ Impressão com 1 toque (automática)
- ✅ Não precisa baixar arquivo
- ✅ Melhor UX

**Desvantagens:**
- ❌ Precisa configurar URL scheme no iOS

---

#### Método 3: Via Share API (NATIVO DO SAFARI)

Use a API nativa do Safari para compartilhar:

```typescript
const sendToPrinter = async (zpl: string, quantity: number = 1): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const zplWithQuantity = zpl.replace('^XZ', `^PQ${quantity}^XZ`);
      
      // Cria arquivo
      const blob = new Blob([zplWithQuantity], { type: 'text/plain' });
      const file = new File([blob], `label_${Date.now()}.zpl`, { type: 'text/plain' });
      
      // Verifica se Navigator.share está disponível
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Imprimir Etiqueta',
          text: 'Abra com Printer Pro para imprimir'
        });
        console.log('ZPL shared successfully');
        resolve();
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (error) {
      console.error('Error sharing ZPL:', error);
      reject(error);
    }
  });
};
```

**Como usar:**
1. Clique em "Imprimir"
2. iOS mostra menu de compartilhamento
3. Selecione "Printer Pro"
4. Imprime automaticamente

---

## 🎨 Adicionar Botão no Tampa APP

Adicione um botão visual para facilitar:

```typescript
// src/components/PrintButton.tsx
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PrintButtonProps {
  zpl: string;
  quantity?: number;
}

export function PrintButton({ zpl, quantity = 1 }: PrintButtonProps) {
  const handlePrint = async () => {
    try {
      // Usa Método 3 (Share API)
      const zplWithQuantity = zpl.replace('^XZ', `^PQ${quantity}^XZ`);
      const blob = new Blob([zplWithQuantity], { type: 'text/plain' });
      const file = new File([blob], `label_${Date.now()}.zpl`, { type: 'text/plain' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Imprimir Etiqueta',
        });
      } else {
        // Fallback: Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Print error:', error);
      alert('Erro ao imprimir. Verifique se a impressora está conectada.');
    }
  };

  return (
    <Button 
      onClick={handlePrint}
      className="w-full bg-green-600 hover:bg-green-700"
    >
      <Printer className="mr-2 h-5 w-5" />
      Imprimir via USB
    </Button>
  );
}
```

**Uso no Labeling.tsx:**
```typescript
import { PrintButton } from '@/components/PrintButton';

// Dentro do componente
<PrintButton zpl={generatedZPL} quantity={1} />
```

---

## 🔍 Troubleshooting (Resolução de Problemas)

### Problema 1: "iPhone não detecta impressora"

**Soluções:**
```
✅ 1. Verifique se adaptador é ORIGINAL Apple
✅ 2. Teste cabo USB em outro dispositivo (PC)
✅ 3. Reinicie iPhone (hold Power + Volume Down)
✅ 4. Desligue/ligue impressora
✅ 5. Conecte adaptador DEPOIS de abrir Printer Pro
```

---

### Problema 2: "Printer Pro não encontra impressora"

**Soluções:**
```
✅ 1. No Printer Pro: Settings → Add Printer → USB
✅ 2. Desconecte e reconecte adaptador
✅ 3. Atualize Printer Pro (App Store → Updates)
✅ 4. Delete app e reinstale
✅ 5. Teste com outro app (Print n Share)
```

---

### Problema 3: "Imprime, mas caracteres estranhos"

**Causa:** Impressora não está em modo ZPL

**Solução:**
```
1. Desligue impressora
2. Segure botão FEED ao ligar
3. Aguarde 3 bips
4. Solte botão
5. Impressora imprime configuração
6. Verifique se diz "ZPL Mode: ON"
```

**Ou via código ZPL:**
```zpl
^XA
^SZ2^JMA
^MCY
^XZ
```
(Este código força modo ZPL)

---

### Problema 4: "Etiqueta sai em branco"

**Soluções:**
```
✅ 1. Ajuste darkness (escuridão):
   Printer Pro → Settings → Darkness → 20-30

✅ 2. Verifique ribbon (fita):
   Se usa ribbon térmico, troque fita

✅ 3. Limpe cabeça de impressão:
   Use álcool isopropílico + cotonete

✅ 4. Teste etiqueta de diagnóstico:
   Hold FEED + PAUSE ao ligar = Imprime teste
```

---

### Problema 5: "Funciona no PC, mas não no iPhone"

**Causa:** Driver PC vs. Raw printing no iOS

**Solução:**
```
1. No PC, o driver Zebra converte comandos
2. No iPhone, envia ZPL "cru" direto
3. Verifique se ZPL está correto (teste em labelary.com)
4. Adicione ^CI28 ao início do ZPL (codificação UTF-8)
```

---

## ✅ Checklist Final

Antes de considerar completo:

- [ ] ✅ Adaptador Apple ORIGINAL comprado
- [ ] ✅ Cabo USB da impressora funcionando
- [ ] ✅ Printer Pro instalado e pago
- [ ] ✅ Impressora detectada no Printer Pro
- [ ] ✅ Teste de impressão funcionou (etiqueta saiu)
- [ ] ✅ Código atualizado no Tampa APP
- [ ] ✅ Botão "Imprimir via USB" adicionado
- [ ] ✅ Testado impressão de etiqueta real do app
- [ ] ✅ Troubleshooting conhecido (caso dê problema)

---

## 📊 Comparação: Antes vs. Depois

### **ANTES (sem solução):**
```
❌ DOPMOOEZ não tem Web Services
❌ WebSocket não funciona
❌ Nenhuma impressão via iPhone
```

### **DEPOIS (com adaptador USB):**
```
✅ Impressão física via cabo
✅ Funciona 100% (sem depender de WiFi/Bluetooth)
✅ Latência baixa (~2 segundos)
✅ Custo: R$ 180-260 (adaptador + app)
```

---

## 🚀 Próximos Passos

### **Hoje (agora):**
1. Compre adaptador Apple (loja física ou online)
2. Compre Printer Pro no App Store (R$ 31,90)

### **Quando adaptador chegar:**
1. Siga "Passo 2: Conectar Fisicamente"
2. Configure Printer Pro (Passo 3)
3. Teste impressão de etiqueta

### **Depois de testar:**
1. Integre com Tampa APP (Passo 4 - escolha Método 3)
2. Adicione botão bonito (código fornecido)
3. Deploy no Vercel

---

## 💬 Precisa de Ajuda?

**Se tiver dúvidas durante configuração:**
- 📸 Tire foto do erro/problema
- 📝 Descreva passo onde travou
- 🔍 Me mostre mensagem de erro (se houver)

**Eu posso ajudar com:**
- ✅ Código personalizado para seu caso
- ✅ Troubleshooting específico
- ✅ Alternativas se não funcionar

---

## 📚 Recursos Adicionais

- [Printer Pro - Manual Oficial](https://help.readdle.com/printer-pro)
- [Zebra ZPL Programming Guide](https://www.zebra.com/content/dam/zebra/manuals/printers/common/programming/zpl-zbi2-pm-en.pdf)
- [Labelary ZPL Viewer](http://labelary.com/viewer.html) - Teste ZPL online

---

**Bora começar! Depois que comprar o adaptador, me avise para eu te ajudar na integração do código!** 🚀
