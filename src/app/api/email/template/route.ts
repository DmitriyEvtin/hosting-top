/**
 * API endpoint для отправки email по шаблону
 * Требует аутентификации и прав администратора
 */

import {
  emailService,
  emailTemplates,
  renderTemplate,
} from "@/shared/api/email";
import { authOptions } from "@/shared/lib/auth-config";
import { hasSmtp } from "@/shared/lib/env-simple";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Проверка прав администратора
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    if (!hasSmtp) {
      return NextResponse.json(
        { error: "Email service is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { template, to, data = {} } = body;

    if (!template || !to) {
      return NextResponse.json(
        { error: "Missing required fields: template, to" },
        { status: 400 }
      );
    }

    if (!emailTemplates[template]) {
      return NextResponse.json(
        { error: `Template '${template}' not found` },
        { status: 404 }
      );
    }

    const renderedTemplate = renderTemplate(emailTemplates[template], data);

    await emailService.sendEmail({
      to,
      ...renderedTemplate,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Template email sending failed:", error);
    return NextResponse.json(
      { error: "Failed to send template email" },
      { status: 500 }
    );
  }
}
