# Solve Paies

Panel de gestion des paies staff pour un serveur Garry's Mod NarutoRP. Application indépendante du panel de modération. Dark mode only.

## Stack technique

### Frontend
- React 19 + Vite + TypeScript (strict)
- Tailwind CSS v4 (composants maison)
- Axios, Zustand, TanStack Query v5, React Router v7
- Lucide React (icônes)
- i18n (français par défaut)

### Backend
- Supabase Cloud (Edge Functions Deno/TypeScript + PostgreSQL + Discord OAuth2)

## Setup local

```bash
# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp .env.example .env
# Remplir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# Lancer Supabase local
npx supabase start
npx supabase functions serve

# Lancer le frontend
pnpm dev
```

## Variables d'environnement

### Frontend (.env)
| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique anon Supabase |
| `VITE_DEV_MODE` | `true` pour activer la page dev-login |

### Edge Functions (Supabase Dashboard > Secrets)
| Variable | Description |
|---|---|
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service_role Supabase |

## Déploiement

### Frontend (Vercel)
1. Connecter le repo GitHub sur Vercel
2. Framework : Vite
3. Configurer les variables d'environnement (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DEV_MODE=false`)
4. Deploy

### Edge Functions (Supabase)
```bash
npx supabase functions deploy
```

## Structure du projet

```
src/
  api/          # Couche Axios (client, auth, payroll, admin)
  components/
    layout/     # Layout, Sidebar, Header
    ui/         # Button, Input, Modal, Table, Badge, etc.
    payroll/    # PayrollTable, PayrollRow, AddMemberModal, etc.
    admin/      # AddUserModal, EditUserModal, DeleteUserModal
  hooks/
    queries/    # TanStack Query hooks (use-payroll, use-admin, use-auth)
  i18n/         # Traductions (fr)
  lib/          # Utils, constants, supabase client
  pages/        # Pages (login, dashboard, payroll, global, history, admin)
  routes/       # ProtectedRoute
  stores/       # Zustand (auth, sidebar)
  types/        # TypeScript interfaces et enums

supabase/
  functions/
    _shared/          # cors, auth, response helpers
    auth-me/          # GET - Auth callback
    payroll-weeks/    # GET, POST, PATCH
    payroll-entries/  # GET, POST, PUT, DELETE
    payroll-submit/   # POST
    payroll-export/   # GET (CSV/TSV)
    admin-users/      # GET, POST, PATCH, DELETE
    admin-payroll-control/  # POST (open/close/lock)
  migrations/
```

## Edge Functions

Toutes les Edge Functions ont `verify_jwt = false` dans leur `config.toml`. L'authentification JWT est gérée par `_shared/auth.ts`.

| Fonction | Méthodes | Accès |
|---|---|---|
| `auth-me` | GET | Tous |
| `payroll-weeks` | GET, POST, PATCH | GET: tous, POST/PATCH: coordinateur |
| `payroll-entries` | GET, POST, PUT, DELETE | Resp du pôle + coordinateur |
| `payroll-submit` | POST | Resp du pôle + coordinateur |
| `payroll-export` | GET | Coordinateur |
| `admin-users` | GET, POST, PATCH, DELETE | Coordinateur |
| `admin-payroll-control` | POST | Coordinateur |
