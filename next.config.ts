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
    domains: ["localhost"],
    formats: ["image/webp", "image/avif"],
  },
  
  // Отключаем проверку типов для сборки
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
