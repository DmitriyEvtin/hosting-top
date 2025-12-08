import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Включаем standalone режим для Docker
  output: "standalone",
  
  // Оптимизация для production
  compress: true,
  
  // Настройки для Docker
  serverExternalPackages: ["@prisma/client"],
  
  // Настройки для мониторинга
  env: {
    NEXT_TELEMETRY_DISABLED: "1",
  },
  
  // Настройки для безопасности
  poweredByHeader: false,
  
  // Настройки для производительности (swcMinify включен по умолчанию в Next.js 15)
  
  // Настройки для изображений
  images: {
    domains: [
      "localhost", 
      "s3.ru1.storage.beget.cloud",
      "hosting-top.online",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https", 
        hostname: "*.s3.*.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net", 
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s3.ru1.storage.beget.cloud",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "hosting-top.online",
        port: "",
        pathname: "/**",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },
  
  // Отключаем проверку типов для сборки
  typescript: {
    ignoreBuildErrors: true,
  },
};

// Конфигурация Sentry
const sentryWebpackPluginOptions = {
  // Дополнительные настройки для Sentry
  silent: true, // Отключаем логирование в консоль
  org: process.env.SENTRY_ORG || "your-org",
  project: process.env.SENTRY_PROJECT || "your-project",
  
  // Настройки для production
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  
  // Настройки для мониторинга
  tunnelRoute: "/monitoring",
  tunnelRouteOptions: {
    // Настройки для туннелирования
  },
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
