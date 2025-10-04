import bcrypt from "bcryptjs";
import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "../api/database";
import MailProvider from "./auth-providers/mail-provider";
import OKProvider from "./auth-providers/ok-provider";
import VKProvider from "./auth-providers/vk-provider";
import YandexProvider from "./auth-providers/yandex-provider";
import "./auth-types";
import { UserRole } from "./types";

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // Временно отключен из-за проблем с типами
  providers: [
    // Credentials Provider для входа по email/password
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          return null;
        }

        // Для демонстрации используем простую проверку пароля
        // В реальном приложении нужно добавить поле password в модель User
        // и использовать bcrypt для хеширования
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password || ""
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          image: user.image,
        };
      },
    }),

    // Google Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // GitHub Provider
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    // VK Provider
    VKProvider({
      clientId: process.env.VK_CLIENT_ID!,
      clientSecret: process.env.VK_CLIENT_SECRET!,
    }),

    // Одноклассники Provider
    OKProvider({
      clientId: process.env.OK_CLIENT_ID!,
      clientSecret: process.env.OK_CLIENT_SECRET!,
    }),

    // Mail.ru Provider
    MailProvider({
      clientId: process.env.MAIL_CLIENT_ID!,
      clientSecret: process.env.MAIL_CLIENT_SECRET!,
    }),

    // Yandex Provider
    YandexProvider({
      clientId: process.env.YANDEX_CLIENT_ID!,
      clientSecret: process.env.YANDEX_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      // При первом входе сохраняем данные пользователя в токен
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.image = user.image;
        token.name = user.name;
        token.email = user.email;
      }

      // Если это обновление сессии (trigger === 'update'), получаем актуальные данные из БД
      if (trigger === "update" && token.id) {
        try {
          const updatedUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              image: true,
            },
          });

          if (updatedUser) {
            token.role = updatedUser.role as UserRole;
            token.image = updatedUser.image;
            token.name = updatedUser.name;
            token.email = updatedUser.email;
          }
        } catch (error) {
          console.error("Ошибка обновления JWT токена:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Передаем данные из токена в сессию
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.image = token.image as string | null;
        session.user.name = token.name as string | null;
        session.user.email = token.email as string;
      }

      return session;
    },

    async signIn({ user, account }) {
      // Дополнительная логика при входе
      if (account?.provider === "credentials") {
        return true;
      }

      // Для OAuth провайдеров проверяем, есть ли пользователь в БД
      if (
        ["google", "github", "vk", "ok", "mail", "yandex"].includes(
          account?.provider || ""
        )
      ) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          // Создаем нового пользователя при первом входе через OAuth
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
              role: UserRole.USER,
            },
          });
        }
      }

      return true;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
