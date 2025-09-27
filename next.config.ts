import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Включаем standalone режим для Docker
  output: "standalone",
  
  // Оптимизация для production
  compress: true,
  
  // Настройки для Docker
  experimental: {
    // Включаем оптимизации для Docker
    serverComponentsExternalPackages: ["@prisma/client"],
  },
  
  // Настройки для мониторинга
  env: {
    NEXT_TELEMETRY_DISABLED: "1",
  },
  
  // Настройки для безопасности
  poweredByHeader: false,
  
  // Настройки для производительности
  swcMinify: true,
  
  // Настройки для изображений
  images: {
    domains: ["localhost"],
    formats: ["image/webp", "image/avif"],
  },
};

export default nextConfig;
