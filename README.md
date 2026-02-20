# 📱 Manutenção Preventiva — PWA

App web progressivo (PWA) para gerenciamento de cronograma de manutenção preventiva de teares.
Instala no celular como app nativo, funciona offline, e envia notificações.

---

## ✅ Funcionalidades

- 📊 Cronograma completo dos 27 teares
- 🔢 Inserção de valores reais de voltas e data de manutenção
- 📅 Cálculo automático da previsão de próxima manutenção
- 🔴🟡🟢 Status visual por tear (Vencido / Atenção / Em dia)
- 🔔 Notificações push para manutenções próximas (≤7 dias)
- 👤 Login com e-mail e senha (Firebase Auth)
- ☁️ Dados sincronizados na nuvem em tempo real (Firestore)
- 📴 Funciona offline (Service Worker)
- 📱 Instala como app no Android e iOS
- 🖨️ Imprimir / exportar PDF
- 📥 Exportar CSV (abre no Excel)

---

## 🚀 Como colocar no ar

### Passo 1 — Criar projeto no Firebase (gratuito)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Criar projeto"** → dê um nome (ex: `manutencao-preventiva`)
3. Pode desativar o Google Analytics
4. Após criar, clique em **"</> Web"** para adicionar um app web
5. Copie as credenciais (apiKey, authDomain, etc.)

### Passo 2 — Ativar Authentication

1. No menu lateral, clique em **Authentication**
2. Clique em **"Primeiros passos"**
3. Ative **"E-mail/senha"** como método de login

### Passo 3 — Ativar Firestore

1. No menu lateral, clique em **Firestore Database**
2. Clique em **"Criar banco de dados"**
3. Escolha **"Modo de produção"**
4. Escolha a região (recomendado: `southamerica-east1` — São Paulo)
5. Nas **Regras**, substitua pelo conteúdo abaixo e publique:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /teams/{userId}/teares/{tearId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Passo 4 — Configurar o app

Abra o arquivo `app.js` e substitua o bloco `FIREBASE_CONFIG` com suas credenciais:

```javascript
const FIREBASE_CONFIG = {
  apiKey:            "SUA_API_KEY",
  authDomain:        "SEU_PROJETO.firebaseapp.com",
  projectId:         "SEU_PROJETO",
  storageBucket:     "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId:             "SEU_APP_ID"
};
```

### Passo 5 — Hospedar o app (grátis com Firebase Hosting)

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Na pasta do projeto
firebase init hosting
# Selecione seu projeto
# Public directory: . (ponto)
# Single page app: YES
# Overwrite index.html: NO

# Publicar
firebase deploy
```

Seu app estará disponível em: `https://SEU_PROJETO.web.app`

---

## 📱 Instalar no celular

### Android (Chrome)
1. Abra o link do app no Chrome
2. Aparecerá um banner **"Instalar app"** — toque nele
3. Ou: Menu (⋮) → **"Adicionar à tela inicial"**

### iPhone (Safari)
1. Abra o link no Safari
2. Toque no botão de **compartilhar** (ícone de caixa com seta)
3. Role para baixo e toque em **"Adicionar à Tela de Início"**

---

## 🔔 Notificações

- Ao entrar no app, acesse o menu (≡) e toque em **"Ativar notificações"**
- O app notificará automaticamente quando um tear tiver manutenção nos próximos **7 dias** ou vencida
- As verificações acontecem diariamente em segundo plano

---

## 👥 Múltiplos usuários

- Cada usuário tem seus próprios dados no Firestore (isolados por UID)
- Para equipes compartilhadas, é possível adicionar um campo "team" — consulte um desenvolvedor para essa extensão

---

## 📂 Estrutura dos arquivos

```
mp-pwa/
├── index.html      # Interface principal (login + app)
├── app.js          # Lógica: Firebase, tabela, cálculos, export
├── sw.js           # Service Worker (offline + notificações)
├── manifest.json   # Configuração PWA
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── README.md
```

---

## 💡 Sem Firebase?

O app funciona **sem configurar o Firebase** — nesse caso os dados ficam salvos no próprio celular (localStorage). Basta abrir o `index.html` no navegador e usar normalmente.

---

## 📞 Suporte

Para dúvidas sobre configuração, pesquise "Firebase Hosting tutorial" no YouTube ou acesse a [documentação oficial](https://firebase.google.com/docs).
