/**
 * API endpoint для проверки статуса email сервиса
 */

import { emailService } from "@/shared/api/email";
import { hasSmtp } from "@/shared/lib/env-simple";
import { NextResponse } from "next/server";

export async function GET() {
  try {
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
