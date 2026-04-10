import { Role, Pole } from '@/types';

/** Maps a grade display name to a hierarchy number (lower = higher rank). Used for cross-pole sorting. */
const GRADE_GLOBAL_ORDER: Record<string, number> = {
  'Développeur': 0,
  'Coordinateur': 1,
  'Gérant Serveur': 2,
  'Gérant Staff': 3,
  'Gérant RP': 4,
  'Gérant Equilibrage': 5,
  'Administrateur': 6,
  'Responsable Modération': 7,
  'Responsable Animation': 7,
  'Responsable MJ': 7,
  'Responsable Douane': 7,
  'Responsable Builder': 7,
  'Responsable CM': 7,
  'Responsable Lore': 7,
  'Responsable Modélisation': 7,
  'Modélisateur Senior': 8,
  'Modérateur Senior': 8,
  'Animateur Senior': 8,
  'MJ Senior': 8,
  'Douanier Senior': 8,
  'Modérateur': 9,
  'Animateur': 9,
  'MJ': 9,
  'Douanier': 9,
  'Builder': 9,
  'CM': 9,
  'Lore': 9,
  'Equilibrage': 9,
  'Modélisateur': 9,
  'Référent Streamer': 9,
};

export function getGradeGlobalPriority(grade: string): number {
  return GRADE_GLOBAL_ORDER[grade] ?? 99;
}

export const ROLE_TO_POLE: Record<Role, Pole | null> = {
  [Role.DEVELOPPEUR]: null,
  [Role.COORDINATEUR]: null,
  [Role.GERANT_RP]: Pole.GERANCE,
  [Role.GERANT_DEV]: Pole.GERANCE,
  [Role.GERANT_STAFF]: Pole.GERANCE,
  [Role.GERANT_DISCORD]: Pole.GERANCE,
  [Role.GERANT_EQUILIBRAGE]: Pole.GERANCE,
  [Role.GERANT_SERVEUR]: Pole.GERANCE,
  [Role.ADMINISTRATEUR]: Pole.ADMINISTRATION,
  [Role.RESP_MODERATION]: Pole.RESPONSABLES,
  [Role.RESP_ANIMATION]: Pole.RESPONSABLES,
  [Role.RESP_MJ]: Pole.RESPONSABLES,
  [Role.RESP_DOUANE]: Pole.RESPONSABLES,
  [Role.MODERATEUR_SENIOR]: Pole.MODERATION,
  [Role.MODERATEUR]: Pole.MODERATION,
  [Role.ANIMATEUR_SENIOR]: Pole.ANIMATION,
  [Role.ANIMATEUR]: Pole.ANIMATION,
  [Role.MJ_SENIOR]: Pole.MJ,
  [Role.MJ]: Pole.MJ,
  [Role.DOUANIER_SENIOR]: Pole.DOUANE,
  [Role.DOUANIER]: Pole.DOUANE,
  [Role.RESP_BUILDER]: Pole.RESPONSABLES,
  [Role.BUILDER]: Pole.BUILDER,
  [Role.RESP_LORE]: Pole.RESPONSABLES,
  [Role.LORE]: Pole.LORE,
  [Role.RESP_EQUILIBRAGE_PVP]: Pole.RESPONSABLES,
  [Role.EQUILIBRAGE_PVP]: Pole.EQUILIBRAGE_PVP,
  [Role.RESP_CM]: Pole.RESPONSABLES,
  [Role.CM]: Pole.COMMUNITY_MANAGER,
  [Role.RESP_MODELISATION]: Pole.RESPONSABLES,
  [Role.MODELISATEUR]: Pole.MODELISATION,
  [Role.REFERENT_STREAMER]: Pole.RESPONSABLES, // paid in responsables, fills no payroll
};

export const GRADES_BY_POLE: Record<Pole, string[]> = {
  [Pole.GERANCE]: [
    'Développeur',
    'Coordinateur',
    'Gérant Serveur',
    'Gérant Staff',
    'Gérant RP',
    'Gérant Equilibrage',
  ],
  [Pole.ADMINISTRATION]: ['Administrateur'],
  [Pole.RESPONSABLES]: [
    'Responsable Modération',
    'Responsable Animation',
    'Responsable MJ',
    'Responsable Douane',
    'Responsable Builder',
    'Responsable Lore',
    'Resp. Équilibrage PvP',
    'Responsable CM',
    'Responsable Modélisation',
    'Référent Streamer',
  ],
  [Pole.MODERATION]: ['Modérateur Senior', 'Modérateur'],
  [Pole.ANIMATION]: ['Animateur Senior', 'Animateur'],
  [Pole.MJ]: ['MJ Senior', 'MJ'],
  [Pole.DOUANE]: ['Douanier Senior', 'Douanier'],
  [Pole.BUILDER]: ['Builder'],
  [Pole.COMMUNITY_MANAGER]: ['CM'],
  [Pole.MODELISATION]: ['Modélisateur Senior', 'Modélisateur'],
  [Pole.LORE]: ['Lore'],
  [Pole.EQUILIBRAGE_PVP]: ['Equilibrage'],
  [Pole.SUPPORT]: [],
};

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.DEVELOPPEUR]: 0,
  [Role.COORDINATEUR]: 1,
  [Role.GERANT_SERVEUR]: 2,
  [Role.GERANT_STAFF]: 3,
  [Role.GERANT_RP]: 4,
  [Role.GERANT_DEV]: 5,
  [Role.GERANT_DISCORD]: 6,
  [Role.GERANT_EQUILIBRAGE]: 7,
  [Role.ADMINISTRATEUR]: 8,
  [Role.RESP_MODERATION]: 9,
  [Role.RESP_ANIMATION]: 10,
  [Role.RESP_MJ]: 11,
  [Role.RESP_DOUANE]: 12,
  [Role.RESP_BUILDER]: 13,
  [Role.RESP_CM]: 14,
  [Role.RESP_LORE]: 15,
  [Role.RESP_EQUILIBRAGE_PVP]: 16,
  [Role.RESP_MODELISATION]: 17,
  [Role.REFERENT_STREAMER]: 18,
  [Role.MODERATEUR_SENIOR]: 19,
  [Role.ANIMATEUR_SENIOR]: 20,
  [Role.MJ_SENIOR]: 21,
  [Role.DOUANIER_SENIOR]: 22,
  [Role.MODERATEUR]: 23,
  [Role.ANIMATEUR]: 24,
  [Role.MJ]: 25,
  [Role.DOUANIER]: 26,
  [Role.BUILDER]: 27,
  [Role.CM]: 28,
  [Role.LORE]: 29,
  [Role.EQUILIBRAGE_PVP]: 30,
  [Role.MODELISATEUR]: 31,
};

export const ROLE_LABELS: Record<Role, string> = {
  [Role.DEVELOPPEUR]: 'Développeur',
  [Role.COORDINATEUR]: 'Coordinateur',
  [Role.GERANT_RP]: 'Gérant RP',
  [Role.GERANT_DEV]: 'Gérant Développement',
  [Role.GERANT_STAFF]: 'Gérant Staff',
  [Role.GERANT_DISCORD]: 'Gérant Discord',
  [Role.GERANT_EQUILIBRAGE]: 'Gérant Equilibrage',
  [Role.GERANT_SERVEUR]: 'Gérant Serveur',
  [Role.ADMINISTRATEUR]: 'Administrateur',
  [Role.RESP_MODERATION]: 'Resp. Modération',
  [Role.RESP_ANIMATION]: 'Resp. Animation',
  [Role.RESP_MJ]: 'Resp. MJ',
  [Role.RESP_DOUANE]: 'Resp. Douane',
  [Role.MODERATEUR_SENIOR]: 'Modérateur Senior',
  [Role.MODERATEUR]: 'Modérateur',
  [Role.ANIMATEUR_SENIOR]: 'Animateur Senior',
  [Role.ANIMATEUR]: 'Animateur',
  [Role.MJ_SENIOR]: 'MJ Senior',
  [Role.MJ]: 'MJ',
  [Role.DOUANIER_SENIOR]: 'Douanier Senior',
  [Role.DOUANIER]: 'Douanier',
  [Role.RESP_BUILDER]: 'Resp. Builder',
  [Role.BUILDER]: 'Builder',
  [Role.RESP_LORE]: 'Resp. Lore',
  [Role.LORE]: 'Lore',
  [Role.RESP_EQUILIBRAGE_PVP]: 'Resp. Équilibrage PvP',
  [Role.EQUILIBRAGE_PVP]: 'Équilibrage PvP',
  [Role.RESP_CM]: 'Resp. CM',
  [Role.CM]: 'CM',
  [Role.RESP_MODELISATION]: 'Resp. Modélisation',
  [Role.MODELISATEUR]: 'Modélisateur',
  [Role.REFERENT_STREAMER]: 'Référent Streamer',
};

// Maps grade display names (from GRADES_BY_POLE / CSV) → Role enum values
export const GRADE_TO_ROLE: Record<string, Role> = {
  'Développeur': Role.DEVELOPPEUR,
  'Coordinateur': Role.COORDINATEUR,
  'Gérant Serveur': Role.GERANT_SERVEUR,
  'Gérant Staff': Role.GERANT_STAFF,
  'Gérant RP': Role.GERANT_RP,
  'Gérant Equilibrage': Role.GERANT_EQUILIBRAGE,
  'Administrateur': Role.ADMINISTRATEUR,
  'Responsable Modération': Role.RESP_MODERATION,
  'Modérateur Senior': Role.MODERATEUR_SENIOR,
  'Modérateur': Role.MODERATEUR,
  'Responsable Animation': Role.RESP_ANIMATION,
  'Animateur Senior': Role.ANIMATEUR_SENIOR,
  'Animateur': Role.ANIMATEUR,
  'Responsable MJ': Role.RESP_MJ,
  'MJ Senior': Role.MJ_SENIOR,
  'MJ': Role.MJ,
  'Responsable Douane': Role.RESP_DOUANE,
  'Douanier Senior': Role.DOUANIER_SENIOR,
  'Douanier': Role.DOUANIER,
  'Responsable Builder': Role.RESP_BUILDER,
  'Builder': Role.BUILDER,
  'Responsable CM': Role.RESP_CM,
  'CM': Role.CM,
  'Responsable Lore': Role.RESP_LORE,
  'Lore': Role.LORE,
  'Equilibrage': Role.EQUILIBRAGE_PVP,
  'Responsable Modélisation': Role.RESP_MODELISATION,
  'Modélisateur Senior': Role.MODELISATEUR,
  'Modélisateur': Role.MODELISATEUR,
  'Référent Streamer': Role.REFERENT_STREAMER,
};

export function gradeToRole(grade: string): Role | null {
  return GRADE_TO_ROLE[grade] ?? null;
}

/** Maps resp_ roles to the pole they FILL PAYROLL FOR (different from where they're paid). */
export const RESP_PAYROLL_POLE: Partial<Record<Role, Pole>> = {
  [Role.RESP_MODERATION]: Pole.MODERATION,
  [Role.RESP_ANIMATION]: Pole.ANIMATION,
  [Role.RESP_MJ]: Pole.MJ,
  [Role.RESP_DOUANE]: Pole.DOUANE,
  [Role.RESP_BUILDER]: Pole.BUILDER,
  [Role.RESP_LORE]: Pole.LORE,
  [Role.RESP_EQUILIBRAGE_PVP]: Pole.EQUILIBRAGE_PVP,
  [Role.RESP_CM]: Pole.COMMUNITY_MANAGER,
  [Role.RESP_MODELISATION]: Pole.MODELISATION,
  [Role.GERANT_EQUILIBRAGE]: Pole.EQUILIBRAGE_PVP,
};

export const POLE_LABELS: Record<Pole, string> = {
  [Pole.GERANCE]: 'Gérance',
  [Pole.ADMINISTRATION]: 'Administration',
  [Pole.RESPONSABLES]: 'Responsables',
  [Pole.MODERATION]: 'Modération',
  [Pole.ANIMATION]: 'Animation',
  [Pole.MJ]: 'Maître du Jeu',
  [Pole.DOUANE]: 'Douane',
  [Pole.BUILDER]: 'Builder',
  [Pole.COMMUNITY_MANAGER]: 'Community Manager',
  [Pole.MODELISATION]: 'Modélisation',
  [Pole.LORE]: 'Lore',
  [Pole.EQUILIBRAGE_PVP]: 'Équilibrage PvP',
  [Pole.SUPPORT]: 'Support',
};

export const PAYROLL_STATUS_LABELS: Record<string, string> = {
  open: 'Ouverte',
  closed: 'Fermée',
  locked: 'Verrouillée',
};

export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  submitted: 'Soumis',
};

export const POLE_RESPONSIBLE_ROLES: Role[] = [
  Role.RESP_MODERATION,
  Role.RESP_ANIMATION,
  Role.RESP_MJ,
  Role.RESP_DOUANE,
  Role.RESP_BUILDER,
  Role.RESP_LORE,
  Role.RESP_EQUILIBRAGE_PVP,
  Role.RESP_CM,
  Role.RESP_MODELISATION,
];

export const PANEL_ACCESS_ROLES: Role[] = [
  Role.DEVELOPPEUR,
  Role.COORDINATEUR,
  Role.GERANT_STAFF,
  Role.GERANT_EQUILIBRAGE,
  ...POLE_RESPONSIBLE_ROLES,
  Role.REFERENT_STREAMER,
];

export const ASSIGNABLE_ROLES: Role[] = Object.values(Role).filter(
  (r) => r !== Role.COORDINATEUR && r !== Role.DEVELOPPEUR,
);

const GERANCE_GRADE_ORDER: Record<string, number> = {
  'Développeur': 0,
  'Coordinateur': 1,
  'Gérant Serveur': 2,
  'Gérant Staff': 3,
  'Gérant RP': 4,
  'Gérant Equilibrage': 5,
};

const RESPONSABLES_GRADE_ORDER: Record<string, number> = {
  'Responsable Modération': 0,
  'Responsable MJ': 1,
  'Responsable Lore': 2,
  'Responsable Douane': 3,
  'Responsable CM': 4,
  'Responsable Builder': 5,
  'Responsable Animation': 6,
  'Resp. Équilibrage PvP': 7,
  'Responsable Modélisation': 8,
  'Référent Streamer': 9,
};

/** Returns a sort priority for a grade within a pole (lower = higher rank). */
export function getGradePriority(grade: string, pole: Pole): number {
  if (pole === Pole.GERANCE) return GERANCE_GRADE_ORDER[grade] ?? 99;
  if (pole === Pole.RESPONSABLES) return RESPONSABLES_GRADE_ORDER[grade] ?? 99;
  const lower = grade.toLowerCase();
  if (lower.startsWith('responsable') || lower.startsWith('resp')) return 0;
  if (lower.includes('senior')) return 1;
  return 2;
}

/** Sort comparator for entries with grade + discord_username. */
export function compareByGradeThenName(
  a: { grade: string; discord_username: string },
  b: { grade: string; discord_username: string },
  pole: Pole,
): number {
  const pa = getGradePriority(a.grade, pole);
  const pb = getGradePriority(b.grade, pole);
  if (pa !== pb) return pa - pb;
  return a.discord_username.localeCompare(b.discord_username);
}

export function getRoleBadgeVariant(role: Role): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'cyan' {
  if (role === Role.DEVELOPPEUR || role === Role.COORDINATEUR) return 'purple';
  if (role === Role.ADMINISTRATEUR) return 'cyan';
  if (role.startsWith('gerant_')) return 'info';
  if (role.startsWith('resp_')) return 'warning';
  return 'default';
}

export function getGradeBadgeVariant(grade: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'cyan' {
  const lower = grade.toLowerCase();
  if (lower === 'développeur' || lower === 'developpeur' || lower === 'coordinateur') return 'purple';
  if (lower === 'administrateur') return 'cyan';
  if (lower.startsWith('gérant') || lower.startsWith('gerant')) return 'info';
  if (lower.startsWith('responsable') || lower.startsWith('resp')) return 'warning';
  if (lower.includes('senior')) return 'success';
  return 'default';
}

/** Per-grade unique colors for the members table. Returns { bg, text } CSS color strings. */
const GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  // Gérance
  'Développeur':               { bg: 'rgba(139, 92, 246, 0.18)', text: '#c4b5fd' },  // violet strong
  'Coordinateur':              { bg: 'rgba(139, 92, 246, 0.12)', text: '#a78bfa' },  // violet
  'Gérant Serveur':            { bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa' },  // blue
  'Gérant Staff':              { bg: 'rgba(6, 182, 212, 0.12)',  text: '#22d3ee' },  // cyan
  'Gérant RP':                 { bg: 'rgba(236, 72, 153, 0.12)', text: '#f472b6' },  // pink
  'Gérant Equilibrage':        { bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24' },  // amber
  'Gérant Développement':      { bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa' },  // blue (same as serveur)
  'Gérant Discord':            { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8' },  // indigo
  // Administration
  'Administrateur':            { bg: 'rgba(6, 182, 212, 0.12)',  text: '#22d3ee' },  // cyan
  // Modération
  'Responsable Modération':    { bg: 'rgba(244, 63, 94, 0.15)',  text: '#fb7185' },  // rose strong
  'Modérateur Senior':         { bg: 'rgba(244, 63, 94, 0.12)',  text: '#fb7185' },  // rose
  'Modérateur':                { bg: 'rgba(244, 63, 94, 0.08)',  text: '#fda4af' },  // rose lighter
  // Animation
  'Responsable Animation':     { bg: 'rgba(251, 146, 60, 0.15)', text: '#fb923c' },  // orange strong
  'Animateur Senior':          { bg: 'rgba(251, 146, 60, 0.12)', text: '#fb923c' },  // orange
  'Animateur':                 { bg: 'rgba(251, 146, 60, 0.08)', text: '#fdba74' },  // orange lighter
  // MJ
  'Responsable MJ':            { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc' },  // purple strong
  'MJ Senior':                 { bg: 'rgba(168, 85, 247, 0.12)', text: '#c084fc' },  // purple
  'MJ':                        { bg: 'rgba(168, 85, 247, 0.08)', text: '#d8b4fe' },  // purple lighter
  // Douane
  'Responsable Douane':        { bg: 'rgba(34, 197, 94, 0.15)',  text: '#4ade80' },  // green strong
  'Douanier Senior':           { bg: 'rgba(34, 197, 94, 0.12)',  text: '#4ade80' },  // green
  'Douanier':                  { bg: 'rgba(34, 197, 94, 0.08)',  text: '#86efac' },  // green lighter
  // Builder
  'Responsable Builder':       { bg: 'rgba(234, 179, 8, 0.15)',  text: '#facc15' },  // yellow strong
  'Builder':                   { bg: 'rgba(234, 179, 8, 0.08)',  text: '#fde047' },  // yellow lighter
  // Community Manager
  'Responsable CM':            { bg: 'rgba(45, 212, 191, 0.15)', text: '#2dd4bf' },  // teal strong
  'CM':                        { bg: 'rgba(45, 212, 191, 0.08)', text: '#5eead4' },  // teal lighter
  // Lore
  'Responsable Lore':          { bg: 'rgba(14, 165, 233, 0.15)', text: '#38bdf8' },  // sky strong
  'Lore':                      { bg: 'rgba(14, 165, 233, 0.08)', text: '#7dd3fc' },  // sky lighter
  // Équilibrage PvP
  'Equilibrage':               { bg: 'rgba(239, 68, 68, 0.10)', text: '#fca5a5' },  // red
  // Modélisation
  'Responsable Modélisation':  { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' },  // emerald strong
  'Modélisateur Senior':       { bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399' },  // emerald
  'Modélisateur':              { bg: 'rgba(16, 185, 129, 0.08)', text: '#6ee7b7' },  // emerald lighter
  // Streamer
  'Référent Streamer':         { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8' },  // indigo
  // Short-form aliases (used by ROLE_LABELS)
  'Resp. Modération':          { bg: 'rgba(244, 63, 94, 0.15)',  text: '#fb7185' },
  'Resp. Animation':           { bg: 'rgba(251, 146, 60, 0.15)', text: '#fb923c' },
  'Resp. MJ':                  { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc' },
  'Resp. Douane':              { bg: 'rgba(34, 197, 94, 0.15)',  text: '#4ade80' },
  'Resp. Builder':             { bg: 'rgba(234, 179, 8, 0.15)',  text: '#facc15' },
  'Resp. CM':                  { bg: 'rgba(45, 212, 191, 0.15)', text: '#2dd4bf' },
  'Resp. Lore':                { bg: 'rgba(14, 165, 233, 0.15)', text: '#38bdf8' },
  'Resp. Équilibrage PvP':     { bg: 'rgba(239, 68, 68, 0.12)', text: '#fca5a5' },
  'Équilibrage PvP':           { bg: 'rgba(239, 68, 68, 0.10)', text: '#fca5a5' },
};

export function getGradeColor(grade: string): { bg: string; text: string } {
  return GRADE_COLORS[grade] ?? { bg: 'rgba(255, 255, 255, 0.06)', text: '#9b8a75' };
}

const POLE_COUNTER_FIELDS: Partial<Record<Pole, { field: string; label: string }[]>> = {
  moderation: [
    { field: 'tickets_ig', label: 'ticketsIg' },
    { field: 'tickets_discord', label: 'ticketsDiscord' },
    { field: 'bda_count', label: 'bdaCount' },
  ],
  animation: [{ field: 'nb_animations', label: 'nbAnimations' }],
  mj: [
    { field: 'nb_animations_mj_p', label: 'nbAnimationsMjP' },
    { field: 'nb_animations_mj_m', label: 'nbAnimationsMjM' },
    { field: 'nb_animations_mj_g', label: 'nbAnimationsMjG' },
  ],
  douane: [
    { field: 'nb_candidatures_ecrites', label: 'nbCandidaturesEcrites' },
    { field: 'nb_oraux', label: 'nbOraux' },
  ],
};

export function getPoleCounterFields(pole: Pole): { field: string; label: string }[] {
  return POLE_COUNTER_FIELDS[pole] ?? [];
}
