import { CityApi } from "@/entities/city";
import { citySearchSchema } from "@/entities/city/model/validation";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerOrAdminAccess } from "@/shared/lib/permissions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * GET /api/cities - Получить список городов
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Проверяем права доступа (Менеджер или Админ)
    if (!hasManagerOrAdminAccess(session.user.role)) {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const params = { search, page, limit };
    const validatedParams = citySearchSchema.parse(params);

    const result = await CityApi.getCities(validatedParams);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Ошибка при получении списка городов:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Неверные параметры запроса" },
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
 * POST /api/cities - Создать новый город
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
    const { createCitySchema } = await import(
      "@/entities/city/model/validation"
    );
    const validatedData = createCitySchema.parse(body);

    // Проверяем, не существует ли уже город с таким названием
    const exists = await CityApi.cityExists(validatedData.name);
    if (exists) {
      return NextResponse.json(
        { error: "Город с таким названием уже существует" },
        { status: 409 }
      );
    }

    const city = await CityApi.createCity(validatedData);

    return NextResponse.json(city, { status: 201 });
  } catch (error) {
    console.error("Ошибка при создании города:", error);

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
