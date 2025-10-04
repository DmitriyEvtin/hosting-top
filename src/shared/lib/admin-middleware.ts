import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "./auth-config";
import { UserRole } from "./types";

export async function withAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Доступ запрещен. Требуются права администратора." },
        { status: 403 }
      );
    }

    return await handler(request);
  } catch (error) {
    console.error("Admin middleware error:", error);
    return NextResponse.json(
      { error: "Ошибка проверки прав доступа" },
      { status: 500 }
    );
  }
}
