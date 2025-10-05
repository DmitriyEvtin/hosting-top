import { CityApi } from "@/entities/city";
import { updateCitySchema } from "@/entities/city/model/validation";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerOrAdminAccess } from "@/shared/lib/permissions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * GET /api/cities/[id] - Получить город по ID
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

    const city = await CityApi.getCityById(params.id);

    if (!city) {
      return NextResponse.json({ error: "Город не найден" }, { status: 404 });
    }

    return NextResponse.json(city);
  } catch (error) {
    console.error("Ошибка при получении города:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cities/[id] - Обновить город
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
    const validatedData = updateCitySchema.parse(body);

    // Проверяем, существует ли город
    const existingCity = await CityApi.getCityById(params.id);
    if (!existingCity) {
      return NextResponse.json({ error: "Город не найден" }, { status: 404 });
    }

    // Проверяем, не существует ли уже город с таким названием (исключая текущий)
    const exists = await CityApi.cityExists(validatedData.name, params.id);
    if (exists) {
      return NextResponse.json(
        { error: "Город с таким названием уже существует" },
        { status: 409 }
      );
    }

    const city = await CityApi.updateCity(params.id, validatedData);

    return NextResponse.json(city);
  } catch (error) {
    console.error("Ошибка при обновлении города:", error);

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
 * DELETE /api/cities/[id] - Удалить город
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

    // Проверяем, существует ли город
    const existingCity = await CityApi.getCityById(params.id);
    if (!existingCity) {
      return NextResponse.json({ error: "Город не найден" }, { status: 404 });
    }

    const city = await CityApi.deleteCity(params.id);

    return NextResponse.json(city);
  } catch (error) {
    console.error("Ошибка при удалении города:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
