import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Role } from '@/types';
import { ROLE_TO_POLE, POLE_RESPONSIBLE_ROLES, PANEL_ACCESS_ROLES } from './constants';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getPoleForRole(role: Role) {
  return ROLE_TO_POLE[role];
}

export function isPoleResponsible(role: Role): boolean {
  return POLE_RESPONSIBLE_ROLES.includes(role);
}

export function isCoordinateur(role: Role): boolean {
  return role === Role.COORDINATEUR || role === Role.DEVELOPPEUR;
}

export function isGerantStaff(role: Role): boolean {
  return role === Role.GERANT_STAFF;
}

export function hasPanelAccess(role: Role): boolean {
  return PANEL_ACCESS_ROLES.includes(role);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  });
}
