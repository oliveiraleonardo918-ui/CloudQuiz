# ☁️ CloudQuiz

[![Live Demo](https://img.shields.io/badge/Live%20Demo-cloud--quiz--one.vercel.app-brightgreen)](https://cloud-quiz-one.vercel.app)
[![Deployment](https://img.shields.io/badge/deployed%20on-Vercel-black)](https://vercel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Back4App](https://img.shields.io/badge/Backend-Back4App-1289A7)](https://www.back4app.com/)
[![License](https://img.shields.io/badge/license-Academic-blue)](#)

> Quiz interativo de Computação em Nuvem com autenticação social, ranking global e deploy contínuo automatizado.

🔗 **Acesse o site em produção:** [https://cloud-quiz-one.vercel.app](https://cloud-quiz-one.vercel.app)

---

## 📋 Sobre o Projeto

O **CloudQuiz** é uma aplicação web desenvolvida como trabalho acadêmico da disciplina de Cloud Computing. Ele combina conceitos teóricos de computação em nuvem (NIST, modelos de serviço, características essenciais) com perguntas práticas sobre os três principais provedores de mercado: **AWS, Azure e Google Cloud**.

O projeto demonstra na prática a aplicação dos conceitos estudados:

- 🌐 **SaaS**: o usuário final acessa o quiz por qualquer navegador, sem instalar nada
- ⚙️ **PaaS/BaaS**: a aplicação consome um backend gerenciado (Back4App / Parse Server)
- 🚀 **CI/CD**: integração contínua via GitHub Actions e deploy contínuo via Vercel

---

## ✨ Funcionalidades

### 🔐 Autenticação dupla
- **Login tradicional** com usuário e senha (Parse User)
- **Login social com Google** via OAuth 2.0 / OpenID Connect (ID Token JWT)
- Sessão persistente entre recargas da página
- Rotas protegidas com redirecionamento automático

### 🎮 Quiz interativo
- **45 perguntas** no banco, das quais 10 são sorteadas a cada partida
- **Timer de 12 segundos** por pergunta com indicador visual de urgência
- **Selo de dificuldade** colorido (🟢 Fácil / 🟡 Médio / 🔴 Difícil)
- **Animação de pontos** ao acertar (+X pts com ícone de raio)
- Categorias: NIST, IaaS/PaaS/SaaS/BaaS, Escalonamento, AWS, Azure, GCP

### 🏆 Sistema de pontuação avançado

A fórmula combina dificuldade da pergunta com velocidade da resposta:

```
pontos = (10 × multiplicador_dificuldade) + segundos_restantes
```

| Dificuldade | Multiplicador | Pontos Base | Bônus Máximo | Total Máximo |
|-------------|---------------|-------------|--------------|--------------|
| 🟢 Fácil    | 1×            | 10          | +12          | **22 pts**   |
| 🟡 Médio    | 1.5×          | 15          | +12          | **27 pts**   |
| 🔴 Difícil  | 2×            | 20          | +12          | **32 pts**   |

- Resposta errada ou timeout: **0 pontos**
- Acertar pergunta difícil rapidamente: **32 pontos** (máximo possível)

### 📊 Ranking global
- Top 10 jogadores ordenados por pontuação total
- Destaque visual para o jogador atual
- Medalha dourada para o 1º lugar
- Atualização em tempo real após cada partida

### 🚀 Deploy automatizado
- Push para `main` → build + deploy automático na Vercel
- HTTPS automático
- Preview deployments em cada PR

---

## 🛠️ Stack Técnica

### Frontend
- **[React 19](https://react.dev)** — biblioteca de UI
- **[TypeScript 5](https://www.typescriptlang.org/)** — tipagem estática
- **[Vite 7](https://vitejs.dev/)** — build tool e dev server
- **[Tailwind CSS 3](https://tailwindcss.com/)** — estilização utility-first
- **[React Router 7](https://reactrouter.com/)** — navegação SPA
- **[Lucide React](https://lucide.dev/)** — biblioteca de ícones

### Backend & Autenticação
- **[Back4App](https://www.back4app.com/)** — Backend-as-a-Service baseado em Parse Server
- **[Parse SDK](https://docs.parseplatform.org/)** — cliente de comunicação com o backend
- **[Google Identity Services](https://developers.google.com/identity)** — autenticação OAuth 2.0
- **[@react-oauth/google](https://github.com/MomenSherif/react-oauth)** — integração React do Google OAuth

### Infraestrutura
- **[Vercel](https://vercel.com/)** — hospedagem e CDN com deploy automático
- **[GitHub Actions](https://github.com/features/actions)** — pipeline CI/CD

---

## 🚀 Como rodar localmente

### Pré-requisitos
- Node.js 18+ instalado
- Conta gratuita no [Back4App](https://www.back4app.com/)
- Conta no [Google Cloud Console](https://console.cloud.google.com) (para login Google)

### 1. Clonar o repositório

```bash
git clone https://github.com/oliveiraleonardo918-ui/CloudQuiz.git
cd CloudQuiz
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Edite `.env` e preencha com suas chaves:

```env
VITE_BACK4APP_APP_ID=sua_application_id_aqui
VITE_BACK4APP_JS_KEY=sua_javascript_key_aqui
VITE_GOOGLE_CLIENT_ID=seu_google_client_id_aqui
```

### 4. Configurar o Back4App

Crie um app no Back4App com as seguintes classes:

- **`Question`**: campos `statement`, `optionA`, `optionB`, `optionC`, `optionD`, `correctAnswer`, `category`, `difficulty`
- **`Score`**: campos `playerId` (Pointer → `_User`), `username`, `points`, `totalQuestions`, `playedAt`
- **`_User`**: classe nativa do Parse, adicionar coluna `displayName`

### 5. Configurar o Google OAuth (opcional)

Para habilitar login com Google:

1. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com)
2. Configure a tela de consentimento OAuth (Testing mode)
3. Crie um OAuth Client ID (Web application)
4. Adicione `http://localhost:5173` em **Authorized JavaScript origins** e **Authorized redirect URIs**

### 6. Rodar o projeto

```bash
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173).

---

## 📁 Estrutura do projeto

```
CloudQuiz/
├── .github/
│   └── workflows/          # Pipeline CI/CD
├── src/
│   ├── components/         # Componentes reutilizáveis
│   │   └── ProtectedRoute.tsx
│   ├── context/            # Contextos React (estado global)
│   │   └── AuthContext.tsx
│   ├── pages/              # Telas da aplicação
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── QuizScreen.tsx
│   │   └── LeaderboardScreen.tsx
│   ├── services/           # Camada de comunicação com APIs
│   │   └── back4app.ts
│   ├── App.tsx             # Roteamento principal
│   ├── main.tsx            # Entry point
│   └── index.css           # Estilos globais (Tailwind)
├── .env.example            # Template de variáveis de ambiente
├── .gitignore
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── README.md               # Este arquivo
├── ARCHITECTURE.md         # Documentação de arquitetura
└── CONTRIBUTING.md         # Guia de contribuição
```

---

## 📈 Fluxo de uso

1. Usuário acessa o site e faz login (tradicional ou Google)
2. É redirecionado para o quiz
3. Responde 10 perguntas com timer de 12s cada
4. Score é calculado considerando dificuldade + tempo de resposta
5. Score é salvo no Back4App
6. Usuário vai para o leaderboard global
7. Pode jogar novamente ou fazer logout

Para mais detalhes técnicos, veja [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 🔒 Segurança

- ✅ Chaves do Back4App e Google Client ID em variáveis de ambiente
- ✅ Arquivo `.env` no `.gitignore` (nunca commitado)
- ✅ `.env.example` versionado com placeholders
- ✅ Senhas com hash nativo do Parse Server (bcrypt)
- ✅ Class Level Permissions (CLP) configuradas no Back4App
- ✅ ACLs individuais protegendo dados sensíveis dos usuários
- ✅ JWT do Google validado pelo Parse Server (não há trust no frontend)
- ✅ HTTPS automático em produção (Vercel)

---

## 🗺️ Roadmap

Funcionalidades implementadas e ideias futuras:

### ✅ Implementado
- [x] Autenticação tradicional (usuário/senha)
- [x] Autenticação social com Google OAuth
- [x] Quiz com 45 perguntas categorizadas
- [x] Sistema de pontuação com dificuldade e bônus de tempo
- [x] Ranking global em tempo real
- [x] Interface em português brasileiro
- [x] Deploy contínuo automatizado

### 🔮 Possíveis melhorias futuras
- [ ] Modo multiplayer em tempo real
- [ ] Categorias selecionáveis pelo jogador
- [ ] Sistema de níveis e badges
- [ ] Histórico de partidas no perfil
- [ ] Dark mode
- [ ] Suporte multi-idioma (i18n)
- [ ] PWA com modo offline

---

## 👥 Equipe — Grupo 2

Projeto desenvolvido como trabalho da disciplina de **Cloud Computing**:

| Membro |
|--------|
| **Rômulo Azevedo Montenegro Neto** |
| **João Gabriel de Holanda Montenegro** |
| **Lívia Maria Barreto Albuquerque** |
| **Leonardo Oliveira Freitas de Matos** |

---

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos.

---

## 🙏 Agradecimentos

- À equipe do **Back4App** pelo backend gratuito e robusto
- À **Vercel** pelo hosting gratuito e excelente DX
- Aos colegas do Grupo 2 pelo trabalho em equipe
- Ao professor que tem Doutorado em um Instituto Militar de alto intelecto academico, P.hD Estevão da disciplina pela proposta desafiadora

---

<div align="center">

**Feito com ☁️ pelo Grupo 2**

[🔗 Live Demo](https://cloud-quiz-one.vercel.app) · [📐 Architecture](./ARCHITECTURE.md) · [🤝 Contributing](./CONTRIBUTING.md)

</div>
