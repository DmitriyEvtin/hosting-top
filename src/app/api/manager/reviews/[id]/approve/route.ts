import { prisma } from "@/shared/api/database";
import { emailService } from "@/shared/api/email/client";
import { getReviewApprovedEmailTemplate } from "@/shared/api/email/templates";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerAccess } from "@/shared/lib/permissions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/manager/reviews/[id]/approve - Одобрить отзыв
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

    // Одобрить отзыв
    const review = await prisma.review.update({
      where: { id },
      data: {
        status: "APPROVED",
        rejectionReason: null, // Очистить причину отклонения если была
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
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
        const reviewUrl = `${appUrl}/hosting/${review.hosting.slug}`;
        const emailData = {
          userName: review.user.name || review.user.email,
          hostingName: review.hosting.name,
          reviewContent: review.content.substring(0, 100) + (review.content.length > 100 ? "..." : ""),
          reviewUrl,
        };

        const template = getReviewApprovedEmailTemplate(emailData);

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
    console.error("Ошибка одобрения отзыва:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

