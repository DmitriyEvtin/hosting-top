/**
 * API endpoint для отправки email по шаблону
 */

import {
  emailService,
  emailTemplates,
  renderTemplate,
} from "@/shared/api/email";
import { hasSmtp } from "@/shared/lib/env-simple";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
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
