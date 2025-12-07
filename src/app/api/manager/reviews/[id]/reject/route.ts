import { prisma } from "@/shared/api/database";
import { emailService } from "@/shared/api/email/client";
import { getReviewRejectedEmailTemplate } from "@/shared/api/email/templates";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerAccess } from "@/shared/lib/permissions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Схема валидации для отклонения отзыва
 */
const RejectSchema = z.object({
  reason: z.string().min(1, "Причина отклонения обязательна"),
});

/**
 * PATCH /api/manager/reviews/[id]/reject - Отклонить отзыв
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Проверка авторизации и прав менеджера
    const session = await getServerSession(authOptions);
    if (!session || !hasManagerAccess(session.user.role)) {
      return NextResponse.json(
        { error: "Недостаточно прав доступа" },
        { status: 403 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    // Валидировать body
    const body = await request.json();
    const validatedData = RejectSchema.parse(body);

    // Проверить существование отзыва
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Отзыв не найден" },
        { status: 404 }
      );
    }

    // Отклонить отзыв
    const review = await prisma.review.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: validatedData.reason,
      },
      select: {
        id: true,
        content: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        hosting: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    // Отправить email уведомление
    if (emailService.isConfigured()) {
      try {
        const emailData = {
          userName: review.user.name || review.user.email,
          hostingName: review.hosting.name,
          reviewContent: review.content.substring(0, 100) + (review.content.length > 100 ? "..." : ""),
          rejectionReason: validatedData.reason,
        };

        const template = getReviewRejectedEmailTemplate(emailData);

        await emailService.sendEmail({
          to: review.user.email,
          subject: template.subject,
          text: template.text,
          html: template.html,
        });
      } catch (emailError) {
        // Логируем ошибку, но не прерываем операцию
        console.error("Ошибка отправки email уведомления:", emailError);
      }
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Ошибка отклонения отзыва:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Некорректные данные", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

