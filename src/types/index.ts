export enum Role {
  DEVELOPPEUR = 'developpeur',
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
  REFERENT_STREAMER = 'referent_streamer',
}

export enum Pole {
  GERANCE = 'gerance',
  ADMINISTRATION = 'administration',
  RESPONSABLES = 'responsables',
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

export type PayrollWeekStatus = 'open' | 'closed' | 'locked';
export type SubmissionStatus = 'draft' | 'submitted';

export interface User {
  id: string;
  supabase_auth_id: string | null;
  discord_id: string;
  username: string;
  avatar_url: string | null;
  role: Role;
  roles: Role[];
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollWeek {
  id: string;
  week_start: string;
  week_end: string;
  status: PayrollWeekStatus;
  opened_at: string | null;
  closed_at: string | null;
  locked_at: string | null;
  locked_by_id: string | null;
  created_at: string;
  submissions: PayrollSubmission[];
}

export interface PayrollSubmission {
  id: string;
  payroll_week_id: string;
  submitted_by_id: string;
  submitted_by_username: string | null;
  pole: Pole;
  status: SubmissionStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PoleMember {
  id: string;
  pole: Pole;
  discord_username: string;
  discord_id: string;
  steam_id: string | null;
  grade: string;
  staff_id: string | null;
  added_by_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BulkImportResult {
  added: number;
  reactivated: number;
  skipped: number;
  errors: string[];
}

export type PrimeStatus = 'pending' | 'approved' | 'rejected';

export interface Prime {
  id: string;
  payroll_week_id: string;
  discord_id: string;
  discord_username: string;
  amount: number;
  comment: string | null;
  submitted_by_id: string | null;
  status: PrimeStatus;
  reviewed_by_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollEntry {
  id: string | null;
  payroll_week_id: string;
  submission_id: string;
  staff_id: string | null;
  pole: Pole;
  discord_username: string;
  discord_id: string;
  steam_id: string | null;
  grade: string;
  tickets_ig: number | null;
  tickets_discord: number | null;
  bda_count: number | null;
  nb_animations: number | null;
  nb_animations_mj: number | null;
  nb_candidatures_ecrites: number | null;
  nb_oraux: number | null;
  commentaire: string | null;
  presence_reunion: boolean;
  montant: number;
  is_inactive: boolean;
  confirmed_by_coordinator: boolean;
  confirmed_at: string | null;
  modified_by_coordinator: boolean;
  coordinator_modified_at: string | null;
  filled_by_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_prefilled?: boolean;
}
