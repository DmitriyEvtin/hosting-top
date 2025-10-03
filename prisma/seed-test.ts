import { PrismaClient } from "../src/shared/api/database/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Начинаем создание тестовых данных...");

  // Создаем тестового пользователя
  const testUser = await prisma.user.upsert({
    where: { email: "user@rolled-metal.ru" },
    update: {},
    create: {
      email: "user@rolled-metal.ru",
      name: "Тестовый пользователь",
      role: "USER",
    },
  });

  console.log("✅ Создан тестовый пользователь:", testUser.email);

  // Создаем категории металлопроката
  const categories = [
    {
      name: "Листовой прокат",
      slug: "listovoy-prokat",
      description: "Листы различных размеров и толщин",
      sortOrder: 1,
    },
    {
      name: "Сортовой прокат",
      slug: "sortovoy-prokat",
      description: "Круг, квадрат, шестигранник",
      sortOrder: 2,
    },
    {
      name: "Трубный прокат",
      slug: "trubnyy-prokat",
      description: "Трубы различного диаметра и толщины",
      sortOrder: 3,
    },
    {
      name: "Фасонный прокат",
      slug: "fasovnyy-prokat",
      description: "Уголки, швеллеры, балки",
      sortOrder: 4,
    },
  ];

  for (const categoryData of categories) {
    const category = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: {},
      create: categoryData,
    });
    console.log("✅ Создана категория:", category.name);
  }

  // Создаем подкатегории для листового проката
  const listovoyCategory = await prisma.category.findUnique({
    where: { slug: "listovoy-prokat" },
  });

  if (listovoyCategory) {
    const subcategories = [
      {
        name: "Горячекатаный лист",
        slug: "goryachekatanyy-list",
        description: "Листы горячей прокатки",
        parentId: listovoyCategory.id,
        sortOrder: 1,
      },
      {
        name: "Холоднокатаный лист",
        slug: "kholodnokatanyy-list",
        description: "Листы холодной прокатки",
        parentId: listovoyCategory.id,
        sortOrder: 2,
      },
      {
        name: "Оцинкованный лист",
        slug: "otsinkovanny-list",
        description: "Листы с цинковым покрытием",
        parentId: listovoyCategory.id,
        sortOrder: 3,
      },
    ];

    for (const subcategoryData of subcategories) {
      const subcategory = await prisma.category.upsert({
        where: { slug: subcategoryData.slug },
        update: {},
        create: subcategoryData,
      });
      console.log("✅ Создана подкатегория:", subcategory.name);
    }
  }

  // Создаем тестовые товары
  const hotRolledCategory = await prisma.category.findUnique({
    where: { slug: "goryachekatanyy-list" },
  });

  if (hotRolledCategory) {
    const products = [
      {
        name: "Лист горячекатаный 3x1250x2500 мм",
        slug: "list-goryachekatanyy-3x1250x2500",
        description:
          "Горячекатаный лист толщиной 3 мм, шириной 1250 мм, длиной 2500 мм",
        price: 45000,
        sku: "LG-3-1250-2500",
        stock: 10,
        categoryId: hotRolledCategory.id,
      },
      {
        name: "Лист горячекатаный 4x1500x3000 мм",
        slug: "list-goryachekatanyy-4x1500x3000",
        description:
          "Горячекатаный лист толщиной 4 мм, шириной 1500 мм, длиной 3000 мм",
        price: 65000,
        sku: "LG-4-1500-3000",
        stock: 8,
        categoryId: hotRolledCategory.id,
      },
      {
        name: "Лист горячекатаный 5x2000x4000 мм",
        slug: "list-goryachekatanyy-5x2000x4000",
        description:
          "Горячекатаный лист толщиной 5 мм, шириной 2000 мм, длиной 4000 мм",
        price: 120000,
        sku: "LG-5-2000-4000",
        stock: 5,
        categoryId: hotRolledCategory.id,
      },
    ];

    for (const productData of products) {
      const product = await prisma.product.upsert({
        where: { slug: productData.slug },
        update: {},
        create: productData,
      });
      console.log("✅ Создан товар:", product.name);

      // Добавляем атрибуты к товару
      const attributes = [
        {
          name: "Толщина",
          value: productData.name.split(" ")[2].split("x")[0] + " мм",
        },
        {
          name: "Ширина",
          value: productData.name.split(" ")[2].split("x")[1] + " мм",
        },
        {
          name: "Длина",
          value: productData.name.split(" ")[2].split("x")[2] + " мм",
        },
        { name: "Материал", value: "Сталь 3" },
        { name: "Стандарт", value: "ГОСТ 19903-2015" },
      ];

      for (const attr of attributes) {
        await prisma.productAttribute.create({
          data: {
            productId: product.id,
            name: attr.name,
            value: attr.value,
          },
        });
      }
    }
  }

  // Создаем тестовую сессию парсинга
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (adminUser) {
    const parsingSession = await prisma.parsingSession.create({
      data: {
        userId: adminUser.id,
        status: "COMPLETED",
        totalItems: 3,
        processedItems: 3,
        errors: 0,
        completedAt: new Date(),
      },
    });

    console.log("✅ Создана тестовая сессия парсинга:", parsingSession.id);

    // Создаем логи парсинга
    const logs = [
      {
        sessionId: parsingSession.id,
        level: "INFO",
        message: 'Начало парсинга категории "Листовой прокат"',
      },
      {
        sessionId: parsingSession.id,
        level: "INFO",
        message: "Найдено 3 товара в категории",
      },
      {
        sessionId: parsingSession.id,
        level: "INFO",
        message: "Парсинг завершен успешно",
      },
    ];

    for (const logData of logs) {
      await prisma.parsingLog.create({
        data: logData,
      });
    }

    console.log("✅ Созданы логи парсинга");
  }

  console.log("🎉 Создание тестовых данных завершено!");
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
