import { HoldingApi } from "@/entities/holding";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const holding = await HoldingApi.getHoldingById(params.id);

    if (!holding) {
      return NextResponse.json({ error: "Холдинг не найден" }, { status: 404 });
    }

    return NextResponse.json(holding);
  } catch (error) {
    console.error("Ошибка получения холдинга:", error);
    return NextResponse.json(
      { error: "Ошибка получения холдинга" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Название холдинга обязательно" },
        { status: 400 }
      );
    }

    // Проверяем, не существует ли уже холдинг с таким названием (исключая текущий)
    const exists = await HoldingApi.holdingExists(name, params.id);
    if (exists) {
      return NextResponse.json(
        { error: "Холдинг с таким названием уже существует" },
        { status: 409 }
      );
    }

    const holding = await HoldingApi.updateHolding(params.id, { name });

    return NextResponse.json(holding);
  } catch (error) {
    console.error("Ошибка обновления холдинга:", error);
    return NextResponse.json(
      { error: "Ошибка обновления холдинга" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const holding = await HoldingApi.deleteHolding(params.id);

    return NextResponse.json(holding);
  } catch (error) {
    console.error("Ошибка удаления холдинга:", error);
    return NextResponse.json(
      { error: "Ошибка удаления холдинга" },
      { status: 500 }
    );
  }
}
