import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/shared/api/database/prisma/index.js";

const prisma = new PrismaClient();

// Функция для создания пользователей разработки
async function createDevUsers() {
  console.log("🌱 Создаем пользователей для разработки...");

  const devPassword = "111111";
  const hashedPassword = await bcrypt.hash(devPassword, 12);

  // Создаем администратора
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@dev.ru" },
    update: {
      password: hashedPassword,
      name: "Администратор разработки",
      role: "ADMIN",
    },
    create: {
      email: "admin@dev.ru",
      name: "Администратор разработки",
      role: "ADMIN",
      password: hashedPassword,
    },
  });

  console.log("✅ Создан администратор:", adminUser.email);

  // Создаем тестовых пользователей
  const testUsers = [
    {
      email: "user@dev.ru",
      name: "Пользователь разработки",
      role: "USER" as const,
    },
    {
      email: "moderator@dev.ru",
      name: "Модератор разработки",
      role: "MODERATOR" as const,
    },
    {
      email: "test@dev.ru",
      name: "Тестовый пользователь",
      role: "USER" as const,
    },
  ];

  for (const userData of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        password: hashedPassword,
        name: userData.name,
        role: userData.role,
      },
      create: {
        ...userData,
        password: hashedPassword,
      },
    });
    console.log(`✅ Создан пользователь (${userData.role}):`, user.email);
  }

  console.log("🔑 Все пользователи имеют пароль: 111111");
  console.log("📧 Администратор: admin@dev.ru");
  console.log("👥 Пользователи: user@dev.ru, moderator@dev.ru, test@dev.ru");
}

async function main() {
  console.log("🌱 Начинаем инициализацию базы данных для разработки...");

  try {
    await createDevUsers();
    console.log("🎉 Инициализация базы данных для разработки завершена!");
  } catch (error) {
    console.error("❌ Ошибка при инициализации базы данных:", error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
