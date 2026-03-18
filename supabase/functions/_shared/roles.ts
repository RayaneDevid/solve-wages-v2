export const RESP_TO_POLE: Record<string, string> = {
  resp_moderation: 'moderation',
  resp_animation: 'animation',
  resp_mj: 'mj',
  resp_douane: 'douane',
  resp_builder: 'builder',
  resp_lore: 'lore',
  resp_equilibrage_pvp: 'equilibrage_pvp',
  resp_cm: 'community_manager',
};

export const GERANT_STAFF_POLES = ['administration', 'moderation', 'animation', 'mj', 'douane'];

export interface AppUser {
  id: string;
  role: string;
}

export function canAccessPole(user: AppUser, pole: string): boolean {
  if (user.role === 'coordinateur') return true;
  if (user.role === 'gerant_staff') return GERANT_STAFF_POLES.includes(pole);
  const respPole = RESP_TO_POLE[user.role];
  return respPole === pole;
}

export function getAllowedPoles(user: AppUser): string[] | null {
  if (user.role === 'coordinateur') return null; // null = all poles
  if (user.role === 'gerant_staff') return GERANT_STAFF_POLES;
  const respPole = RESP_TO_POLE[user.role];
  if (respPole) return [respPole];
  return [];
}
