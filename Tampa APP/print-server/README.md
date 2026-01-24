# Tampa APP - Local Print Server

Servidor local que permite o app web (HTTPS) se comunicar com impressoras locais (HTTP).

## 🚀 Como Usar

### 1. Instalar Node.js

Se não tiver Node.js instalado, baixe em: https://nodejs.org/

### 2. Instalar Dependências

```powershell
cd print-server
npm install
```

### 3. Configurar IP da Impressora

Edite `server.js` e altere a linha:

```javascript
const PRINTER_IP = '192.168.15.20'; // Seu IP atual
```

### 4. Iniciar o Servidor

```powershell
npm start
```

Você verá:
```
🖨️  Tampa APP Print Server
================================
📡 Server running on: http://localhost:3001
🖨️  Printer IP: 192.168.15.20

📝 Endpoints:
   GET  /health         - Check server status
   GET  /printer-status - Check printer status
   POST /print          - Send print job
```

### 5. Testar

Abra o navegador e acesse:
- http://localhost:3001/health
- http://localhost:3001/printer-status

## 📡 Como Usar no App Web

No seu código React, faça requisições para `http://localhost:3001/print`:

```typescript
const printLabel = async (zplCode: string) => {
  try {
    const response = await fetch('http://localhost:3001/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        zpl: zplCode,
        copies: 1
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Printed successfully!');
    } else {
      console.error('❌ Print failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Connection error:', error);
  }
};
```

## 🔧 Troubleshooting

### Erro: "ECONNREFUSED"
- Verifique se a impressora está ligada
- Confirme o IP: `ping 192.168.15.20`
- Verifique se a porta 9100 está aberta

### Erro: "CORS"
- O servidor já está configurado com CORS aberto
- Se ainda der erro, verifique o console do navegador

### Erro: "Mixed Content"
- Use o servidor local (localhost:3001)
- Não tente acessar a impressora diretamente do browser

## 🎯 Deploy

Para usar em produção (tablet no restaurante):

1. **Instalar no tablet/PC local**
2. **Configurar para iniciar automaticamente** (ver abaixo)
3. **Usar IP local** ao invés de localhost

### Iniciar Automaticamente (Windows)

Crie um arquivo `start-print-server.bat`:

```batch
@echo off
cd "C:\Users\Marci\OneDrive\Área de Trabalho\Tampa APP\Tampa APP\print-server"
npm start
```

Coloque na pasta de inicialização do Windows:
`C:\Users\Marci\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`

## 📦 Estrutura

```
print-server/
├── server.js          # Servidor principal
├── package.json       # Dependências
└── README.md         # Esta documentação
```

## 🔐 Segurança

**IMPORTANTE:** Este servidor deve rodar apenas na rede local (LAN).

- ✅ Usar apenas em rede privada
- ✅ Não expor à internet
- ✅ Configurar firewall se necessário
- ❌ Não usar em redes públicas

## 📞 Suporte

Para problemas, verifique:
1. IP da impressora está correto
2. Impressora está na mesma rede
3. Porta 9100 está acessível
4. Node.js está instalado corretamente
