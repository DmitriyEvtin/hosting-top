import { UserRole } from "./types";

/**
 * Проверяет, имеет ли пользователь права менеджера или администратора
 */
export function hasManagerOrAdminAccess(userRole: UserRole): boolean {
  return userRole === UserRole.MANAGER || userRole === UserRole.ADMIN;
}

/**
 * Проверяет, является ли пользователь администратором
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN;
}

/**
 * Проверяет, является ли пользователь менеджером
 */
export function isManager(userRole: UserRole): boolean {
  return userRole === UserRole.MANAGER;
}

/**
 * Проверяет, имеет ли пользователь права администратора
 * (администратор наследует все роли)
 */
export function hasAdminAccess(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN;
}

/**
 * Проверяет, имеет ли пользователь права менеджера
 */
export function hasManagerAccess(userRole: UserRole): boolean {
  return userRole === UserRole.MANAGER || userRole === UserRole.ADMIN;
}

/**
 * Проверяет, имеет ли пользователь права модератора или выше
 */
export function hasModeratorAccess(userRole: UserRole): boolean {
  return [UserRole.ADMIN, UserRole.MANAGER, UserRole.MODERATOR].includes(
    userRole
  );
}

/**
 * Проверяет, имеет ли пользователь права пользователя или выше
 */
export function hasUserAccess(userRole: UserRole): boolean {
  return Object.values(UserRole).includes(userRole);
}
