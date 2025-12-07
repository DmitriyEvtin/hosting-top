import { NextRequest } from "next/server";
import { authMiddleware } from "./src/shared/lib/auth-middleware";
import { UserRole } from "./src/shared/lib/types";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Определяем публичные маршруты
  const publicRoutes = [
    "/",
    "/auth",
    "/api/auth",
    "/api/health",
    "/api/configuration",
    "/api/database/test",
    "/api/sentry",
    "/api/public",
  ];

  // Проверяем, является ли маршрут публичным
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return authMiddleware(request, {
      publicRoutes,
    });
  }

  // Специальная защита для админ-панели
  if (pathname.startsWith("/admin")) {
    return authMiddleware(request, {
      requiredRole: UserRole.ADMIN,
      publicRoutes,
    });
  }

  // Специальная защита для менеджер-панели
  if (pathname.startsWith("/manager")) {
    return authMiddleware(request, {
      requiredRole: UserRole.MANAGER,
      publicRoutes,
    });
  }

  // Обычная защита для других маршрутов
  const protectedRoutes = [
    "/profile",
    "/dashboard",
    "/api/admin",
    "/api/protected",
  ];

  return authMiddleware(request, {
    protectedRoutes,
    publicRoutes,
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
