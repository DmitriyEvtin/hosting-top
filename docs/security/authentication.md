# Аутентификация и авторизация

[← Назад к документации](../README.md)

## Система аутентификации

Проект использует NextAuth.js для управления аутентификацией с поддержкой различных провайдеров.

### Конфигурация NextAuth

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/shared/api/database/prisma';
import bcrypt from 'bcryptjs';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  }
};

export default NextAuth(authOptions);
```

## Роли и права доступа

### Система ролей
```typescript
// src/shared/lib/auth/types.ts
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
```

### Middleware для защиты маршрутов
```typescript
// src/middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Защита админ-панели
    if (pathname.startsWith('/admin')) {
      if (!token || token.role !== 'ADMIN' && token.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/auth/signin', req.url));
      }
    }

    // Защита API routes
    if (pathname.startsWith('/api/admin')) {
      if (!token || token.role !== 'ADMIN' && token.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Публичные маршруты
        if (pathname.startsWith('/api/public')) {
          return true;
        }
        
        // Требуется аутентификация
        return !!token;
      }
    }
  }
);

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
};
```

## Защита API endpoints

### Middleware для API
```typescript
// src/shared/lib/auth/api-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function withAuth(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  requiredRole?: UserRole
) {
  return async (req: NextRequest, context: any) => {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (requiredRole && session.user.role !== requiredRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return handler(req, context);
  };
}
```

### Использование в API routes
```typescript
// src/app/api/admin/products/route.ts
import { withAuth } from '@/shared/lib/auth/api-middleware';
import { UserRole } from '@/shared/lib/auth/types';

export const GET = withAuth(async (req) => {
  // Логика получения товаров
}, UserRole.ADMIN);

export const POST = withAuth(async (req) => {
  // Логика создания товара
}, UserRole.ADMIN);
```

## Защита данных

### Хеширование паролей
```typescript
// src/shared/lib/auth/password.ts
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
```

### Валидация входных данных
```typescript
// src/shared/lib/auth/validation.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов')
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Неверный формат email'),
  password: z.string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Пароль должен содержать заглавные и строчные буквы, а также цифры')
});
```

## Безопасность сессий

### Настройка сессий
```typescript
// src/app/api/auth/[...nextauth]/route.ts
export const authOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 дней
    updateAge: 24 * 60 * 60, // 24 часа
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
};
```

### Защита от CSRF
```typescript
// src/middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      // Проверка CSRF токена
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
        const csrfToken = req.headers.get('x-csrf-token');
        if (!csrfToken) {
          return false;
        }
      }
      
      return !!token;
    }
  }
});
```

## Аудит действий пользователей

### Логирование действий
```typescript
// src/shared/lib/auth/audit.ts
import { prisma } from '@/shared/api/database/prisma';

export async function logUserAction(
  userId: string,
  action: string,
  resource: string,
  details?: any
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resource,
      details: details ? JSON.stringify(details) : null,
      ipAddress: req.ip,
      userAgent: req.headers.get('user-agent')
    }
  });
}
```

### Модель аудита
```prisma
// prisma/schema.prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  action    String
  resource  String
  details   String?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
  
  @@map("audit_logs")
}
```

## Защита от атак

### Rate Limiting
```typescript
// src/shared/lib/auth/rate-limit.ts
import { NextRequest } from 'next/server';

const rateLimitMap = new Map();

export function rateLimit(
  identifier: string,
  limit: number = 10,
  window: number = 60000
) {
  const now = Date.now();
  const windowStart = now - window;
  
  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, []);
  }
  
  const requests = rateLimitMap.get(identifier);
  const validRequests = requests.filter((time: number) => time > windowStart);
  
  if (validRequests.length >= limit) {
    return false;
  }
  
  validRequests.push(now);
  rateLimitMap.set(identifier, validRequests);
  
  return true;
}
```

### Защита от брутфорса
```typescript
// src/shared/lib/auth/brute-force-protection.ts
import { prisma } from '@/shared/api/database/prisma';

export async function checkBruteForce(email: string): Promise<boolean> {
  const recentAttempts = await prisma.loginAttempt.findMany({
    where: {
      email,
      createdAt: {
        gte: new Date(Date.now() - 15 * 60 * 1000) // 15 минут
      }
    }
  });
  
  return recentAttempts.length < 5;
}

export async function recordLoginAttempt(
  email: string,
  success: boolean,
  ipAddress: string
) {
  await prisma.loginAttempt.create({
    data: {
      email,
      success,
      ipAddress,
      createdAt: new Date()
    }
  });
}
```

## Двухфакторная аутентификация

### Настройка 2FA
```typescript
// src/shared/lib/auth/2fa.ts
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export function generateSecret(userEmail: string) {
  const secret = speakeasy.generateSecret({
    name: `Rolled Metal (${userEmail})`,
    issuer: 'Rolled Metal'
  });
  
  return secret;
}

export function verifyToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2
  });
}
```

## Безопасность API

### Валидация запросов
```typescript
// src/shared/lib/auth/request-validation.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';

export function validateRequest<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(req.body);
  } catch (error) {
    throw new Error('Invalid request data');
  }
}
```

### Санитизация данных
```typescript
// src/shared/lib/auth/sanitization.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 1000);
}
```
