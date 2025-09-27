/**
 * Конфигурация NextAuth.js
 * Централизованная настройка аутентификации
 */

import { NextAuthOptions } from "next-auth";
import { env } from "./env";

// Конфигурация NextAuth.js
export const authConfig: NextAuthOptions = {
  // Секретный ключ для подписи JWT токенов
  secret: env.NEXTAUTH_SECRET,

  // URL приложения
  url: env.NEXTAUTH_URL,

  // Страницы (кастомные страницы аутентификации)
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },

  // Провайдеры аутентификации
  providers: [
    // Email провайдер (для разработки)
    {
      id: "email",
      name: "Email",
      type: "email",
      server: {
        host: env.SMTP_HOST || "localhost",
        port: env.SMTP_PORT || 587,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        },
      },
      from: env.SMTP_FROM || "noreply@localhost",
      maxAge: 24 * 60 * 60, // 24 часа
    },
  ],

  // Настройки сессий
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 дней
    updateAge: 24 * 60 * 60, // 24 часа
  },

  // Настройки JWT
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },

  // Callbacks для кастомизации
  callbacks: {
    async jwt({ token, user, account }) {
      // Добавляем пользовательские данные в JWT токен
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role || "user";
      }

      return token;
    },

    async session({ session, token }) {
      // Передаем данные из JWT в сессию
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
      }

      return session;
    },

    async signIn({ user, account, profile, email, credentials }) {
      // Логика проверки при входе
      // Здесь можно добавить проверки, например, по домену email
      return true;
    },

    async redirect({ url, baseUrl }) {
      // Логика редиректа после аутентификации
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  // Настройки безопасности
  useSecureCookies: env.NODE_ENV === "production",

  // Настройки cookies
  cookies: {
    sessionToken: {
      name: `${env.APP_NAME.toLowerCase().replace(/\s+/g, "-")}-session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: `${env.APP_NAME.toLowerCase().replace(/\s+/g, "-")}-callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `${env.APP_NAME.toLowerCase().replace(/\s+/g, "-")}-csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: env.NODE_ENV === "production",
      },
    },
  },

  // Настройки событий
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Логирование успешного входа
      console.log(`User ${user.email} signed in`);
    },
    async signOut({ session, token }) {
      // Логирование выхода
      console.log(`User signed out`);
    },
  },

  // Настройки отладки
  debug: env.NODE_ENV === "development",

  // Настройки логирования
  logger: {
    error(code, metadata) {
      console.error(`NextAuth Error [${code}]:`, metadata);
    },
    warn(code) {
      console.warn(`NextAuth Warning [${code}]`);
    },
    debug(code, metadata) {
      if (env.NODE_ENV === "development") {
        console.debug(`NextAuth Debug [${code}]:`, metadata);
      }
    },
  },
};

// Утилиты для работы с аутентификацией
export const authUtils = {
  // Проверка роли пользователя
  hasRole: (userRole: string, requiredRole: string): boolean => {
    const roleHierarchy = ["user", "moderator", "admin"];
    const userLevel = roleHierarchy.indexOf(userRole);
    const requiredLevel = roleHierarchy.indexOf(requiredRole);
    return userLevel >= requiredLevel;
  },

  // Проверка прав доступа
  canAccess: (userRole: string, resource: string): boolean => {
    const permissions = {
      user: ["read"],
      moderator: ["read", "update"],
      admin: ["read", "update", "delete", "create"],
    };

    return (
      permissions[userRole as keyof typeof permissions]?.includes(resource) ||
      false
    );
  },
};
