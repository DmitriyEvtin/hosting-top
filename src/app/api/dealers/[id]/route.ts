import { DealerApi } from "@/entities/dealer/api";
import { authOptions } from "@/shared/lib/auth-config";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const dealer = await DealerApi.getDealerById(params.id);

    if (!dealer) {
      return NextResponse.json({ error: "Дилер не найден" }, { status: 404 });
    }

    return NextResponse.json(dealer);
  } catch (error) {
    console.error("Ошибка API GET /api/dealers/[id]:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();

    // Валидация обязательных полей
    if (body.name !== undefined && body.name.trim() === "") {
      return NextResponse.json(
        { error: "Название дилера не может быть пустым" },
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

    const dealer = await DealerApi.updateDealer(
      params.id,
      body,
      session.user.id
    );

    if (!dealer) {
      return NextResponse.json(
        {
          error:
            "Ошибка при обновлении дилера. Проверьте корректность указанных связей (холдинг, город, менеджер)",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(dealer);
  } catch (error) {
    console.error("Ошибка API PUT /api/dealers/[id]:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const success = await DealerApi.deleteDealer(params.id);

    if (!success) {
      return NextResponse.json(
        { error: "Ошибка при удалении дилера" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка API DELETE /api/dealers/[id]:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
