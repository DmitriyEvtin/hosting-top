// Тест API профиля
const { PrismaClient } = require("./src/shared/api/database/prisma");

async function testProfileAPI() {
  const prisma = new PrismaClient();

  try {
    // Проверяем пользователя
    const user = await prisma.user.findUnique({
      where: { email: "test@example.com" },
      select: { id: true, email: true, name: true, logoUrl: true },
    });

    console.log("Пользователь:", user);

    // Обновляем logoUrl
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        logoUrl: "http://localhost:9000/rolled-metal-images/test-logo.jpg",
      },
      select: { id: true, email: true, name: true, logoUrl: true },
    });

    console.log("Обновленный пользователь:", updatedUser);
  } catch (error) {
    console.error("Ошибка:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testProfileAPI();
