# SustainHub — Web

Frontend da plataforma SustainHub, construído com React + TypeScript + Vite.

## Stack

- **React 18** + **TypeScript**
- **Vite** — build e dev server
- **TailwindCSS** — estilização
- **TanStack Query** — data fetching e cache
- **Zustand** — estado global
- **React Hook Form** — formulários
- **Recharts** — gráficos
- **React Router v6** — rotas
- **i18next** — internacionalização (pt, en, es)

## Requisitos

- Node.js 20+
- npm 9+
- API rodando em `http://localhost:5000` (ver [SustainHub.Api](../SustainHub.Api))

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Acesse em `http://localhost:5173`.

A variável de ambiente padrão aponta para `http://localhost:5000/api`. Para usar uma URL diferente, crie um `.env.local`:

```env
VITE_API_URL=http://sua-api.com/api
```

## Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Preview do build local |
| `npm run lint` | Lint com ESLint |
| `npm run type-check` | Checagem de tipos sem emitir arquivos |

## Estrutura

```
src/
├── components/
│   ├── layout/        # Sidebar, Header, MainLayout, BottomNav
│   ├── ui/            # Botões, cards, inputs, badges
│   ├── auth/          # ProtectedRoute
│   └── tasks/         # Componentes de criação/edição de tarefas
├── hooks/             # Hooks de dados (useTickets, useTodos, useAdmin…)
├── lib/               # Utilitários, i18n, export, importParse
├── locales/           # Traduções pt / en / es
├── pages/             # Uma pasta por página
├── services/          # apiClient + módulos de serviço
├── stores/            # authStore, uiStore (Zustand)
└── types/             # Interfaces e enums do domínio
```

## Páginas

| Rota | Página | Acesso |
|------|--------|--------|
| `/login` | Login | Público |
| `/register` | Cadastro | Público |
| `/` | Dashboard | Autenticado |
| `/tasks` | Tickets / Bugs | Autenticado |
| `/todo` | Todo Planner | Autenticado |
| `/weekly` | Weekly Meeting | Autenticado |
| `/ai` | AI Insights | Autenticado |
| `/admin` | Administração | TenantAdmin / SuperAdmin |

## Autenticação

JWT armazenado em `localStorage`. O `authStore` injeta o token em todas as requisições via interceptor do axios. Ao expirar (401), o usuário é redirecionado para `/login` automaticamente.

## Roles

| Role | Permissões |
|------|-----------|
| `SuperAdmin` | Gerencia todas as organizações e usuários |
| `TenantAdmin` | Gerencia sua própria organização |
| `Manager` | Acesso completo à plataforma |
| `Developer` | Acesso padrão |

## Docker

```bash
# Build
docker build -t sustainhub-web .

# Rodar
docker run -p 5173:5173 sustainhub-web
```

Ou via docker-compose na raiz do projeto:

```bash
make start
```

## Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_API_URL` | `http://localhost:5000/api` | URL base da API |
| `VITE_APP_NAME` | `SustainHub` | Nome da aplicação |
| `VITE_APP_VERSION` | `0.1.0` | Versão exibida na UI |
