# Исправление обновления сессии при загрузке логотипа

## Проблема

При загрузке логотипа в профиле пользователя требовался перезаход в систему для отображения изменений в сессии.

## Причина

NextAuth.js не автоматически обновляет сессию при изменении данных пользователя в базе данных. Сессия кэшируется и обновляется только при следующем входе в систему.

## Решение

### 1. Обновление JWT callback в NextAuth

Модифицирован JWT callback для получения актуальных данных из базы данных при обновлении сессии:

```typescript
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
  if (trigger === 'update' && token.id) {
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
      console.error('Ошибка обновления JWT токена:', error);
    }
  }

  return token;
}
```

### 2. Обновление session callback

Добавлена передача всех полей пользователя в сессию:

```typescript
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
}
```

### 3. Улучшение хука `useProfile`

Добавлено локальное состояние и защита от множественных обновлений:

```typescript
// Локальное состояние для хранения обновленных данных
const [localUser, setLocalUser] = useState<User | null>(null);
const [isUpdating, setIsUpdating] = useState(false);

// Предотвращаем множественные обновления
if (isUpdating) {
  return;
}

// Сначала обновляем локальное состояние для немедленного отображения
setLocalUser(result.user);

// Обновляем сессию с новыми данными
// JWT callback автоматически получит актуальные данные из БД
await update();
```

### 4. Обновление компонента `UserProfile`

Использование данных из хука `useProfile` вместо прямого обращения к сессии:

```typescript
const { user, updateProfile, removeLogo } = useProfile();
const currentUser = user || session?.user;
```

## Решение проблемы с бесконечными циклами

### Проблема

Автоматическое обновление сессии в `useEffect` вызывало бесконечные циклы перезагрузки страницы.

### Решение

1. **Убрано автоматическое обновление сессии** из `useEffect`
2. **Добавлена защита от множественных обновлений** через флаг `isUpdating`
3. **Оптимизирована логика обновления** - убран двойной вызов `update()`

```typescript
// Убираем автоматическое обновление сессии, так как это может вызывать бесконечные циклы
// JWT callback уже обновляет данные при вызове update()

// Предотвращаем множественные обновления
if (isUpdating) {
  return;
}
```

## Преимущества решения

1. **Немедленное отображение**: Изменения видны сразу без перезагрузки страницы
2. **Надежность**: JWT callback обеспечивает актуальные данные из БД
3. **Производительность**: Локальное состояние обновляется мгновенно
4. **Стабильность**: Защита от бесконечных циклов и множественных обновлений
5. **Обратная совместимость**: Fallback на данные сессии, если локальное состояние недоступно

## Тестирование

1. Зайдите в профиль пользователя
2. Загрузите новый логотип
3. Проверьте, что логотип обновился без перезахода
4. Проверьте, что изменения сохранились после перезагрузки страницы

## Файлы изменены

- `src/views/profile/model/useProfile.ts` - добавлено локальное состояние и улучшена логика обновления
- `src/views/profile/ui/UserProfile/UserProfile.tsx` - использование данных из хука вместо сессии
