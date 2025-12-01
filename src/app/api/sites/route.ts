import { SiteApi } from "@/entities/site";
import { createSiteSchema } from "@/entities/site/model/validation";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerOrAdminAccess } from "@/shared/lib/permissions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * GET /api/sites - Получить список всех сайтов
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Проверяем права доступа (Менеджер или Админ)
    if (!hasManagerOrAdminAccess(session.user.role)) {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    const sites = await SiteApi.getSites();

    return NextResponse.json({ sites, total: sites.length });
  } catch (error) {
    console.error("Ошибка при получении списка сайтов:", error);

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sites - Создать новый сайт
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Проверяем права доступа (Менеджер или Админ)
    if (!hasManagerOrAdminAccess(session.user.role)) {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createSiteSchema.parse(body);

    // Проверяем, не существует ли уже сайт с таким названием
    const exists = await SiteApi.siteExists(validatedData.name);
    if (exists) {
      return NextResponse.json(
        { error: "Site name already exists" },
        { status: 400 }
      );
    }

    const site = await SiteApi.createSite(validatedData);

    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    console.error("Ошибка при создании сайта:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Неверные данные",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

