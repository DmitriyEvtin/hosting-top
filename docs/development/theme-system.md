# Система переключения темы

## Обзор

В приложении реализована система переключения между светлой и темной темами с использованием:

- React Context API для управления состоянием темы
- Tailwind CSS с CSS переменными для стилизации
- localStorage для сохранения выбора пользователя
- Автоматическое определение системной темы

## Архитектура

### Компоненты

1. **ThemeProvider** (`src/shared/lib/theme-context.tsx`)
   - Провайдер контекста для управления темой
   - Автоматическое определение системной темы
   - Сохранение выбора в localStorage
   - Применение класса `dark` к HTML элементу

2. **ThemeToggle** (`src/shared/ui/ThemeToggle/`)
   - Компонент переключателя темы
   - Анимированные иконки солнца и луны
   - Доступность (ARIA атрибуты)
   - Адаптивные стили

### CSS переменные

Система использует CSS переменные для цветов, определенные в `src/app/globals.css`:

```css
:root {
  /* Светлая тема */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... другие переменные */
}

.dark {
  /* Темная тема */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... другие переменные */
}
```

### Tailwind конфигурация

В `tailwind.config.ts` настроен режим темной темы:

```typescript
const config: Config = {
  darkMode: ["class"], // Использует класс для переключения
  // ...
};
```

## Использование

### Базовое использование

```tsx
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

function MyComponent() {
  return (
    <div>
      <ThemeToggle />
    </div>
  );
}
```

### Использование хука useTheme

```tsx
import { useTheme } from "@/shared/lib/theme-context";

function MyComponent() {
  const { theme, setTheme, toggleTheme } = useTheme();

  return (
    <div>
      <p>Текущая тема: {theme}</p>
      <button onClick={toggleTheme}>Переключить тему</button>
    </div>
  );
}
```

### Условная стилизация

```tsx
function MyComponent() {
  const { theme } = useTheme();

  return (
    <div
      className={`
      ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}
    `}
    >
      Контент
    </div>
  );
}
```

## Интеграция в приложение

### Layout

Провайдер темы интегрирован в корневой layout:

```tsx
// src/app/layout.tsx
import { ThemeProvider } from "@/shared/lib/theme-context";

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <ThemeProvider>{/* остальные провайдеры */}</ThemeProvider>
      </body>
    </html>
  );
}
```

### Навигация

Переключатель темы добавлен в навигацию:

```tsx
// src/shared/ui/Navigation/Navigation.tsx
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

export function Navigation() {
  return (
    <nav className="bg-background shadow-sm border-b border-border">
      <div className="flex justify-between items-center">
        <div>Логотип</div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
```

## Стилизация компонентов

### Использование CSS переменных

```tsx
// Хорошо - использует CSS переменные
<div className="bg-background text-foreground border-border">
  Контент
</div>

// Плохо - хардкод цветов
<div className="bg-white text-black border-gray-300">
  Контент
</div>
```

### Темные варианты

```tsx
// Использование dark: префикса
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Адаптивный контент
</div>
```

## Тестирование

### Unit тесты

```tsx
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/shared/lib/theme-context";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

const renderWithTheme = children => {
  return render(<ThemeProvider>{children}</ThemeProvider>);
};

test("toggles theme when clicked", async () => {
  const user = userEvent.setup();
  renderWithTheme(<ThemeToggle />);

  const button = screen.getByRole("button", { name: /переключить тему/i });
  await user.click(button);

  expect(localStorage.setItem).toHaveBeenCalledWith("theme", "dark");
});
```

### E2E тесты

```typescript
// tests/e2e/theme-toggle.spec.ts
import { test, expect } from "@playwright/test";

test("theme toggle works correctly", async ({ page }) => {
  await page.goto("/");

  // Проверяем начальное состояние
  await expect(page.locator("html")).not.toHaveClass("dark");

  // Кликаем переключатель
  await page.click("[aria-label='Переключить тему']");

  // Проверяем, что тема изменилась
  await expect(page.locator("html")).toHaveClass("dark");
});
```

## Лучшие практики

### 1. Используйте семантические CSS переменные

```tsx
// Хорошо
<div className="bg-background text-foreground border-border">

// Плохо
<div className="bg-white text-black border-gray-300">
```

### 2. Избегайте хардкода цветов

```tsx
// Хорошо
<div className="bg-primary text-primary-foreground">

// Плохо
<div className="bg-blue-500 text-white">
```

### 3. Тестируйте обе темы

```tsx
test("component works in both themes", () => {
  const { rerender } = render(<MyComponent />);

  // Тест светлой темы
  expect(screen.getByTestId("component")).toHaveClass("bg-white");

  // Переключаем на темную
  rerender(
    <ThemeProvider defaultTheme="dark">
      <MyComponent />
    </ThemeProvider>
  );

  expect(screen.getByTestId("component")).toHaveClass("bg-gray-900");
});
```

### 4. Обеспечьте доступность

```tsx
<button aria-label="Переключить тему" onClick={toggleTheme}>
  <Sun className="dark:hidden" />
  <Moon className="hidden dark:block" />
</button>
```

## Расширение системы

### Добавление новых тем

```tsx
type Theme = "light" | "dark" | "auto";

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState<Theme>("auto");

  useEffect(() => {
    if (theme === "auto") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      applyTheme(systemTheme);
    } else {
      applyTheme(theme);
    }
  }, [theme]);
};
```

### Анимации переходов

```css
/* globals.css */
* {
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease;
}
```

## Устранение неполадок

### Проблема: Тема не применяется

**Решение**: Убедитесь, что ThemeProvider обертывает все приложение и что CSS переменные определены правильно.

### Проблема: FOUC (Flash of Unstyled Content)

**Решение**: Добавьте скрипт в `<head>` для раннего применения темы:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `
      try {
        const theme = localStorage.getItem('theme') || 
          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.classList.add(theme);
      } catch (e) {}
    `,
  }}
/>
```

### Проблема: SSR несоответствие

**Решение**: Используйте `useEffect` для применения темы только на клиенте:

```tsx
useEffect(() => {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}, [theme]);
```
