import { SiteApi } from "@/entities/site";
import { updateSiteSchema } from "@/entities/site/model/validation";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerOrAdminAccess } from "@/shared/lib/permissions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * GET /api/sites/[id] - Получить сайт по ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Проверяем права доступа (Менеджер или Админ)
    if (!hasManagerOrAdminAccess(session.user.role)) {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    const site = await SiteApi.getSiteById(params.id);

    if (!site) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(site);
  } catch (error) {
    console.error("Ошибка при получении сайта:", error);

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sites/[id] - Обновить сайт
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validatedData = updateSiteSchema.parse(body);

    // Проверяем, существует ли сайт
    const existingSite = await SiteApi.getSiteById(params.id);
    if (!existingSite) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    // Если обновляется название, проверяем уникальность
    if (validatedData.name) {
      const nameExists = await SiteApi.siteExists(validatedData.name, params.id);
      if (nameExists) {
        return NextResponse.json(
          { error: "Site name already exists" },
          { status: 400 }
        );
      }
    }

    const site = await SiteApi.updateSite(params.id, validatedData);

    return NextResponse.json(site);
  } catch (error) {
    console.error("Ошибка при обновлении сайта:", error);

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

/**
 * DELETE /api/sites/[id] - Удалить сайт
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Проверяем права доступа (Менеджер или Админ)
    if (!hasManagerOrAdminAccess(session.user.role)) {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    // Проверяем, существует ли сайт
    const existingSite = await SiteApi.getSiteById(params.id);
    if (!existingSite) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    // Удаляем сайт (каскадное удаление связей через CategorySite и ProductSite происходит автоматически)
    await SiteApi.deleteSite(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при удалении сайта:", error);

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

