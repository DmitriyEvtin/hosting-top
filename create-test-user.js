const { PrismaClient } = require("./src/shared/api/database/prisma");

async function createTestUser() {
  const prisma = new PrismaClient();

  try {
    // Создаем тестового пользователя
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        name: "Тестовый пользователь",
        role: "USER",
        password:
          "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
      },
    });

    console.log("Создан пользователь:", user);
  } catch (error) {
    console.error("Ошибка создания пользователя:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
