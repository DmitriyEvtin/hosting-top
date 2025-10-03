import { prisma } from "@/shared/api/database";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Находим пользователя в базе данных
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "Пользователь не найден",
        email,
      });
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password || "");

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hasPassword: !!user.password,
        passwordMatch: isPasswordValid,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Ошибка при проверке входа",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
