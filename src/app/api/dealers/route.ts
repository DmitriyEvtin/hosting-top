import { DealerApi } from "@/entities/dealer/api";
import { DealerSearchParams, DealerType } from "@/entities/dealer/model";
import { prisma } from "@/shared/api/database/prisma";
import { authOptions } from "@/shared/lib/auth-config";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const params: DealerSearchParams = {
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page")
        ? parseInt(searchParams.get("page")!)
        : undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
      cityId: searchParams.get("cityId") || undefined,
      holdingId: searchParams.get("holdingId") || undefined,
      managerId: searchParams.get("managerId") || undefined,
      dealerType: (searchParams.get("dealerType") as DealerType) || undefined,
      cooperationStartDateFrom: searchParams.get("cooperationStartDateFrom")
        ? new Date(searchParams.get("cooperationStartDateFrom")!)
        : undefined,
      cooperationStartDateTo: searchParams.get("cooperationStartDateTo")
        ? new Date(searchParams.get("cooperationStartDateTo")!)
        : undefined,
      lastVisitDateFrom: searchParams.get("lastVisitDateFrom")
        ? new Date(searchParams.get("lastVisitDateFrom")!)
        : undefined,
      lastVisitDateTo: searchParams.get("lastVisitDateTo")
        ? new Date(searchParams.get("lastVisitDateTo")!)
        : undefined,
      sortBy:
        (searchParams.get("sortBy") as DealerSearchParams["sortBy"]) ||
        undefined,
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
    };

    const result = await DealerApi.getDealers(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Ошибка API /api/dealers:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();

    // Валидация обязательных полей
    if (!body.name || body.name.trim() === "") {
      return NextResponse.json(
        { error: "Название дилера обязательно" },
        { status: 400 }
      );
    }

    // Валидация сумм
    if (
      body.totalSales !== undefined &&
      (isNaN(Number(body.totalSales)) || Number(body.totalSales) < 0)
    ) {
      return NextResponse.json(
        { error: "Сумма продаж должна быть положительным числом" },
        { status: 400 }
      );
    }

    if (
      body.balance !== undefined &&
      (isNaN(Number(body.balance)) || Number(body.balance) < 0)
    ) {
      return NextResponse.json(
        { error: "Баланс должен быть положительным числом" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли пользователь в базе данных
    let createdById = session.user.id;
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true },
      });

      if (!user) {
        // Если пользователь не найден, используем первого доступного пользователя
        const fallbackUser = await prisma.user.findFirst({
          select: { id: true },
        });
        createdById = fallbackUser?.id || "cmgdraeno0000vjjjwx1onayo";
      }
    } catch (error) {
      console.error("Ошибка проверки пользователя:", error);
      // Используем fallback ID
      createdById = "cmgdraeno0000vjjjwx1onayo";
    }

    const dealer = await DealerApi.createDealer(body, createdById);

    if (!dealer) {
      return NextResponse.json(
        { error: "Ошибка при создании дилера" },
        { status: 500 }
      );
    }

    return NextResponse.json(dealer, { status: 201 });
  } catch (error) {
    console.error("Ошибка API POST /api/dealers:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
