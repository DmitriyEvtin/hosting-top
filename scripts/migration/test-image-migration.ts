/**
 * Тестовый скрипт для проверки миграции изображений
 */

import chalk from "chalk";
import { migrateHostingImage } from "./image-migrator";

/**
 * Тестовые данные для миграции
 */
const TEST_CASES = [
  {
    hostingSlug: "test-hosting-1",
    imageUrl: "https://via.placeholder.com/400x400.png?text=Test+Hosting+1",
  },
  {
    hostingSlug: "test-hosting-2",
    imageUrl: "https://via.placeholder.com/300x300.jpg?text=Test+Hosting+2",
  },
  {
    hostingSlug: "test-hosting-3",
    imageUrl: "https://invalid-url-that-does-not-exist.com/image.png", // Тест на ошибку
  },
];

/**
 * Основная функция тестирования
 */
async function main() {
  console.log(chalk.blue("\n🧪 Запуск тестов миграции изображений\n"));

  let successCount = 0;
  let errorCount = 0;

  for (const testCase of TEST_CASES) {
    try {
      console.log(
        chalk.cyan(
          `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
        )
      );
      console.log(chalk.cyan(`Тест: ${testCase.hostingSlug}`));
      console.log(chalk.cyan(`URL: ${testCase.imageUrl}`));
      console.log(
        chalk.cyan(
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
        )
      );

      const resultUrl = await migrateHostingImage(
        testCase.imageUrl,
        testCase.hostingSlug
      );

      console.log(chalk.green(`\n✅ Успешно: ${resultUrl}`));
      successCount++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`\n❌ Ошибка: ${errorMessage}`));
      errorCount++;
    }
  }

  // Итоговая статистика
  console.log(
    chalk.blue(
      "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
  );
  console.log(chalk.blue("📊 Итоговая статистика:"));
  console.log(chalk.green(`  ✅ Успешно: ${successCount}`));
  console.log(chalk.red(`  ❌ Ошибок: ${errorCount}`));
  console.log(chalk.blue(`  📦 Всего: ${TEST_CASES.length}`));
  console.log(
    chalk.blue(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    )
  );
}

// Запуск тестов
main().catch(error => {
  console.error(chalk.red("\n💥 Критическая ошибка:"), error);
  process.exit(1);
});
