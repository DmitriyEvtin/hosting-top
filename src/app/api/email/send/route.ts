/**
 * API endpoint для отправки простого email
 */

import { emailService } from "@/shared/api/email";
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
    const { to, subject, text, html, from } = body;

    if (!to || !subject) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject" },
        { status: 400 }
      );
    }

    await emailService.sendEmail({
      to,
      subject,
      text,
      html,
      from,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email sending failed:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
