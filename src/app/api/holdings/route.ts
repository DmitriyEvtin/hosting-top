import { HoldingApi } from "@/entities/holding";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const result = await HoldingApi.getHoldings({
      search,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Ошибка получения холдингов:", error);
    return NextResponse.json(
      { error: "Ошибка получения холдингов" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Название холдинга обязательно" },
        { status: 400 }
      );
    }

    // Проверяем, не существует ли уже холдинг с таким названием
    const exists = await HoldingApi.holdingExists(name);
    if (exists) {
      return NextResponse.json(
        { error: "Холдинг с таким названием уже существует" },
        { status: 409 }
      );
    }

    const holding = await HoldingApi.createHolding({ name });

    return NextResponse.json(holding, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания холдинга:", error);
    return NextResponse.json(
      { error: "Ошибка создания холдинга" },
      { status: 500 }
    );
  }
}
