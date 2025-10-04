/**
 * API endpoint для проверки статуса email сервиса
 * Требует аутентификации
 */

import { emailService } from "@/shared/api/email";
import { authOptions } from "@/shared/lib/auth-config";
import { hasSmtp } from "@/shared/lib/env-simple";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isConfigured = emailService.isConfigured();

    return NextResponse.json({
      configured: isConfigured,
      smtpAvailable: hasSmtp,
      status: isConfigured ? "ready" : "not_configured",
    });
  } catch (error) {
    console.error("Email status check failed:", error);
    return NextResponse.json(
      {
        configured: false,
        smtpAvailable: false,
        status: "error",
        error: "Failed to check email status",
      },
      { status: 500 }
    );
  }
}
