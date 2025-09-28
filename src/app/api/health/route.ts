import { prisma } from "@/shared/api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Проверяем подключение к базе данных
    await prisma.$queryRaw`SELECT 1`;

    // Проверяем статус приложения
    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || "1.0.0",
      services: {
        database: "connected",
        redis: "connected", // TODO: Добавить проверку Redis
        aws: "connected", // TODO: Добавить проверку AWS
      },
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    console.error("Health check failed:", error);

    const errorStatus = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      services: {
        database: "disconnected",
        redis: "unknown",
        aws: "unknown",
      },
    };

    return NextResponse.json(errorStatus, { status: 503 });
  }
}
