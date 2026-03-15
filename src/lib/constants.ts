import { Role, Pole } from '@/types';

export const ROLE_TO_POLE: Record<Role, Pole | null> = {
  [Role.COORDINATEUR]: null,
  [Role.GERANT_RP]: Pole.GERANCE,
  [Role.GERANT_DEV]: Pole.GERANCE,
  [Role.GERANT_STAFF]: Pole.GERANCE,
  [Role.GERANT_DISCORD]: Pole.GERANCE,
  [Role.GERANT_EQUILIBRAGE]: Pole.GERANCE,
  [Role.GERANT_SERVEUR]: Pole.GERANCE,
  [Role.ADMINISTRATEUR]: Pole.ADMINISTRATION,
  [Role.RESP_MODERATION]: Pole.MODERATION,
  [Role.RESP_ANIMATION]: Pole.ANIMATION,
  [Role.RESP_MJ]: Pole.MJ,
  [Role.RESP_DOUANE]: Pole.DOUANE,
  [Role.MODERATEUR_SENIOR]: Pole.MODERATION,
  [Role.MODERATEUR]: Pole.MODERATION,
  [Role.ANIMATEUR_SENIOR]: Pole.ANIMATION,
  [Role.ANIMATEUR]: Pole.ANIMATION,
  [Role.MJ_SENIOR]: Pole.MJ,
  [Role.MJ]: Pole.MJ,
  [Role.DOUANIER_SENIOR]: Pole.DOUANE,
  [Role.DOUANIER]: Pole.DOUANE,
  [Role.RESP_BUILDER]: Pole.BUILDER,
  [Role.BUILDER]: Pole.BUILDER,
  [Role.RESP_LORE]: Pole.LORE,
  [Role.LORE]: Pole.LORE,
  [Role.RESP_EQUILIBRAGE_PVP]: Pole.EQUILIBRAGE_PVP,
  [Role.EQUILIBRAGE_PVP]: Pole.EQUILIBRAGE_PVP,
  [Role.RESP_CM]: Pole.COMMUNITY_MANAGER,
  [Role.CM]: Pole.COMMUNITY_MANAGER,
};

export const GRADES_BY_POLE: Record<Pole, string[]> = {
  [Pole.GERANCE]: [
    'Coordinateur',
    'Gérant Serveur',
    'Gérant Staff',
    'Gérant RP',
    'Gérant Equilibrage',
  ],
  [Pole.ADMINISTRATION]: ['Administrateur'],
  [Pole.MODERATION]: ['Responsable Modération', 'Modérateur Senior', 'Modérateur'],
  [Pole.ANIMATION]: ['Responsable Animation', 'Animateur Senior', 'Animateur'],
  [Pole.MJ]: ['Responsable MJ', 'MJ Senior', 'MJ'],
  [Pole.DOUANE]: ['Responsable Douane', 'Douanier Senior', 'Douanier'],
  [Pole.BUILDER]: ['Responsable Builder', 'Builder'],
  [Pole.COMMUNITY_MANAGER]: ['Responsable CM', 'CM'],
  [Pole.LORE]: ['Responsable Lore', 'Responsable Animation', 'Animateur', 'MJ', 'Lore'],
  [Pole.EQUILIBRAGE_PVP]: ['Equilibrage'],
  [Pole.STREAMER]: ['Référent Streamer'],
  [Pole.SUPPORT]: [],
};

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.COORDINATEUR]: 0,
  [Role.GERANT_RP]: 1,
  [Role.GERANT_DEV]: 1,
  [Role.GERANT_STAFF]: 1,
  [Role.GERANT_DISCORD]: 1,
  [Role.GERANT_EQUILIBRAGE]: 1,
  [Role.GERANT_SERVEUR]: 1,
  [Role.ADMINISTRATEUR]: 2,
  [Role.RESP_MODERATION]: 3,
  [Role.RESP_ANIMATION]: 3,
  [Role.RESP_MJ]: 3,
  [Role.RESP_DOUANE]: 3,
  [Role.MODERATEUR_SENIOR]: 4,
  [Role.ANIMATEUR_SENIOR]: 4,
  [Role.MJ_SENIOR]: 4,
  [Role.DOUANIER_SENIOR]: 4,
  [Role.MODERATEUR]: 5,
  [Role.ANIMATEUR]: 5,
  [Role.MJ]: 5,
  [Role.DOUANIER]: 5,
  [Role.RESP_BUILDER]: 3,
  [Role.BUILDER]: 5,
  [Role.RESP_LORE]: 3,
  [Role.LORE]: 5,
  [Role.RESP_EQUILIBRAGE_PVP]: 3,
  [Role.EQUILIBRAGE_PVP]: 5,
  [Role.RESP_CM]: 3,
  [Role.CM]: 5,
};

export const ROLE_LABELS: Record<Role, string> = {
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
};

export const POLE_LABELS: Record<Pole, string> = {
  [Pole.GERANCE]: 'Gérance',
  [Pole.ADMINISTRATION]: 'Administration',
  [Pole.MODERATION]: 'Modération',
  [Pole.ANIMATION]: 'Animation',
  [Pole.MJ]: 'Maître du Jeu',
  [Pole.DOUANE]: 'Douane',
  [Pole.BUILDER]: 'Builder',
  [Pole.COMMUNITY_MANAGER]: 'Community Manager',
  [Pole.LORE]: 'Lore',
  [Pole.EQUILIBRAGE_PVP]: 'Équilibrage PvP',
  [Pole.STREAMER]: 'Streamer',
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
];

export const PANEL_ACCESS_ROLES: Role[] = [
  Role.COORDINATEUR,
  Role.GERANT_STAFF,
  ...POLE_RESPONSIBLE_ROLES,
];

export const ASSIGNABLE_ROLES: Role[] = Object.values(Role).filter(
  (r) => r !== Role.COORDINATEUR,
);

const GERANCE_GRADE_ORDER: Record<string, number> = {
  'Coordinateur': 0,
  'Gérant Serveur': 1,
  'Gérant Staff': 2,
  'Gérant RP': 3,
  'Gérant Equilibrage': 4,
};

/** Returns a sort priority for a grade within a pole (lower = higher rank). */
export function getGradePriority(grade: string, pole: Pole): number {
  if (pole === Pole.GERANCE) {
    return GERANCE_GRADE_ORDER[grade] ?? 99;
  }
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
  if (role === Role.COORDINATEUR) return 'purple';
  if (role === Role.ADMINISTRATEUR) return 'cyan';
  if (role.startsWith('gerant_')) return 'info';
  if (role.startsWith('resp_')) return 'warning';
  return 'default';
}

export function getGradeBadgeVariant(grade: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'cyan' {
  const lower = grade.toLowerCase();
  if (lower === 'coordinateur') return 'purple';
  if (lower === 'administrateur') return 'cyan';
  if (lower.startsWith('gérant') || lower.startsWith('gerant')) return 'info';
  if (lower.startsWith('responsable') || lower.startsWith('resp')) return 'warning';
  if (lower.includes('senior')) return 'success';
  return 'default';
}

/** Per-grade unique colors for the members table. Returns { bg, text } CSS color strings. */
const GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  // Gérance
  'Coordinateur':              { bg: 'rgba(139, 92, 246, 0.12)', text: '#a78bfa' },  // violet
  'Gérant Serveur':            { bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa' },  // blue
  'Gérant Staff':              { bg: 'rgba(6, 182, 212, 0.12)',  text: '#22d3ee' },  // cyan
  'Gérant RP':                 { bg: 'rgba(236, 72, 153, 0.12)', text: '#f472b6' },  // pink
  'Gérant Equilibrage':        { bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24' },  // amber
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
  // Streamer
  'Référent Streamer':         { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8' },  // indigo
};

export function getGradeColor(grade: string): { bg: string; text: string } {
  return GRADE_COLORS[grade] ?? { bg: 'rgba(255, 255, 255, 0.06)', text: '#9b8a75' };
}

const POLE_COUNTER_FIELDS: Record<string, { field: string; label: string }[]> = {
  moderation: [
    { field: 'tickets_ig', label: 'ticketsIg' },
    { field: 'tickets_discord', label: 'ticketsDiscord' },
    { field: 'bda_count', label: 'bdaCount' },
  ],
  animation: [{ field: 'nb_animations', label: 'nbAnimations' }],
  mj: [{ field: 'nb_animations_mj', label: 'nbAnimationsMj' }],
  douane: [
    { field: 'nb_candidatures_ecrites', label: 'nbCandidaturesEcrites' },
    { field: 'nb_oraux', label: 'nbOraux' },
  ],
};

export function getPoleCounterFields(pole: Pole): { field: string; label: string }[] {
  return POLE_COUNTER_FIELDS[pole] ?? [];
}
