/**
 * MinIO Setup Script
 * Скрипт для настройки MinIO bucket и CORS политики
 */

const {
  S3Client,
  CreateBucketCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

// Конфигурация MinIO
const minioConfig = {
  endpoint: process.env.AWS_S3_ENDPOINT || "http://localhost:9000",
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "minioadmin",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "minioadmin123",
  },
  forcePathStyle: true,
};

const bucketName = process.env.AWS_S3_BUCKET || "parket-crm-images";

async function setupMinIO() {
  console.log("🚀 Настройка MinIO...");

  const s3Client = new S3Client(minioConfig);

  try {
    // 1. Создание bucket
    console.log(`📦 Создание bucket: ${bucketName}`);
    try {
      await s3Client.send(
        new CreateBucketCommand({
          Bucket: bucketName,
        })
      );
      console.log("✅ Bucket создан успешно");
    } catch (error) {
      if (
        error.name === "BucketAlreadyOwnedByYou" ||
        error.name === "BucketAlreadyExists"
      ) {
        console.log("✅ Bucket уже существует");
      } else {
        throw error;
      }
    }

    // 2. Настройка публичной политики доступа
    console.log("🔓 Настройка публичной политики доступа...");
    const publicPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "PublicReadGetObject",
          Effect: "Allow",
          Principal: "*",
          Action: "s3:GetObject",
          Resource: `arn:aws:s3:::${bucketName}/*`,
        },
        {
          Sid: "PublicReadListBucket",
          Effect: "Allow",
          Principal: "*",
          Action: "s3:ListBucket",
          Resource: `arn:aws:s3:::${bucketName}`,
        },
      ],
    };

    try {
      await s3Client.send(
        new PutBucketPolicyCommand({
          Bucket: bucketName,
          Policy: JSON.stringify(publicPolicy),
        })
      );
      console.log("✅ Публичная политика доступа настроена");
    } catch (error) {
      console.log("⚠️  Ошибка настройки политики доступа:", error.message);
    }

    // 3. Настройка CORS политики
    console.log("🌐 Настройка CORS политики...");
    try {
      await s3Client.send(
        new PutBucketCorsCommand({
          Bucket: bucketName,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ["*"],
                AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
                AllowedOrigins: ["*"],
                ExposeHeaders: ["ETag", "x-amz-request-id"],
                MaxAgeSeconds: 3000,
              },
            ],
          },
        })
      );
      console.log("✅ CORS политика настроена");
    } catch (error) {
      console.log("⚠️  Ошибка настройки CORS:", error.message);
    }

    // 4. Создание папок для организации
    console.log("📁 Создание структуры папок...");
    const folders = [
      "images/",
      "images/products/",
      "images/categories/",
      "images/thumbnails/",
      "images/profile-logos/",
      "files/",
    ];

    for (const folder of folders) {
      try {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: folder,
            Body: "",
          })
        );
        console.log(`  ✅ Создана папка: ${folder}`);
      } catch (error) {
        console.log(
          `  ⚠️  Папка ${folder} уже существует или ошибка:`,
          error.message
        );
      }
    }

    console.log("\n🎉 MinIO настроен успешно!");
    console.log(`📊 MinIO Console: http://localhost:9001`);
    console.log(`🔗 MinIO API: http://localhost:9000`);
    console.log(`📦 Bucket: ${bucketName}`);
    console.log("\n📋 Следующие шаги:");
    console.log("1. Скопируйте env.minio.example в .env.local");
    console.log("2. Запустите приложение: npm run dev");
    console.log("3. Откройте http://localhost:3000");
  } catch (error) {
    if (error.name === "BucketAlreadyOwnedByYou") {
      console.log("✅ Bucket уже существует");
    } else if (error.name === "BucketAlreadyExists") {
      console.log("✅ Bucket уже существует (создан другим пользователем)");
    } else {
      console.error("❌ Ошибка настройки MinIO:", error.message);
      process.exit(1);
    }
  }
}

// Проверка переменных окружения
function checkEnvironment() {
  const requiredVars = [
    "AWS_S3_ENDPOINT",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
  ];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.log(
      "⚠️  Отсутствуют переменные окружения:",
      missingVars.join(", ")
    );
    console.log("📝 Используются значения по умолчанию для MinIO");
  }
}

// Запуск скрипта
if (require.main === module) {
  checkEnvironment();
  setupMinIO().catch(console.error);
}

module.exports = { setupMinIO };
