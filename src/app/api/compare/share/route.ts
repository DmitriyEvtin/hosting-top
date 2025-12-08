import { prisma } from "@/shared/api/database";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";

/**
 * Схема валидации для создания ссылки шаринга сравнения
 */
const ShareComparisonSchema = z.object({
  tariffIds: z
    .array(z.string())
    .min(2, "Необходимо минимум 2 тарифа")
    .max(5, "Максимум 5 тарифов для сравнения"),
});

/**
 * POST /api/compare/share - Создать ссылку для шаринга сравнения (публичный endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    // Парсинг request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Некорректный формат JSON" },
        { status: 400 }
      );
    }

    // Валидация данных через Zod
    const validationResult = ShareComparisonSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const { tariffIds } = validationResult.data;

    // Получение срока действия из переменной окружения
    const expiryDays = parseInt(
      process.env.COMPARISON_LINK_EXPIRY_DAYS || "30",
      10
    );
    const expiresAt = new Date(
      Date.now() + expiryDays * 24 * 60 * 60 * 1000
    );

    // Генерация уникального shareId (10 символов, URL-безопасный)
    // Используем цикл для гарантии уникальности
    let shareId: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      shareId = nanoid(10);
      attempts++;

      // Проверка уникальности shareId
      const existing = await prisma.sharedComparison.findUnique({
        where: { shareId },
      });

      if (!existing) {
        break;
      }

      if (attempts >= maxAttempts) {
        return NextResponse.json(
          { error: "Не удалось создать уникальную ссылку. Попробуйте позже." },
          { status: 500 }
        );
      }
    } while (attempts < maxAttempts);

    // Сохранение в базу данных
    const sharedComparison = await prisma.sharedComparison.create({
      data: {
        shareId,
        tariffIds,
        expiresAt,
      },
      select: {
        shareId: true,
        tariffIds: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Формирование полного URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${baseUrl}/compare/${shareId}`;

    // Возврат результата
    return NextResponse.json(
      {
        shareId: sharedComparison.shareId,
        url,
        expiresAt: sharedComparison.expiresAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ошибка создания ссылки шаринга:", error);

    // Обработка ошибок Prisma (например, конфликт уникальности)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ссылка с таким ID уже существует. Попробуйте еще раз." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

