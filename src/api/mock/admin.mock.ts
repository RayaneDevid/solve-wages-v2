import { Role } from '@/types';
import type { User } from '@/types';

const MOCK_USERS: Omit<User, 'roles'>[] = [
  {
    id: '1',
    supabase_auth_id: null,
    discord_id: '123456789012345678',
    username: 'NarutoSensei',
    avatar_url: null,
    role: Role.COORDINATEUR,
    is_active: true,
    last_login_at: '2026-03-18T10:30:00Z',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-03-18T10:30:00Z',
  },
  {
    id: '2',
    supabase_auth_id: null,
    discord_id: '234567890123456789',
    username: 'SakuraRP',
    avatar_url: null,
    role: Role.GERANT_STAFF,
    is_active: true,
    last_login_at: '2026-03-17T14:20:00Z',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-03-17T14:20:00Z',
  },
  {
    id: '3',
    supabase_auth_id: null,
    discord_id: '345678901234567890',
    username: 'KakashiMod',
    avatar_url: null,
    role: Role.RESP_MODERATION,
    is_active: true,
    last_login_at: '2026-03-16T09:00:00Z',
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-03-16T09:00:00Z',
  },
  {
    id: '4',
    supabase_auth_id: null,
    discord_id: '456789012345678901',
    username: 'SasukeAnim',
    avatar_url: null,
    role: Role.RESP_ANIMATION,
    is_active: true,
    last_login_at: '2026-03-15T18:45:00Z',
    created_at: '2026-02-10T00:00:00Z',
    updated_at: '2026-03-15T18:45:00Z',
  },
  {
    id: '5',
    supabase_auth_id: null,
    discord_id: '567890123456789012',
    username: 'HinataMJ',
    avatar_url: null,
    role: Role.RESP_MJ,
    is_active: true,
    last_login_at: null,
    created_at: '2026-02-20T00:00:00Z',
    updated_at: '2026-02-20T00:00:00Z',
  },
  {
    id: '6',
    supabase_auth_id: null,
    discord_id: '678901234567890123',
    username: 'ShikamaruDouane',
    avatar_url: null,
    role: Role.RESP_DOUANE,
    is_active: false,
    last_login_at: '2026-03-01T12:00:00Z',
    created_at: '2026-01-20T00:00:00Z',
    updated_at: '2026-03-10T00:00:00Z',
  },
  {
    id: '7',
    supabase_auth_id: null,
    discord_id: '789012345678901234',
    username: 'GaaraAdmin',
    avatar_url: null,
    role: Role.ADMINISTRATEUR,
    is_active: true,
    last_login_at: '2026-03-18T08:15:00Z',
    created_at: '2026-01-05T00:00:00Z',
    updated_at: '2026-03-18T08:15:00Z',
  },
  {
    id: '8',
    supabase_auth_id: null,
    discord_id: '890123456789012345',
    username: 'NejiMod',
    avatar_url: null,
    role: Role.MODERATEUR_SENIOR,
    is_active: true,
    last_login_at: '2026-03-14T16:30:00Z',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-14T16:30:00Z',
  },
  {
    id: '9',
    supabase_auth_id: null,
    discord_id: '901234567890123456',
    username: 'LeeAnimateur',
    avatar_url: null,
    role: Role.ANIMATEUR,
    is_active: true,
    last_login_at: '2026-03-12T20:00:00Z',
    created_at: '2026-03-05T00:00:00Z',
    updated_at: '2026-03-12T20:00:00Z',
  },
  {
    id: '10',
    supabase_auth_id: null,
    discord_id: '012345678901234567',
    username: 'TentenInactif',
    avatar_url: null,
    role: Role.DOUANIER,
    is_active: false,
    last_login_at: '2026-02-28T11:00:00Z',
    created_at: '2026-02-15T00:00:00Z',
    updated_at: '2026-03-08T00:00:00Z',
  },
];

let users: User[] = MOCK_USERS.map((u) => ({ ...u, roles: [u.role] }));

function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockGetUsers(): Promise<User[]> {
  await delay();
  return [...users];
}

export async function mockCreateUser(payload: {
  discord_id: string;
  username: string;
  roles: Role[];
}): Promise<User> {
  await delay();
  if (users.some((u) => u.discord_id === payload.discord_id)) {
    throw new Error('Discord ID already exists');
  }
  const primaryRole = payload.roles[0] ?? Role.MODERATEUR;
  const newUser: User = {
    id: crypto.randomUUID(),
    supabase_auth_id: null,
    discord_id: payload.discord_id,
    username: payload.username,
    avatar_url: null,
    role: primaryRole,
    roles: payload.roles,
    is_active: true,
    last_login_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  users = [...users, newUser];
  return newUser;
}

export async function mockUpdateUser(payload: {
  user_id: string;
  roles?: Role[];
  is_active?: boolean;
}): Promise<User> {
  await delay();
  const idx = users.findIndex((u) => u.id === payload.user_id);
  if (idx === -1) throw new Error('User not found');
  const updated: User = {
    ...users[idx],
    ...(payload.roles !== undefined && { roles: payload.roles, role: payload.roles[0] ?? users[idx].role }),
    ...(payload.is_active !== undefined && { is_active: payload.is_active }),
    updated_at: new Date().toISOString(),
  };
  users = users.map((u) => (u.id === payload.user_id ? updated : u));
  return updated;
}

export async function mockDeleteUser(userId: string): Promise<void> {
  await delay();
  users = users.filter((u) => u.id !== userId);
}
