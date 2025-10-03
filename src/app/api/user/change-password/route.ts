import { prisma } from "@/shared/api/database";
import { authOptions } from "@/shared/lib/auth-config";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Проверяем, что пользователь авторизован
    if (!session?.user) {
      return NextResponse.json(
        { error: "Необходимо войти в систему" },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Текущий и новый пароль обязательны" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Новый пароль должен содержать минимум 8 символов" },
        { status: 400 }
      );
    }

    // Получаем пользователя из базы данных
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Пользователь не найден или пароль не установлен" },
        { status: 404 }
      );
    }

    // Проверяем текущий пароль
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Неверный текущий пароль" },
        { status: 400 }
      );
    }

    // Хешируем новый пароль
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Обновляем пароль в базе данных
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({
      message: "Пароль успешно изменен",
    });
  } catch (error) {
    console.error("Ошибка при смене пароля:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
