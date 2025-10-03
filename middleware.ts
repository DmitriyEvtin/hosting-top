import { NextRequest } from "next/server";
import { authMiddleware } from "./src/shared/lib/auth-middleware";

export async function middleware(request: NextRequest) {
  // Определяем защищенные маршруты
  const protectedRoutes = [
    "/admin",
    "/dashboard",
    "/api/admin",
    "/api/protected",
  ];

  // Определяем публичные маршруты
  const publicRoutes = [
    "/",
    "/auth",
    "/api/auth",
    "/api/health",
    "/api/configuration",
    "/api/database/test",
    "/api/sentry",
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
