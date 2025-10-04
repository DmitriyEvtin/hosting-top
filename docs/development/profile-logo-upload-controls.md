# Управление кнопкой удаления в ProfileLogoUpload

## Описание

Добавлена возможность контролировать отображение кнопки удаления логотипа в компоненте `ProfileLogoUpload`.

## Новый функционал

### Проп `allowRemove`

```typescript
interface ProfileLogoUploadProps {
  // ... существующие пропы
  allowRemove?: boolean; // Новый проп для управления кнопкой удаления
}
```

- **По умолчанию**: `true` - кнопка удаления отображается
- **Значение `false`**: кнопка удаления скрыта

### Использование

```typescript
// Кнопка удаления отображается (по умолчанию)
<ProfileLogoUpload
  currentLogoUrl={logoUrl}
  onUploadComplete={handleUpload}
  onRemoveLogo={handleRemove}
/>

// Кнопка удаления скрыта
<ProfileLogoUpload
  currentLogoUrl={logoUrl}
  onUploadComplete={handleUpload}
  onRemoveLogo={handleRemove}
  allowRemove={false}
/>
```

## Текущее состояние

В компоненте `UserProfile` кнопка удаления **временно отключена**:

```typescript
<ProfileLogoUpload
  currentLogoUrl={currentUser.image || undefined}
  onUploadComplete={handleLogoUpload}
  onUploadError={error => setUploadError(error)}
  onRemoveLogo={handleLogoRemove}
  allowRemove={false} // Временно отключаем кнопку удаления
/>
```

## Преимущества

1. **Гибкость**: Возможность контролировать функциональность удаления
2. **Безопасность**: Предотвращение случайного удаления логотипа
3. **UX**: Улучшенный пользовательский опыт в зависимости от контекста
4. **Обратная совместимость**: Существующий код продолжает работать

## Файлы изменены

- `src/views/profile/ui/ProfileLogoUpload/ProfileLogoUpload.tsx` - добавлен проп `allowRemove`
- `src/views/profile/ui/UserProfile/UserProfile.tsx` - отключена кнопка удаления
