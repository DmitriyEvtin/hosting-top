import { testDatabaseConnection } from "@/shared/lib";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await testDatabaseConnection();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "База данных работает корректно",
        stats: result.stats,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Ошибка подключения к базе данных",
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Внутренняя ошибка сервера",
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
      { status: 500 }
    );
  }
}
