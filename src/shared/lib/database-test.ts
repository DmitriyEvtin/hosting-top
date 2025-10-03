import { prisma } from "../api/database";

/**
 * Тестирование подключения к базе данных
 */
export async function testDatabaseConnection() {
  try {
    // Проверяем подключение к базе данных
    await prisma.$connect();
    console.warn("✅ Подключение к базе данных успешно");

    // Проверяем количество пользователей
    const userCount = await prisma.user.count();
    console.warn(`📊 Количество пользователей: ${userCount}`);

    // Проверяем количество категорий
    const categoryCount = await prisma.category.count();
    console.warn(`📊 Количество категорий: ${categoryCount}`);

    // Проверяем количество товаров
    const productCount = await prisma.product.count();
    console.warn(`📊 Количество товаров: ${productCount}`);

    // Проверяем количество сессий парсинга
    const sessionCount = await prisma.parsingSession.count();
    console.warn(`📊 Количество сессий парсинга: ${sessionCount}`);

    return {
      success: true,
      stats: {
        users: userCount,
        categories: categoryCount,
        products: productCount,
        sessions: sessionCount,
      },
    };
  } catch (error) {
    console.error("❌ Ошибка подключения к базе данных:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Получение статистики базы данных
 */
export async function getDatabaseStats() {
  try {
    const [users, categories, products, sessions] = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.product.count(),
      prisma.parsingSession.count(),
    ]);

    return {
      users,
      categories,
      products,
      sessions,
    };
  } catch (error) {
    console.error("Ошибка получения статистики:", error);
    throw error;
  }
}
