# CONTEXT.md — Solve Paies

## Projet

Panel de gestion des paies staff pour un serveur Garry's Mod NarutoRP. Application indépendante du panel de modération. Dark mode only, design épuré, tables comme élément central.

## Stack technique

### Frontend

- **React 19** + **Vite** + **TypeScript** (strict)
- **Tailwind CSS v4** — composants maison uniquement, aucune lib UI
- **Axios** — client HTTP, toutes les requêtes passent par des Edge Functions Supabase
- **Zustand** — state management global (auth, sidebar, selected role en dev)
- **TanStack Query v5** — data fetching, cache, invalidation
- **React Router v7** — routing SPA
- **i18n** — internationalisation (UI en français par défaut, architecture multilingue)
- **Lucide React** — icônes SVG uniquement, aucun emoji

### Backend

- **Supabase Cloud** (hosted)
- **Edge Functions** (Deno/TypeScript) — toute la logique métier
- **PostgreSQL** (Supabase) — base de données
- **Supabase Auth** — Discord OAuth2
- Pas de Supabase Storage (pas d'upload dans ce panel)

### Déploiement

- **Frontend** : Vercel (build Vite standard)
- **Backend** : Supabase Cloud (Edge Functions déployées via `npx supabase functions deploy`)

### Règle critique

**Zéro requête directe en base de données depuis le frontend.** Tout passe par les Edge Functions. Le client Supabase côté frontend sert uniquement pour l'auth (login/logout/session). Toutes les opérations CRUD utilisent Axios → Edge Functions → Supabase Admin Client (service_role key côté serveur).

## Structure du projet

```
solve-paies/
├── src/
│   ├── api/
│   │   ├── client.ts             # Instance Axios (baseURL, interceptors JWT)
│   │   ├── auth.api.ts
│   │   ├── payroll.api.ts
│   │   ├── members.api.ts
│   │   ├── users.api.ts
│   │   └── admin.api.ts
│   ├── components/
│   │   ├── layout/               # Layout, Sidebar
│   │   ├── ui/                   # Composants maison (Button, Input, Badge, Modal, Table, Select, Switch, etc.)
│   │   ├── payroll/              # Composants métier (PayrollTable, PayrollRow, etc.)
│   │   └── members/             # Composants gestion des membres (AddPoleMemberModal, BulkImportMembersModal)
│   ├── hooks/
│   │   └── queries/              # TanStack Query hooks
│   ├── pages/
│   ├── stores/
│   │   ├── auth.store.ts
│   │   └── sidebar.store.ts
│   ├── types/
│   ├── lib/
│   │   ├── constants.ts
│   │   ├── utils.ts
│   │   └── supabase.ts          # Client Supabase (auth uniquement)
│   ├── routes/
│   │   └── ProtectedRoute.tsx
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── cors.ts
│   │   │   ├── auth.ts
│   │   │   └── response.ts
│   │   ├── auth-me/
│   │   ├── payroll-entries/
│   │   ├── payroll-weeks/
│   │   ├── payroll-submit/
│   │   ├── payroll-export/
│   │   ├── pole-members/
│   │   ├── admin-users/
│   │   └── admin-payroll-control/
│   ├── migrations/
│   └── config.toml
├── public/
│   └── logo.png                 # Logo du panel (utilisé dans login, sidebar)
├── index.html
├── vite.config.ts
└── package.json
```

---

## Rôles

```typescript
enum Role {
  COORDINATEUR = 'coordinateur',
  GERANT_RP = 'gerant_rp',
  GERANT_DEV = 'gerant_dev',
  GERANT_STAFF = 'gerant_staff',
  GERANT_DISCORD = 'gerant_discord',
  GERANT_EQUILIBRAGE = 'gerant_equilibrage',
  GERANT_SERVEUR = 'gerant_serveur',
  ADMINISTRATEUR = 'administrateur',
  RESP_MODERATION = 'resp_moderation',
  RESP_ANIMATION = 'resp_animation',
  RESP_MJ = 'resp_mj',
  RESP_DOUANE = 'resp_douane',
  MODERATEUR_SENIOR = 'moderateur_senior',
  MODERATEUR = 'moderateur',
  ANIMATEUR_SENIOR = 'animateur_senior',
  ANIMATEUR = 'animateur',
  MJ_SENIOR = 'mj_senior',
  MJ = 'mj',
  DOUANIER_SENIOR = 'douanier_senior',
  DOUANIER = 'douanier',
  RESP_BUILDER = 'resp_builder',
  BUILDER = 'builder',
  RESP_LORE = 'resp_lore',
  LORE = 'lore',
  RESP_EQUILIBRAGE_PVP = 'resp_equilibrage_pvp',
  EQUILIBRAGE_PVP = 'equilibrage_pvp',
  RESP_CM = 'resp_cm',
  CM = 'cm',
}
```

### Hiérarchie

```
coordinateur
├── gerant_rp, gerant_dev, gerant_staff, gerant_discord, gerant_equilibrage, gerant_serveur
├── administrateur
├── resp_moderation
│   ├── moderateur_senior
│   └── moderateur
├── resp_animation
│   ├── animateur_senior
│   └── animateur
├── resp_mj
│   ├── mj_senior
│   └── mj
├── resp_douane
│   ├── douanier_senior
│   └── douanier
├── resp_builder
│   └── builder
├── resp_lore
│   └── lore
├── resp_equilibrage_pvp
│   └── equilibrage_pvp
└── resp_cm
    └── cm
```

Note : le pôle **Support** n'a pas de rôle dédié — seul le coordinateur peut y gérer des membres et saisir des paies.

### Pôles

```typescript
enum Pole {
  GERANCE = 'gerance',
  ADMINISTRATION = 'administration',
  MODERATION = 'moderation',
  ANIMATION = 'animation',
  MJ = 'mj',
  DOUANE = 'douane',
  BUILDER = 'builder',
  LORE = 'lore',
  EQUILIBRAGE_PVP = 'equilibrage_pvp',
  COMMUNITY_MANAGER = 'community_manager',
  SUPPORT = 'support',
}
```

Mapping rôle → pôle :

| Pôle | Rôles |
|---|---|
| Gérance | gerant_rp, gerant_dev, gerant_staff, gerant_discord, gerant_equilibrage, gerant_serveur |
| Administration | administrateur |
| Modération | resp_moderation, moderateur_senior, moderateur |
| Animation | resp_animation, animateur_senior, animateur |
| MJ | resp_mj, mj_senior, mj |
| Douane | resp_douane, douanier_senior, douanier |
| Builder | resp_builder, builder |
| Lore | resp_lore, lore |
| Équilibrage PvP | resp_equilibrage_pvp, equilibrage_pvp |
| Community Manager | resp_cm, cm |
| BDM | resp_bdm, bdm |
| Support | aucun rôle dédié (coordinateur uniquement) |

Le coordinateur n'appartient à aucun pôle, il supervise tous les pôles. Le pôle Support est spécial : pas de rôle dédié, seul le coordinateur peut y gérer des membres et saisir des paies. Les grades du pôle Support sont en texte libre (pas de liste fixe).

---

## Base de données

### Table `users`

```sql
create type user_role as enum (
  'coordinateur',
  'gerant_rp', 'gerant_dev', 'gerant_staff', 'gerant_discord', 'gerant_equilibrage', 'gerant_serveur',
  'administrateur',
  'resp_moderation', 'resp_animation', 'resp_mj', 'resp_douane',
  'moderateur_senior', 'moderateur',
  'animateur_senior', 'animateur',
  'mj_senior', 'mj',
  'douanier_senior', 'douanier',
  'resp_builder', 'builder',
  'resp_lore', 'lore',
  'resp_equilibrage_pvp', 'equilibrage_pvp',
  'resp_cm', 'cm'
);

create type pole_type as enum (
  'gerance', 'administration', 'moderation', 'animation', 'mj', 'douane',
  'builder', 'lore', 'equilibrage_pvp', 'community_manager', 'support'
);

create table users (
  id uuid primary key default gen_random_uuid(),
  supabase_auth_id uuid unique references auth.users(id),
  discord_id text unique not null,
  username text not null,
  avatar_url text,
  role user_role not null default 'moderateur',
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Le coordinateur ajoute manuellement les utilisateurs (Discord ID + username + rôle) via la page Administration. À la première connexion Discord, le `supabase_auth_id` est lié à l'utilisateur existant via le Discord ID.

### Table `payroll_weeks`

```sql
create type payroll_week_status as enum ('open', 'closed', 'locked');

create table payroll_weeks (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,          -- Toujours un lundi
  week_end date not null,            -- Toujours un dimanche
  status payroll_week_status not null default 'closed',
  opened_at timestamptz,             -- Quand le coordinateur a ouvert la saisie
  closed_at timestamptz,             -- Quand le coordinateur a fermé la saisie
  locked_at timestamptz,             -- Quand la semaine a été verrouillée (archivée)
  locked_by_id uuid references users(id),
  created_at timestamptz not null default now(),
  unique(week_start)
);
```

Statuts :
- `open` : la saisie est ouverte, les resp peuvent remplir et soumettre
- `closed` : la saisie est fermée, lecture seule pour les resp, le coordinateur peut encore modifier
- `locked` : verrouillée/archivée, plus aucune modification possible

Le coordinateur contrôle manuellement l'ouverture et la fermeture. Le verrouillage archive la semaine définitivement.

### Table `payroll_submissions`

Trace si un responsable a soumis ses paies pour une semaine donnée.

```sql
create type submission_status as enum ('draft', 'submitted');

create table payroll_submissions (
  id uuid primary key default gen_random_uuid(),
  payroll_week_id uuid not null references payroll_weeks(id) on delete cascade,
  submitted_by_id uuid not null references users(id),
  pole pole_type not null,
  status submission_status not null default 'draft',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(payroll_week_id, pole)
);
```

### Table `payroll_entries`

Une ligne par staff payé par semaine.

```sql
create table payroll_entries (
  id uuid primary key default gen_random_uuid(),
  payroll_week_id uuid not null references payroll_weeks(id) on delete cascade,
  submission_id uuid not null references payroll_submissions(id) on delete cascade,
  staff_id uuid references users(id),         -- Nullable si ajouté manuellement et pas encore dans users
  pole pole_type not null,

  -- Infos staff (pré-remplies ou saisies manuellement pour les nouveaux)
  discord_username text not null,
  discord_id text not null,
  steam_id text,
  grade text not null,                         -- Le grade au moment de la saisie (texte libre, ex: "Modérateur Senior")

  -- Compteurs spécifiques par pôle (nullable, seuls les champs du pôle concerné sont remplis)
  tickets_ig integer,                          -- Modération
  tickets_discord integer,                     -- Modération
  bda_count integer,                           -- Modération (saisi manuellement)
  nb_animations integer,                       -- Animation
  nb_animations_mj integer,                    -- MJ
  nb_candidatures_ecrites integer,             -- Douane
  nb_oraux integer,                            -- Douane

  -- Champs communs
  commentaire text,
  presence_reunion boolean not null default false,
  montant integer not null default 0,          -- En crédits (monnaie RP)

  -- Tracking modifications coordinateur
  modified_by_coordinator boolean not null default false,
  coordinator_modified_at timestamptz,

  -- Métadonnées
  filled_by_id uuid not null references users(id),  -- Le resp qui a rempli
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(payroll_week_id, discord_id)          -- Un seul entry par discord_id par semaine
);
```

### Table `pole_members`

Roster permanent des membres de chaque pôle. Indépendant des semaines de paie — les membres sont gérés ici et pré-remplis automatiquement dans les entries lors de la saisie.

```sql
create table pole_members (
  id uuid primary key default gen_random_uuid(),
  pole pole_type not null,
  discord_username text not null,
  discord_id text unique not null,
  steam_id text,
  grade text not null,
  staff_id uuid references users(id),       -- Nullable, lié si le membre a un compte panel
  added_by_id uuid not null references users(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(pole, discord_id)
);
```

### Index recommandés

```sql
create index idx_payroll_entries_week on payroll_entries(payroll_week_id);
create index idx_payroll_entries_pole on payroll_entries(pole);
create index idx_payroll_entries_staff on payroll_entries(staff_id);
create index idx_payroll_submissions_week on payroll_submissions(payroll_week_id);
create index idx_users_discord_id on users(discord_id);
create index idx_users_role on users(role);
create index idx_pole_members_pole on pole_members(pole);
create index idx_pole_members_discord_id on pole_members(discord_id);
create index idx_pole_members_active on pole_members(pole, is_active);
```

### Triggers

```sql
-- Mettre à jour updated_at automatiquement
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at before update on users
for each row execute function update_updated_at();

create trigger payroll_entries_updated_at before update on payroll_entries
for each row execute function update_updated_at();

create trigger payroll_submissions_updated_at before update on payroll_submissions
for each row execute function update_updated_at();
```

### Fonctions SQL utilitaires

```sql
-- Récupérer le pôle d'un rôle
create or replace function get_pole_for_role(r user_role)
returns pole_type as $$
begin
  return case
    when r in ('gerant_rp', 'gerant_dev', 'gerant_staff', 'gerant_discord', 'gerant_equilibrage', 'gerant_serveur') then 'gerance'::pole_type
    when r = 'administrateur' then 'administration'::pole_type
    when r in ('resp_moderation', 'moderateur_senior', 'moderateur') then 'moderation'::pole_type
    when r in ('resp_animation', 'animateur_senior', 'animateur') then 'animation'::pole_type
    when r in ('resp_mj', 'mj_senior', 'mj') then 'mj'::pole_type
    when r in ('resp_douane', 'douanier_senior', 'douanier') then 'douane'::pole_type
    when r in ('resp_builder', 'builder') then 'builder'::pole_type
    when r in ('resp_lore', 'lore') then 'lore'::pole_type
    when r in ('resp_equilibrage_pvp', 'equilibrage_pvp') then 'equilibrage_pvp'::pole_type
    when r in ('resp_cm', 'cm') then 'community_manager'::pole_type
    else null
  end;
end;
$$ language plpgsql immutable;

-- Vérifier si un rôle est responsable de pôle
create or replace function is_pole_responsible(r user_role)
returns boolean as $$
begin
  return r in (
    'resp_moderation', 'resp_animation', 'resp_mj', 'resp_douane',
    'resp_builder', 'resp_lore', 'resp_equilibrage_pvp', 'resp_cm'
  );
end;
$$ language plpgsql immutable;

-- Récupérer la semaine courante (lundi-dimanche)
create or replace function get_current_week()
returns table(week_start date, week_end date) as $$
begin
  return query select
    date_trunc('week', current_date)::date as week_start,
    (date_trunc('week', current_date) + interval '6 days')::date as week_end;
end;
$$ language plpgsql stable;
```

---

## Règles métier

### Qui remplit pour qui

| Qui remplit | Pour quel pôle | Pour quels rôles |
|---|---|---|
| Resp. Modération | moderation | moderateur, moderateur_senior |
| Resp. Animation | animation | animateur, animateur_senior |
| Resp. MJ | mj | mj, mj_senior |
| Resp. Douane | douane | douanier, douanier_senior |
| Resp. Builder | builder | builder |
| Resp. Lore | lore | lore |
| Resp. Équilibrage PvP | equilibrage_pvp | equilibrage_pvp |
| Resp. CM | community_manager | cm |
| Gérant Staff | administration + pôles des resp originaux | administrateur, resp_moderation, resp_animation, resp_mj, resp_douane |
| Coordinateur | **tous les pôles** (y compris support) | tous les staffs de tous les pôles |

Le coordinateur peut ajouter/modifier des staffs sur **n'importe quel pôle** (pas seulement gérance). Il dispose d'un sélecteur de pôle dans la saisie. Les autres responsables ne voient et ne remplissent que les staffs de leur périmètre.

### Champs spécifiques par pôle

**Modération** — champs compteurs :
- `tickets_ig` : nombre de tickets in-game (saisi manuellement)
- `tickets_discord` : nombre de tickets Discord (saisi manuellement)
- `bda_count` : nombre de BDA (saisi manuellement)

**Animation** — champs compteurs :
- `nb_animations` : nombre d'animations réalisées

**MJ** — champs compteurs :
- `nb_animations_mj` : nombre d'animations MJ réalisées

**Douane** — champs compteurs :
- `nb_candidatures_ecrites` : nombre de candidatures écrites traitées
- `nb_oraux` : nombre d'oraux réalisés

**Administration & Gérance** — pas de champs compteurs, uniquement les champs communs.

**Builder, Lore, Équilibrage PvP, Community Manager, Support** — pas de champs compteurs, uniquement les champs communs.

**Champs communs à tous les pôles** :
- `discord_username` : nom Discord
- `discord_id` : ID Discord
- `steam_id` : Steam ID (nullable pour les non-joueurs comme les admins)
- `grade` : grade au moment de la saisie
- `commentaire` : texte libre
- `presence_reunion` : case à cocher
- `montant` : montant en crédits (entier, pas de décimales)

### Grades disponibles par pôle

| Pôle | Grades |
|---|---|
| Modération | Modérateur, Modérateur Senior |
| Animation | Animateur, Animateur Senior |
| MJ | MJ, MJ Senior |
| Douane | Douanier, Douanier Senior |
| Administration | Administrateur, Resp. Modération, Resp. Animation, Resp. MJ, Resp. Douane |
| Gérance | Coordinateur, Gérant RP, Gérant Développement, Gérant Staff, Gérant Discord, Gérant Equilibrage, Gérant Serveur |
| Builder | Builder |
| Lore | Lore |
| Équilibrage PvP | Equilibrage |
| Community Manager | CM |
| BDM | BDM |
| Support | *(texte libre, pas de grades fixes)* |

### Dates des compteurs

Les colonnes compteurs affichent en sous-titre "du DD/MM au DD/MM" correspondant au lundi et dimanche de la semaine de paie en cours. Ces dates sont automatiques, pas saisies.

### Gestion des membres (page /members)

Les membres de chaque pôle sont gérés de manière **indépendante des semaines de paie** dans la table `pole_members` via la page /members :
- Ajout individuel ou import CSV en masse (format `discord_username,grade,discord_id,steam_id`)
- Modification inline du grade et du steam_id
- Désactivation (soft delete via `is_active = false`)
- Si le `discord_id` correspond à un user existant dans `users`, le `staff_id` est lié automatiquement
- Les membres ne sont **pas** automatiquement ajoutés à la table `users` — seul le coordinateur peut donner accès au panel via l'Administration

### Pré-remplissage des entries

Lors de la saisie des paies (`payroll-entries` GET), les membres actifs du pôle (`pole_members`) sont automatiquement pré-remplis comme entries vides (compteurs à null, montant 0, `is_prefilled: true`). Le resp ne fait que remplir les compteurs et montants. Il peut supprimer une entry de la semaine sans retirer le membre de `pole_members`.

### Cycle de la saisie (boutons)

- **Pas de semaine** → "Ouvrir la saisie" (crée + open)
- **Semaine open** → "Fermer la saisie"
- **Semaine closed** → "Rouvrir la saisie" + "Verrouiller (irréversible)"
- **Semaine locked** → aucun bouton

- **Période ouverte** : le bouton sauvegarde = "Soumettre les paies" (save + submit)
- **Période fermée + modifications** : le bouton sauvegarde = "Mettre à jour la liste" (save uniquement, sans re-soumission)

### Cycle de la saisie

1. Le **coordinateur ouvre la saisie** → crée ou met à jour `payroll_weeks` avec status `open`
2. Les **responsables remplissent** leurs tableaux → les données sont sauvegardées dans `payroll_entries` via la `payroll_submissions` de leur pôle (status `draft`)
3. Les **responsables soumettent** → `payroll_submissions.status` passe à `submitted`
4. Le **coordinateur ferme la saisie** → `payroll_weeks.status` passe à `closed`
5. Le **coordinateur peut modifier** les paies soumises dans la Vue Globale → `modified_by_coordinator = true` + `coordinator_modified_at` mis à jour
6. Le **coordinateur verrouille la semaine** → `payroll_weeks.status` passe à `locked`, la semaine est archivée

### Permissions d'édition

| Action | Qui peut | Condition |
|---|---|---|
| Remplir/modifier ses paies | Resp de pôle | Semaine status = `open` |
| Soumettre ses paies | Resp de pôle | Semaine status = `open` |
| Ajouter/supprimer des membres | Resp de pôle / Coordinateur | Toujours (sauf si `locked`) |
| Modifier les paies soumises d'un pôle | Coordinateur | Semaine status = `open` ou `closed`, pas `locked` |
| Remplir les paies de n'importe quel pôle | Coordinateur | Semaine status = `open` ou `closed`, pas `locked` |
| Ouvrir/fermer la saisie | Coordinateur | Toujours (sauf si `locked`) |
| Verrouiller la semaine | Coordinateur | Toujours (irréversible) |
| Exporter CSV/GSheets | Coordinateur | Toujours |

### Gestion des utilisateurs (Administration)

Le coordinateur est le seul à pouvoir :
- **Ajouter un utilisateur** : Discord ID + nom d'utilisateur + rôle → insert dans `users`
- **Modifier le rôle** d'un utilisateur → update `users.role`
- **Désactiver/réactiver** un utilisateur → update `users.is_active`
- **Supprimer** un utilisateur → delete de `users` (hard delete, ou soft delete via `is_active`)

Le coordinateur ne peut pas se modifier/désactiver/supprimer lui-même.

### Auth Discord — Flow

1. Frontend appelle `supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: '/auth/callback' } })`
2. Supabase Auth gère tout le OAuth2 (redirect Discord, échange code, création auth.user) et redirige vers `/auth/callback` avec une session active
3. Frontend récupère la session via `supabase.auth.getSession()`
4. Frontend appelle l'Edge Function `auth-me` (GET) avec le JWT
5. L'Edge Function :
   - Récupère le auth.user via `supabase.auth.getUser(jwt)`
   - Extrait le `discord_id` depuis `user.user_metadata.provider_id` ou `user.identities[0].id`
   - Cherche dans `users` WHERE `discord_id` = extracted_discord_id
   - Si trouvé et `is_active = true` → met à jour `supabase_auth_id`, `avatar_url`, `username`, `last_login_at` → retourne le user complet
   - Si trouvé et `is_active = false` → 403 "Votre accès a été désactivé"
   - Si pas trouvé → 403 "Vous n'avez pas accès au panel. Contactez le coordinateur."
6. Le frontend stocke le user dans Zustand et redirige vers le dashboard

Supabase Auth doit être configuré avec le provider Discord dans le dashboard Supabase (Settings → Authentication → Providers → Discord). Le `DISCORD_CLIENT_ID` et `DISCORD_CLIENT_SECRET` sont configurés directement dans le dashboard Supabase, pas dans les Edge Functions.

Seuls les utilisateurs **pré-enregistrés par le coordinateur** dans la table `users` peuvent se connecter. Supabase Auth crée le auth.user pour tout le monde, mais l'Edge Function `auth-me` rejette ceux qui ne sont pas dans la table `users`.

---

## Edge Functions

### Convention

Chaque Edge Function utilise les helpers partagés dans `_shared/` :

```typescript
// _shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

// _shared/auth.ts
// - Vérifie le JWT Supabase via supabase.auth.getUser()
// - Récupère le user depuis la table users via le supabase_auth_id
// - Retourne le user complet avec son rôle
// - Throw 401 si pas authentifié
// - Throw 403 si user désactivé (is_active = false)

// _shared/response.ts
// - jsonResponse(data, status = 200)
// - errorResponse(message, status = 400)
```

**Important** : chaque Edge Function a un `config.toml` avec `verify_jwt = false`. La vérification JWT du gateway Supabase est désactivée — c'est `_shared/auth.ts` qui gère l'authentification. Cela permet un contrôle plus fin (vérification du user dans la table `users`, check `is_active`, etc.).

Toute Edge Function :
1. Gère le preflight `OPTIONS` en premier (retourne corsHeaders)
2. Vérifie le JWT et récupère le user via `getUser(req)`
3. Utilise le **Supabase Admin Client** (`createClient` avec `SUPABASE_SERVICE_ROLE_KEY`) pour toutes les requêtes en base
4. Ne fait jamais confiance au frontend pour les données sensibles (rôle, permissions)

### Pattern type

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getUser } from '../_shared/auth.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const user = await getUser(req);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ... logique métier

    return jsonResponse(data);
  } catch (error) {
    return errorResponse(error.message, error.status ?? 400);
  }
});
```

### Liste des Edge Functions

| Fonction | Méthodes | Description | Accès |
|---|---|---|---|
| `auth-me` | GET | Vérifie le Discord ID post-login, lie le auth.user au user, retourne le profil | Tous |
| `payroll-weeks` | GET, POST, PATCH | Lister les semaines / Créer une semaine / Modifier statut (open/closed/locked) | GET: tous. POST/PATCH: coordinateur |
| `payroll-entries` | GET, POST, PUT, DELETE | Lister les entries d'une semaine (filtre par pôle) / Créer entries / Modifier entries / Supprimer une entry | Resp du pôle + coordinateur |
| `payroll-submit` | POST | Soumettre les paies d'un pôle pour une semaine | Resp du pôle |
| `payroll-export` | GET | Exporter les paies d'une semaine en CSV ou TSV | Coordinateur |
| `pole-members` | GET, POST, PUT, DELETE | CRUD des membres de pôle + POST /bulk pour import en masse | Resp du pôle + gérant staff + coordinateur |
| `admin-users` | GET, POST, PATCH, DELETE | CRUD des utilisateurs du panel | Coordinateur |
| `admin-payroll-control` | POST | Ouvrir/fermer/rouvrir la saisie, verrouiller une semaine | Coordinateur |

### Détails par Edge Function

#### `auth-me` (GET)

Pas de body, le JWT est dans le header Authorization.

Logique :
1. Récupère le auth.user via `supabase.auth.getUser(jwt)` (admin client)
2. Extrait le `discord_id` depuis `user.user_metadata.provider_id` ou `user.identities[0].id`
3. Cherche dans `users` WHERE `discord_id` = extracted_discord_id
4. Si pas trouvé → 403 "Accès refusé"
5. Si trouvé et `is_active = false` → 403 "Accès désactivé"
6. Update `users` : `supabase_auth_id = auth.user.id`, `avatar_url` (depuis user_metadata.avatar_url), `username` (depuis user_metadata.full_name ou custom_claims.global_name), `last_login_at = now()`
7. Retourne le user complet (id, discord_id, username, avatar_url, role, is_active, last_login_at)

#### `payroll-weeks` (GET)

Query params: `?current=true` (semaine courante) ou liste toutes les semaines pour l'historique.

Retourne : `{ id, week_start, week_end, status, opened_at, closed_at, locked_at, submissions: [...] }`

Les submissions indiquent quel pôle a soumis.

#### `payroll-entries` (GET)

Query params: `?week_id=uuid&pole=moderation`

Vérification d'accès :
- Si resp de pôle → ne retourne que les entries de son pôle
- Si gérant_staff → retourne entries des pôles administration + tous les resp
- Si coordinateur → retourne tout (filtrable par pôle)

Retourne les entries avec les infos user pré-remplies.

#### `payroll-entries` (POST / PUT)

Body: `{ week_id, entries: [{ discord_id, discord_username, steam_id, grade, tickets_ig, ..., montant }] }`

Logique :
1. Vérifie que la semaine est `open` (ou `open`/`closed` si coordinateur)
2. Vérifie que le user a le droit sur ce pôle
3. Upsert les entries (ON CONFLICT `payroll_week_id, discord_id`)
4. Si `staff_id` est null et qu'un user avec ce `discord_id` existe dans `users` → lie automatiquement
5. Si c'est le coordinateur qui modifie → set `modified_by_coordinator = true` et `coordinator_modified_at = now()`
6. Crée ou met à jour la `payroll_submissions` correspondante

#### `payroll-entries` (DELETE)

Query params: `?entry_id=uuid`

Logique :
1. Vérifie que l'entry existe et récupère la semaine associée
2. Vérifie que la semaine n'est pas `locked`
3. Vérifie que le user a le droit sur le pôle de l'entry (resp du pôle ou coordinateur)
4. Supprime l'entry

#### `payroll-submit` (POST)

Body: `{ week_id, pole }`

Logique :
1. Vérifie que la semaine est `open`
2. Vérifie que le user est resp du pôle
3. Vérifie qu'il y a au moins une entry avec un montant > 0
4. Met à jour `payroll_submissions.status = 'submitted'` et `submitted_at = now()`

#### `payroll-export` (GET)

Query params: `?week_id=uuid&format=csv` ou `?week_id=uuid&format=tsv`

Coordinateur uniquement. Retourne :
- `csv` : fichier CSV (Content-Type: text/csv, Content-Disposition: attachment)
- `tsv` : texte TSV (pour copier-coller dans Google Sheets)

Le CSV/TSV regroupe toutes les entries par pôle avec les colonnes spécifiques au pôle. Colonnes communes en premier (Pôle, Grade, Nom Discord, Discord ID, Steam ID), puis colonnes spécifiques, puis colonnes communes finales (Commentaire, Réunion, Montant).

#### `pole-members` (GET)

Query params: `?pole=moderation` (optionnel), `?include_inactive=true` (optionnel)

Vérification d'accès :
- Si resp de pôle → ne retourne que les membres actifs de son pôle
- Si gérant_staff → retourne les membres des pôles administration + resp
- Si coordinateur → retourne tout (filtrable par pôle)

Retourne les membres `is_active = true` par défaut.

#### `pole-members` (POST)

Body: `{ pole, discord_username, discord_id, steam_id?, grade }`

Vérifie que le user a le droit sur ce pôle. Vérifie que le discord_id n'existe pas déjà. Auto-lie `staff_id` si un user avec ce discord_id existe.

#### `pole-members` (PUT)

Body: `{ member_id, discord_username?, steam_id?, grade?, is_active? }`

Vérifie les droits sur le pôle du membre.

#### `pole-members` (DELETE)

Query param: `?member_id=uuid`

Soft delete via `is_active = false`.

#### `pole-members/bulk` (POST)

Body: `{ pole, members: [{ discord_username, discord_id, steam_id?, grade }] }`

Import en masse. Ignore les discord_id existants. Retourne `{ added, skipped, errors }`.

#### `admin-users` (GET)

Retourne tous les users. Coordinateur uniquement.

#### `admin-users` (POST)

Body: `{ discord_id, username, role }`

Crée un nouvel utilisateur. Coordinateur uniquement. Vérifie que le discord_id n'existe pas déjà.

#### `admin-users` (PATCH)

Body: `{ user_id, role?, is_active? }`

Modifie un utilisateur. Coordinateur uniquement. Empêche le coordinateur de se modifier lui-même.

#### `admin-users` (DELETE)

Body ou param: `{ user_id }`

Supprime un utilisateur. Coordinateur uniquement. Empêche le coordinateur de se supprimer lui-même. Cascade : supprime aussi le auth.user si lié.

#### `admin-payroll-control` (POST)

Body: `{ action: 'open' | 'close' | 'lock', week_id?: uuid }`

- `open` : crée la `payroll_weeks` de la semaine courante (si n'existe pas) et met status `open`, ou passe une semaine `closed` à `open`
- `close` : passe la semaine de `open` à `closed`
- `lock` : passe la semaine à `locked` (irréversible)

---

## Frontend

### Client Axios

```typescript
// src/api/client.ts
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`,
  headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
});

// Cache JWT en mémoire pour éviter d'appeler getSession() à chaque requête
let cachedToken: string | null = null;
let tokenExpiry = 0;

apiClient.interceptors.request.use(async (config) => {
  if (!cachedToken || Date.now() > tokenExpiry) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      cachedToken = session.access_token;
      tokenExpiry = (session.expires_at ?? 0) * 1000 - 60000; // refresh 1min avant expiry
    }
  }
  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`;
  }
  return config;
});

// Clear cache on sign out or token refresh
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    cachedToken = null;
    tokenExpiry = 0;
  }
});

export default apiClient;
```

### Pages et routing

```
/dev-login          → DevLoginPage (sélection de rôle, dev uniquement)
/login              → LoginPage (production, Discord OAuth)
/auth/callback      → AuthCallbackPage (récupère la session Supabase, appelle auth-me, redirige)
/dashboard          → DashboardPage
/payroll            → PayrollEntryPage (saisie par le resp)
/members            → MembersPage (gestion des membres du pôle)
/global             → GlobalViewPage (coordinateur, toutes les paies)
/history            → HistoryPage
/admin              → AdminPage (coordinateur)
```

### Navigation sidebar par rôle

| Rôle | Pages visibles |
|---|---|
| Resp pôle (resp_moderation, resp_animation, resp_mj, resp_douane, resp_builder, resp_lore, resp_equilibrage_pvp, resp_cm) | Dashboard, Saisie Paies, Membres, Historique |
| Gérant Staff | Dashboard, Saisie Paies, Membres, Historique |
| Coordinateur | Dashboard, Saisie Paies, Membres, Vue Globale, Historique, Administration |
| Autres rôles (modérateur, animateur, builder, lore, etc.) | Aucun accès au panel paies — pas de menu |

Seuls les **responsables, le gérant staff et le coordinateur** ont accès au panel paies. Les staffs de base (modérateurs, animateurs, etc.) n'y ont pas accès.

### TanStack Query — Conventions

- Query keys : `['payroll-weeks']`, `['payroll-weeks', 'current']`, `['payroll-entries', weekId, pole]`, `['pole-members', pole]`, `['admin-users']`
- Mutations invalident : `['payroll-entries']` + `['payroll-weeks']` pour les actions paies, `['admin-users']` pour les actions admin
- Configuration globale : `staleTime: 5min`, `gcTime: 10min`, `refetchOnWindowFocus: false` (optimisation performance prod)

### Invalidation des queries

| Mutation | Queries invalidées |
|---|---|
| saveEntries | payroll-entries, payroll-weeks |
| submitPayroll | payroll-entries, payroll-weeks |
| openPayroll | payroll-weeks |
| closePayroll | payroll-weeks |
| lockWeek | payroll-weeks |
| coordinatorEditEntries | payroll-entries, payroll-weeks |
| deleteEntry | payroll-entries |
| addMember | pole-members, payroll-entries |
| updateMember | pole-members, payroll-entries |
| deleteMember | pole-members, payroll-entries |
| bulkImportMembers | pole-members, payroll-entries |
| createUser | admin-users |
| updateUser | admin-users |
| deleteUser | admin-users |

---

## Variables d'environnement

### Frontend (.env)

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx      # Utilisé aussi comme header apikey pour le gateway
VITE_DEV_MODE=true              # Active la page dev-login
```

### Edge Functions (Supabase Dashboard → Secrets)

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

## Commandes

```bash
# Dev frontend
pnpm dev

# Supabase local
npx supabase start
npx supabase functions serve

# Déployer une Edge Function
npx supabase functions deploy <function-name>

# Déployer toutes les Edge Functions
npx supabase functions deploy

# Appliquer les migrations
npx supabase db push

# Reset la base locale
npx supabase db reset

# Générer les types TypeScript
npx supabase gen types typescript --local > src/types/database.types.ts
```

---

## Conventions de code

- TypeScript strict partout (frontend + Edge Functions)
- Interfaces pour les props, pas de `any`
- Nommage : camelCase (variables/fonctions), PascalCase (composants/types), snake_case (colonnes SQL, noms de fonctions Edge)
- Fichiers : kebab-case (ex: `payroll-entry-page.tsx`, `use-payroll.ts`)
- Un composant par fichier
- UI en français par défaut via i18n (toutes les chaînes passent par les fichiers de traduction)
- Dates formatées `DD/MM/YYYY` via `toLocaleDateString('fr-FR', ...)`
- Montants affichés comme entiers sans décimales, suffixe "crédits" dans les labels
- Aucun emoji dans l'UI, icônes Lucide React uniquement