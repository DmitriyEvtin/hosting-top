/**
 * Константы типов контентных блоков
 * Соответствуют PHP классу ContentBlockType
 */
export const ContentBlockType = {
  FIRST_IMPRESSION: "1",
  REGISTRATION: "2",
  TEST_PERIOD: "3",
  BILLING_CYCLE: "4",
  CONTROL_PANEL: "5",
  LIMITS: "6",
  SAFETY: "7",
  OS: "8",
  TECHNICAL_SUPPORT: "9",
  CONCLUSIONS: "10",
} as const;

/**
 * Метки типов контентных блоков
 */
export const ContentBlockTypeLabels: Record<string, string> = {
  [ContentBlockType.FIRST_IMPRESSION]: "Первое впечатление",
  [ContentBlockType.REGISTRATION]: "Регистрация",
  [ContentBlockType.TEST_PERIOD]: "Тестовый период",
  [ContentBlockType.BILLING_CYCLE]: "Биллинговый цикл",
  [ContentBlockType.CONTROL_PANEL]: "Панель управления",
  [ContentBlockType.LIMITS]: "Лимиты",
  [ContentBlockType.SAFETY]: "Безопасность",
  [ContentBlockType.OS]: "Операционная система",
  [ContentBlockType.TECHNICAL_SUPPORT]: "Техподдержка",
  [ContentBlockType.CONCLUSIONS]: "Выводы",
};

/**
 * Шаблоны заголовков для типов контентных блоков
 */
const ContentBlockHeaderTemplates: Record<string, string> = {
  [ContentBlockType.FIRST_IMPRESSION]: "Первое впечатление о хостинге {hosting}",
  [ContentBlockType.REGISTRATION]: "Регистрация на хостинге {hosting}",
  [ContentBlockType.TEST_PERIOD]: "Тестовый период на хостинге {hosting}",
  [ContentBlockType.BILLING_CYCLE]: "Биллинговый цикл хостинга {hosting}",
  [ContentBlockType.CONTROL_PANEL]: "Панель управления хостингом {hosting}",
  [ContentBlockType.LIMITS]: "Ограничения (лимиты) на хостинге {hosting}",
  [ContentBlockType.SAFETY]: "Безопасность хостинга {hosting}",
  [ContentBlockType.OS]: "Операционная система на хостинге {hosting}",
  [ContentBlockType.TECHNICAL_SUPPORT]: "Техподдержка хостинга {hosting}",
  [ContentBlockType.CONCLUSIONS]: "Выводы о хостинге {hosting}",
};

/**
 * Получить метку типа контентного блока
 */
export function getContentBlockTypeLabel(type: string | null): string {
  if (!type) return "";
  return ContentBlockTypeLabels[type] || "";
}

/**
 * Получить заголовок контентного блока на основе типа и названия хостинга
 * @param type - Тип контентного блока (строка или null)
 * @param hostingName - Название хостинга
 * @returns Заголовок контентного блока или пустая строка, если тип не определен
 */
export function getContentBlockHeader(
  type: string | null,
  hostingName: string
): string {
  if (!type) return "";

  const template = ContentBlockHeaderTemplates[type];
  if (!template) return "";

  return template.replace(/{hosting}/g, hostingName);
}

