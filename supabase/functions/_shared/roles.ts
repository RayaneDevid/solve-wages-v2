export const RESP_TO_POLE: Record<string, string> = {
  resp_moderation: 'moderation',
  resp_animation: 'animation',
  resp_mj: 'mj',
  resp_douane: 'douane',
  resp_builder: 'builder',
  resp_lore: 'lore',
  resp_equilibrage_pvp: 'equilibrage_pvp',
  resp_cm: 'community_manager',
  gerant_equilibrage: 'equilibrage_pvp',
};

export const GERANT_STAFF_POLES = ['administration', 'moderation', 'animation', 'mj', 'douane', 'responsables'];

export interface AppUser {
  id: string;
  role: string;
  roles: string[];
}

export function isAdmin(user: AppUser): boolean {
  return user.roles.includes('coordinateur') || user.roles.includes('developpeur');
}

export function canAccessPole(user: AppUser, pole: string): boolean {
  if (isAdmin(user)) return true;
  return user.roles.some((r) => {
    if (r === 'gerant_staff') return GERANT_STAFF_POLES.includes(pole);
    return RESP_TO_POLE[r] === pole;
  });
}

export function getAllowedPoles(user: AppUser): string[] | null {
  if (isAdmin(user)) return null; // null = all poles
  const poles = new Set<string>();
  for (const r of user.roles) {
    if (r === 'gerant_staff') {
      GERANT_STAFF_POLES.forEach((p) => poles.add(p));
    } else {
      const respPole = RESP_TO_POLE[r];
      if (respPole) poles.add(respPole);
    }
  }
  return [...poles];
}
