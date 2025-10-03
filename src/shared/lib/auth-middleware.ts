import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "./types";

export interface AuthMiddlewareOptions {
  requiredRole?: UserRole;
  publicRoutes?: string[];
  protectedRoutes?: string[];
}

export async function authMiddleware(
  request: NextRequest,
  options: AuthMiddlewareOptions = {}
) {
  const { requiredRole, publicRoutes = [], protectedRoutes = [] } = options;

  const { pathname } = request.nextUrl;

  // Проверяем, является ли маршрут публичным
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Проверяем, является ли маршрут защищенным
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute || requiredRole) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    // Проверяем роль пользователя
    if (requiredRole && token.role !== requiredRole) {
      // Проверяем иерархию ролей
      const roleHierarchy = {
        [UserRole.USER]: [UserRole.USER],
        [UserRole.MODERATOR]: [UserRole.USER, UserRole.MODERATOR],
        [UserRole.ADMIN]: [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN],
      };

      const allowedRoles = roleHierarchy[requiredRole] || [];

      if (!allowedRoles.includes(token.role as UserRole)) {
        // Для админ-панели возвращаем 404 вместо 403
        if (requiredRole === UserRole.ADMIN) {
          return new NextResponse(null, { status: 404 });
        }

        return NextResponse.json(
          { error: "Недостаточно прав доступа" },
          { status: 403 }
        );
      }
    }
  }

  return NextResponse.next();
}

// Хелперы для проверки ролей
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [UserRole.USER]: [UserRole.USER],
    [UserRole.MODERATOR]: [UserRole.USER, UserRole.MODERATOR],
    [UserRole.ADMIN]: [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN],
  };

  const allowedRoles = roleHierarchy[requiredRole] || [];
  return allowedRoles.includes(userRole);
}

export function isAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN;
}

export function isModerator(userRole: UserRole): boolean {
  return userRole === UserRole.MODERATOR || userRole === UserRole.ADMIN;
}

export function isUser(userRole: UserRole): boolean {
  return (
    userRole === UserRole.USER ||
    userRole === UserRole.MODERATOR ||
    userRole === UserRole.ADMIN
  );
}
