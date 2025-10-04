// Тест API профиля
import { PrismaClient } from "./src/shared/api/database/prisma";

async function testProfileAPI() {
  const prisma = new PrismaClient();

  try {
    // Проверяем пользователя
    const user = await prisma.user.findUnique({
      where: { email: "test@example.com" },
      select: { id: true, email: true, name: true, image: true },
    });

    console.warn("Пользователь:", user);

    // Обновляем image
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        image: "http://localhost:9000/rolled-metal-images/test-logo.jpg",
      },
      select: { id: true, email: true, name: true, image: true },
    });

    console.warn("Обновленный пользователь:", updatedUser);
  } catch (error) {
    console.error("Ошибка:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testProfileAPI();
