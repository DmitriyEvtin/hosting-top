import { PrismaClient } from "../src/shared/api/database/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Начинаем создание тестовых данных...");

  // Создаем тестовых пользователей
  const testUsers = [
    {
      email: "user@parket-crm.ru",
      name: "Тестовый пользователь",
      role: "USER" as const,
    },
    {
      email: "moderator@parket-crm.ru",
      name: "Модератор",
      role: "MODERATOR" as const,
    },
    {
      email: "test@parket-crm.ru",
      name: "Тестовый админ",
      role: "ADMIN" as const,
    },
  ];

  for (const userData of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    console.log(`✅ Создан пользователь (${userData.role}):`, user.email);
  }

  // Создаем тестовые OAuth аккаунты для пользователя
  const testUser = await prisma.user.findUnique({
    where: { email: "user@parket-crm.ru" },
  });

  if (testUser) {
    // Google OAuth аккаунт
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: "google_123456789",
        },
      },
      update: {},
      create: {
        userId: testUser.id,
        type: "oauth",
        provider: "google",
        providerAccountId: "google_123456789",
        access_token: "mock_google_access_token",
        refresh_token: "mock_google_refresh_token",
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 час
        token_type: "Bearer",
        scope: "openid email profile",
      },
    });

    // GitHub OAuth аккаунт
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId: "github_987654321",
        },
      },
      update: {},
      create: {
        userId: testUser.id,
        type: "oauth",
        provider: "github",
        providerAccountId: "github_987654321",
        access_token: "mock_github_access_token",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: "bearer",
        scope: "user:email",
      },
    });

    console.log("✅ Созданы OAuth аккаунты для тестового пользователя");
  }

  // Создаем тестовые сессии
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ["user@parket-crm.ru", "moderator@parket-crm.ru"],
      },
    },
  });

  for (const user of users) {
    const session = await prisma.session.create({
      data: {
        sessionToken: `test_session_${user.id}_${Date.now()}`,
        userId: user.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
      },
    });
    console.log(`✅ Создана сессия для пользователя:`, user.email);
  }

  // Создаем тестовые токены верификации
  const verificationTokens = [
    {
      identifier: "user@parket-crm.ru",
      token: "verification_token_123",
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 часа
    },
    {
      identifier: "moderator@parket-crm.ru",
      token: "verification_token_456",
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  ];

  for (const tokenData of verificationTokens) {
    await prisma.verificationToken.create({
      data: tokenData,
    });
    console.log(`✅ Создан токен верификации для:`, tokenData.identifier);
  }

  console.log("🎉 Создание тестовых данных завершено!");
  console.log(
    "💡 Созданы тестовые пользователи, OAuth аккаунты, сессии и токены верификации"
  );
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
