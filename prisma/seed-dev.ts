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

// Функция для создания тестовых данных каталога
async function seedCatalog() {
  console.log("🌱 Создаем тестовые данные каталога...");

  // Проверяем, есть ли уже данные каталога
  const existingSites = await prisma.site.count();
  if (existingSites > 0) {
    console.log("ℹ️  Данные каталога уже существуют, пропускаем создание");
    return;
  }

  await prisma.$transaction(async tx => {
    // 1. Создаем 5 сайтов
    const siteNames = [
      "Интернет-магазин А",
      "Интернет-магазин Б",
      "Оптовый портал",
      "Розничный сайт",
      "Корпоративный каталог",
    ];

    const sites = [];
    for (const name of siteNames) {
      const site = await tx.site.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      sites.push(site);
      console.log(`✅ Создан сайт: ${site.name}`);
    }

    // 2. Создаем 12 категорий с распределением по сайтам
    const categoryData = [
      { name: "Электроника", siteIndices: [0, 1, 2] }, // сайты [1, 2, 3]
      { name: "Одежда", siteIndices: [0, 1] }, // сайты [1, 2]
      { name: "Обувь", siteIndices: [1, 3] }, // сайты [2, 4]
      { name: "Мебель", siteIndices: [2, 4] }, // сайты [3, 5]
      { name: "Книги", siteIndices: [0, 3, 4] }, // сайты [1, 4, 5]
      { name: "Игрушки", siteIndices: [0, 1] }, // сайты [1, 2]
      { name: "Спорт", siteIndices: [1, 2] }, // сайты [2, 3]
      { name: "Бытовая техника", siteIndices: [0, 2, 4] }, // сайты [1, 3, 5]
      { name: "Продукты питания", siteIndices: [3] }, // сайт [4]
      { name: "Косметика", siteIndices: [0, 1, 3] }, // сайты [1, 2, 4]
      { name: "Автотовары", siteIndices: [2, 4] }, // сайты [3, 5]
      { name: "Строительные материалы", siteIndices: [4] }, // сайт [5]
    ];

    const categories = [];
    for (const catData of categoryData) {
      const category = await tx.category.create({
        data: { name: catData.name },
      });
      categories.push(category);

      // Создаем связи CategorySite
      for (const siteIndex of catData.siteIndices) {
        await tx.categorySite.create({
          data: {
            categoryId: category.id,
            siteId: sites[siteIndex].id,
          },
        });
      }

      console.log(
        `✅ Создана категория: ${category.name} (на ${catData.siteIndices.length} сайтах)`
      );
    }

    // 3. Создаем 60 товаров с различными комбинациями
    const products = [];

    // 10 товаров в категории "Электроника" на разных комбинациях сайтов [1,2,3]
    const electronicsCategory = categories[0];
    const electronicsProducts = [
      { name: "Смартфон Samsung Galaxy", siteIndices: [0, 1, 2] },
      { name: "Ноутбук ASUS", siteIndices: [0, 2] },
      { name: "Планшет iPad", siteIndices: [1, 2] },
      { name: "Наушники Sony", siteIndices: [0, 1] },
      { name: "Умные часы Apple Watch", siteIndices: [2] },
      { name: "Телевизор LG", siteIndices: [0, 1, 2] },
      { name: "Игровая консоль PlayStation", siteIndices: [1, 2] },
      { name: "Фотоаппарат Canon", siteIndices: [0, 2] },
      { name: "Портативная колонка JBL", siteIndices: [1] },
      { name: "Электронная книга Kindle", siteIndices: [0, 1, 2] },
    ];

    for (const prodData of electronicsProducts) {
      const product = await tx.product.create({
        data: {
          name: prodData.name,
          categoryId: electronicsCategory.id,
        },
      });

      for (const siteIndex of prodData.siteIndices) {
        await tx.productSite.create({
          data: {
            productId: product.id,
            siteId: sites[siteIndex].id,
          },
        });
      }

      products.push(product);
    }

    // 8 товаров в категории "Одежда" на сайтах [1,2]
    const clothingCategory = categories[1];
    const clothingProducts = [
      { name: "Джинсы Levi's", siteIndices: [0, 1] },
      { name: "Футболка Nike", siteIndices: [0] },
      { name: "Куртка зимняя", siteIndices: [1] },
      { name: "Платье летнее", siteIndices: [0, 1] },
      { name: "Свитер шерстяной", siteIndices: [0] },
      { name: "Брюки классические", siteIndices: [1] },
      { name: "Рубашка офисная", siteIndices: [0, 1] },
      { name: "Толстовка с капюшоном", siteIndices: [0] },
    ];

    for (const prodData of clothingProducts) {
      const product = await tx.product.create({
        data: {
          name: prodData.name,
          categoryId: clothingCategory.id,
        },
      });

      for (const siteIndex of prodData.siteIndices) {
        await tx.productSite.create({
          data: {
            productId: product.id,
            siteId: sites[siteIndex].id,
          },
        });
      }

      products.push(product);
    }

    // 6 товаров в категории "Обувь" на сайтах [2,4]
    const shoesCategory = categories[2];
    const shoesProducts = [
      { name: "Кроссовки Adidas", siteIndices: [1, 3] },
      { name: "Ботинки зимние", siteIndices: [1] },
      { name: "Туфли офисные", siteIndices: [3] },
      { name: "Сапоги резиновые", siteIndices: [1, 3] },
      { name: "Сланцы пляжные", siteIndices: [3] },
      { name: "Босоножки летние", siteIndices: [1, 3] },
    ];

    for (const prodData of shoesProducts) {
      const product = await tx.product.create({
        data: {
          name: prodData.name,
          categoryId: shoesCategory.id,
        },
      });

      for (const siteIndex of prodData.siteIndices) {
        await tx.productSite.create({
          data: {
            productId: product.id,
            siteId: sites[siteIndex].id,
          },
        });
      }

      products.push(product);
    }

    // 5 товаров в категории "Мебель" на сайтах [3,5]
    const furnitureCategory = categories[3];
    const furnitureProducts = [
      { name: "Диван угловой", siteIndices: [2, 4] },
      { name: "Стол обеденный", siteIndices: [2] },
      { name: "Кровать двуспальная", siteIndices: [4] },
      { name: "Шкаф-купе", siteIndices: [2, 4] },
      { name: "Кресло офисное", siteIndices: [2] },
    ];

    for (const prodData of furnitureProducts) {
      const product = await tx.product.create({
        data: {
          name: prodData.name,
          categoryId: furnitureCategory.id,
        },
      });

      for (const siteIndex of prodData.siteIndices) {
        await tx.productSite.create({
          data: {
            productId: product.id,
            siteId: sites[siteIndex].id,
          },
        });
      }

      products.push(product);
    }

    // 8 товаров в категории "Книги" на сайтах [1,4,5]
    const booksCategory = categories[4];
    const booksProducts = [
      { name: "Роман 'Война и мир'", siteIndices: [0, 3, 4] },
      { name: "Детектив Агаты Кристи", siteIndices: [0, 3] },
      { name: "Фантастика 'Дюна'", siteIndices: [4] },
      { name: "Учебник по математике", siteIndices: [0, 4] },
      { name: "Справочник по программированию", siteIndices: [3, 4] },
      { name: "Книга по кулинарии", siteIndices: [0, 3, 4] },
      { name: "Детская сказка", siteIndices: [0] },
      { name: "Биография известной личности", siteIndices: [3, 4] },
    ];

    for (const prodData of booksProducts) {
      const product = await tx.product.create({
        data: {
          name: prodData.name,
          categoryId: booksCategory.id,
        },
      });

      for (const siteIndex of prodData.siteIndices) {
        await tx.productSite.create({
          data: {
            productId: product.id,
            siteId: sites[siteIndex].id,
          },
        });
      }

      products.push(product);
    }

    // 5 товаров в категории "Игрушки" на сайтах [1,2]
    const toysCategory = categories[5];
    const toysProducts = [
      { name: "Конструктор LEGO", siteIndices: [0, 1] },
      { name: "Кукла Барби", siteIndices: [0] },
      { name: "Машинка радиоуправляемая", siteIndices: [1] },
      { name: "Пазл 1000 деталей", siteIndices: [0, 1] },
      { name: "Настольная игра Монополия", siteIndices: [0] },
    ];

    for (const prodData of toysProducts) {
      const product = await tx.product.create({
        data: {
          name: prodData.name,
          categoryId: toysCategory.id,
        },
      });

      for (const siteIndex of prodData.siteIndices) {
        await tx.productSite.create({
          data: {
            productId: product.id,
            siteId: sites[siteIndex].id,
          },
        });
      }

      products.push(product);
    }

    // 5 товаров в категории "Спорт" на сайтах [2,3]
    const sportCategory = categories[6];
    const sportProducts = [
      { name: "Мяч футбольный", siteIndices: [1, 2] },
      { name: "Гантели разборные", siteIndices: [1] },
      { name: "Велосипед горный", siteIndices: [2] },
      { name: "Ракетка теннисная", siteIndices: [1, 2] },
      { name: "Коврик для йоги", siteIndices: [1] },
    ];

    for (const prodData of sportProducts) {
      const product = await tx.product.create({
        data: {
          name: prodData.name,
          categoryId: sportCategory.id,
        },
      });

      for (const siteIndex of prodData.siteIndices) {
        await tx.productSite.create({
          data: {
            productId: product.id,
            siteId: sites[siteIndex].id,
          },
        });
      }

      products.push(product);
    }

    // 5 товаров в категории "Бытовая техника" на сайтах [1,3,5]
    const appliancesCategory = categories[7];
    const appliancesProducts = [
      { name: "Холодильник Samsung", siteIndices: [0, 2, 4] },
      { name: "Стиральная машина LG", siteIndices: [0, 2] },
      { name: "Микроволновка Panasonic", siteIndices: [4] },
      { name: "Пылесос Dyson", siteIndices: [0, 2, 4] },
      { name: "Кофемашина DeLonghi", siteIndices: [2] },
    ];

    for (const prodData of appliancesProducts) {
      const product = await tx.product.create({
        data: {
          name: prodData.name,
          categoryId: appliancesCategory.id,
        },
      });

      for (const siteIndex of prodData.siteIndices) {
        await tx.productSite.create({
          data: {
            productId: product.id,
            siteId: sites[siteIndex].id,
          },
        });
      }

      products.push(product);
    }

    // 8 товаров БЕЗ категории, распределенных по всем сайтам
    const uncategorizedProducts = [
      { name: "Универсальный товар А", siteIndices: [0] },
      { name: "Универсальный товар Б", siteIndices: [1] },
      { name: "Универсальный товар В", siteIndices: [2] },
      { name: "Универсальный товар Г", siteIndices: [3] },
      { name: "Универсальный товар Д", siteIndices: [4] },
      { name: "Специальный товар 1", siteIndices: [0, 1] },
      { name: "Специальный товар 2", siteIndices: [2, 3] },
      { name: "Специальный товар 3", siteIndices: [0, 1, 2, 3, 4] },
    ];

    for (const prodData of uncategorizedProducts) {
      const product = await tx.product.create({
        data: {
          name: prodData.name,
          categoryId: null,
        },
      });

      for (const siteIndex of prodData.siteIndices) {
        await tx.productSite.create({
          data: {
            productId: product.id,
            siteId: sites[siteIndex].id,
          },
        });
      }

      products.push(product);
    }

    console.log(`✅ Создано товаров: ${products.length}`);
    console.log(
      `   - С категориями: ${products.filter(p => p.categoryId).length}`
    );
    console.log(
      `   - Без категорий: ${products.filter(p => !p.categoryId).length}`
    );
  });

  console.log("✅ Тестовые данные каталога созданы успешно!");
}

async function main() {
  console.log("🌱 Начинаем инициализацию базы данных для разработки...");

  try {
    await createDevUsers();
    await seedCatalog();
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
