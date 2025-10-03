import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "../api/database";
import { UserRole } from "./types";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Credentials Provider для входа по email/password
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
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
          role: user.role,
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
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // При первом входе сохраняем данные пользователя в токен
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      // Передаем данные из токена в сессию
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }

      return session;
    },

    async signIn({ user, account, profile }) {
      // Дополнительная логика при входе
      if (account?.provider === "credentials") {
        return true;
      }

      // Для OAuth провайдеров проверяем, есть ли пользователь в БД
      if (account?.provider === "google" || account?.provider === "github") {
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
    signUp: "/auth/signup",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
