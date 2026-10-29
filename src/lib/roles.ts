/** src\lib\roles.ts - utilidades */

import type { Role } from '../types/database';

export function roleHomePath(role: Role | null): string {
  if (role === 'admin') return '/admin';
  if (role === 'vendedor') return '/vendedor';
  if (role === 'cliente') return '/cliente';
  return '/';
}
