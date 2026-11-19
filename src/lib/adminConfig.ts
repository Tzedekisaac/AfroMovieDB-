import type { UserRole } from '../types.ts';

function readEnvVar(name: string): string {
  const metaEnv = (import.meta as { env?: Record<string, string | undefined> }).env;
  if (metaEnv && typeof metaEnv[name] === 'string') {
    return metaEnv[name]!.trim();
  }
  if (typeof process !== 'undefined' && process.env && typeof process.env[name] === 'string') {
    return process.env[name]!.trim();
  }
  return '';
}

export const PRIMARY_OWNER_UID: string = readEnvVar('VITE_PRIMARY_OWNER_UID') || '';

export const PRIMARY_OWNER_EMAIL: string = readEnvVar('VITE_PRIMARY_OWNER_EMAIL') || '';

if (!PRIMARY_OWNER_UID && !PRIMARY_OWNER_EMAIL) {
  console.warn(
    '[adminConfig] VITE_PRIMARY_OWNER_UID and VITE_PRIMARY_OWNER_EMAIL are not configured; primary owner fallback is disabled.'
  );
}

export interface UserIdentity {
  uid?: string | null;
  email?: string | null;
}

export interface RoleProfileLike extends UserIdentity {
  role?: UserRole | string | null;
  isAdmin?: boolean | null;
}

/**
 * Checks if the given identity matches the configured primary system owner UID or email.
 * Returns false safely whenever owner environment variables are unset or empty.
 */
export function isUserOwner(user?: UserIdentity | null): boolean {
  if (!user) return false;
  if (PRIMARY_OWNER_UID && user.uid && user.uid === PRIMARY_OWNER_UID) {
    return true;
  }
  if (
    PRIMARY_OWNER_EMAIL &&
    user.email &&
    user.email.trim().toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase()
  ) {
    return true;
  }
  return false;
}

/**
 * Single authoritative role resolver for any user/profile pair.
 * Enforces owner precedence and reconciles legacy `isAdmin` flags with `role`.
 */
export function resolveUserRole(
  profile?: RoleProfileLike | null,
  user?: UserIdentity | null
): UserRole {
  if (isUserOwner(user) || isUserOwner(profile)) {
    return 'owner';
  }
  if (profile?.role === 'owner') {
    return 'owner';
  }
  if (profile?.role === 'admin' || profile?.isAdmin === true) {
    return 'admin';
  }
  if (profile?.role === 'moderator') {
    return 'moderator';
  }
  return 'user';
}

/**
 * Checks if the user is an administrator or system owner.
 */
export function isUserAdminOrOwner(
  profile?: RoleProfileLike | null,
  user?: UserIdentity | null
): boolean {
  const role = resolveUserRole(profile, user);
  return role === 'owner' || role === 'admin';
}

/**
 * Checks if the user has moderator privileges or higher (moderator, admin, owner).
 */
export function isUserModeratorOrHigher(
  profile?: RoleProfileLike | null,
  user?: UserIdentity | null
): boolean {
  const role = resolveUserRole(profile, user);
  return role === 'owner' || role === 'admin' || role === 'moderator';
}

/**
 * Checks if the resolved user role satisfies the provided allowed roles list.
 */
export function hasRequiredRole(
  allowedRoles: UserRole[],
  profile?: RoleProfileLike | null,
  user?: UserIdentity | null
): boolean {
  const role = resolveUserRole(profile, user);
  if (role === 'owner') return true;
  return allowedRoles.includes(role);
}
