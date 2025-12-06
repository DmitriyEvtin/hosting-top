import bcrypt from "bcryptjs";
import crypto from "crypto";
import { PrismaClient } from "../src/shared/api/database/prisma/index.js";

const prisma = new PrismaClient();

// Функция для генерации безопасного пароля
function generateSecurePassword(): string {
  return crypto.randomBytes(16).toString("hex");
}

// Функция для создания администратора
async function createAdminUser() {
  // Проверяем переменные окружения для переопределения
  const adminEmail = process.env.ADMIN_EMAIL || "admin@hosting-top.online";
  const adminPassword = process.env.ADMIN_PASSWORD || generateSecurePassword();
  const adminName = process.env.ADMIN_NAME || "Администратор";

  // Хешируем пароль
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      // Обновляем только если пароль не установлен
      password: undefined, // Не обновляем пароль при upsert
    },
    create: {
      email: adminEmail,
      name: adminName,
      role: "ADMIN",
      password: hashedPassword,
    },
  });

  // Если пользователь уже существует и у него нет пароля, обновляем его
  if (!adminUser.password) {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { password: hashedPassword },
    });
  }

  // Выводим учетные данные только в development
  if (process.env.NODE_ENV === "development") {
    console.log("🔑 Учетные данные администратора:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Пароль: ${adminPassword}`);
    console.log("⚠️  ОБЯЗАТЕЛЬНО смените пароль после первого входа!");
  } else {
    console.log("✅ Создан пользователь-администратор:", adminEmail);
    if (process.env.ADMIN_PASSWORD) {
      console.log("✅ Использован пароль из переменной окружения");
    } else {
      console.log("⚠️  Сгенерирован случайный пароль - проверьте логи");
    }
  }

  return adminUser;
}

async function main() {
  console.log("🌱 Начинаем инициализацию базы данных...");

  // Создаем пользователя-администратора
  await createAdminUser();

  console.log("🎉 Инициализация базы данных завершена!");
  console.log("💡 Система готова к работе с аутентификацией пользователей");
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
