"use client";

import React from "react";
import { X, Check } from "lucide-react";
import Image from "next/image";
import { cn } from "@/shared/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/Table";
import { Button } from "@/shared/ui/Button";

/**
 * Типы для данных тарифа с хостингом
 */
interface ReferenceItem {
  id: string;
  name: string;
  slug: string;
}

interface Hosting {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  startYear: string | null;
  clients: number | null;
  testPeriod: number | null;
  averageRating: number | null;
}

export interface TariffWithHosting {
  id: string;
  name: string;
  subtitle: string | null;
  link: string | null;
  priceMonth: number | string | null;
  priceYear: number | string | null;
  currency: string;
  diskSpace: number | null;
  traffic: number | null;
  domains: number | null;
  sites: number | null;
  countDb: number | null;
  ftpAccounts: number | null;
  mailboxes: number | null;
  ssl: boolean | null;
  backup: boolean | null;
  ssh: boolean | null;
  automaticCms: boolean | null;
  ddosDef: boolean | null;
  antivirus: boolean | null;
  countTestDays: number | null;
  hosting: Hosting;
  cms: ReferenceItem[];
  controlPanels: ReferenceItem[];
  countries: ReferenceItem[];
  dataStores: ReferenceItem[];
  operationSystems: ReferenceItem[];
  programmingLanguages: ReferenceItem[];
}

interface ComparisonTableProps {
  tariffs: TariffWithHosting[];
  onRemoveTariff?: (tariffId: string) => void;
  showActions?: boolean;
}

/**
 * Категории параметров для группировки
 */
interface ParameterCategory {
  name: string;
  parameters: Array<{
    key: string;
    label: string;
    getValue: (tariff: TariffWithHosting) => unknown;
    isBest?: (value: unknown, tariffs: TariffWithHosting[]) => boolean;
    format?: (value: unknown, tariff: TariffWithHosting) => React.ReactNode;
  }>;
}

/**
 * Утилиты для определения лучших значений
 */
const getBestPrice = (tariffs: TariffWithHosting[]): number | null => {
  const prices = tariffs
    .map((t) => {
      const price = t.priceMonth;
      if (price === null || price === undefined) return null;
      return typeof price === "string" ? parseFloat(price) : price;
    })
    .filter((p): p is number => p !== null && !isNaN(p));

  return prices.length > 0 ? Math.min(...prices) : null;
};

const getBestResource = (
  tariffs: TariffWithHosting[],
  field: keyof TariffWithHosting
): number | null => {
  const values = tariffs
    .map((t) => t[field] as number | null)
    .filter((v): v is number => v !== null && typeof v === "number");

  return values.length > 0 ? Math.max(...values) : null;
};

const getBestBoolean = (
  tariffs: TariffWithHosting[],
  field: keyof TariffWithHosting
): boolean => {
  return tariffs.some((t) => t[field] === true);
};

const getBestRating = (tariffs: TariffWithHosting[]): number | null => {
  const ratings = tariffs
    .map((t) => t.hosting.averageRating)
    .filter((r): r is number => r !== null && typeof r === "number");

  return ratings.length > 0 ? Math.max(...ratings) : null;
};

/**
 * Функции форматирования
 */
const formatPrice = (value: unknown, tariff: TariffWithHosting): string => {
  if (value === null || value === undefined) return "—";
  const numPrice = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numPrice as number)) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: tariff.currency || "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numPrice as number);
};

const formatResource = (
  value: unknown,
  unit: string = "ГБ"
): React.ReactNode => {
  if (value === null || value === undefined) return "—";
  return `${value} ${unit}`;
};

const formatNumber = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined) return "—";
  return value.toString();
};

const formatBoolean = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined) return "—";
  const boolValue = value === true;
  return boolValue ? (
    <Check className="h-4 w-4 text-green-600" />
  ) : (
    <X className="h-4 w-4 text-gray-400" />
  );
};

const formatArray = (items: ReferenceItem[]): React.ReactNode => {
  if (!items || items.length === 0) return "—";
  return items.map((item) => item.name).join(", ");
};

const formatRating = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined) return "—";
  return typeof value === "number" ? value.toFixed(1) : "—";
};

/**
 * Определение категорий параметров
 */
const getParameterCategories = (): ParameterCategory[] => {
  return [
    {
      name: "Общая информация",
      parameters: [
        {
          key: "hosting.name",
          label: "Хостинг",
          getValue: (t) => t.hosting.name,
          format: (value) => value as React.ReactNode,
        },
        {
          key: "name",
          label: "Название тарифа",
          getValue: (t) => t.name,
          format: (value) => value as React.ReactNode,
        },
        {
          key: "subtitle",
          label: "Подзаголовок",
          getValue: (t) => t.subtitle,
          format: (value) => (value ? (value as React.ReactNode) : "—"),
        },
        {
          key: "hosting.averageRating",
          label: "Рейтинг",
          getValue: (t) => t.hosting.averageRating,
          isBest: (value, tariffs) => {
            const bestRating = getBestRating(tariffs);
            return value === bestRating && bestRating !== null;
          },
          format: formatRating,
        },
      ],
    },
    {
      name: "Цены",
      parameters: [
        {
          key: "priceMonth",
          label: "Цена за месяц",
          getValue: (t) => t.priceMonth,
          isBest: (value, tariffs) => {
            const bestPrice = getBestPrice(tariffs);
            if (bestPrice === null) return false;
            const numValue =
              typeof value === "string" ? parseFloat(value) : value;
            return numValue === bestPrice;
          },
          format: formatPrice,
        },
        {
          key: "priceYear",
          label: "Цена за год",
          getValue: (t) => t.priceYear,
          isBest: (value, tariffs) => {
            const prices = tariffs
              .map((t) => {
                const price = t.priceYear;
                if (price === null || price === undefined) return null;
                return typeof price === "string" ? parseFloat(price) : price;
              })
              .filter((p): p is number => p !== null && !isNaN(p));
            const bestPrice = prices.length > 0 ? Math.min(...prices) : null;
            if (bestPrice === null) return false;
            const numValue =
              typeof value === "string" ? parseFloat(value) : value;
            return numValue === bestPrice;
          },
          format: formatPrice,
        },
        {
          key: "countTestDays",
          label: "Тестовый период (дней)",
          getValue: (t) => t.countTestDays,
          isBest: (value, tariffs) => {
            const best = getBestResource(tariffs, "countTestDays");
            return value === best && best !== null;
          },
          format: (value) => formatNumber(value),
        },
      ],
    },
    {
      name: "Ресурсы",
      parameters: [
        {
          key: "diskSpace",
          label: "Дисковое пространство",
          getValue: (t) => t.diskSpace,
          isBest: (value, tariffs) => {
            const best = getBestResource(tariffs, "diskSpace");
            return value === best && best !== null;
          },
          format: (value) => formatResource(value, "ГБ"),
        },
        {
          key: "traffic",
          label: "Трафик",
          getValue: (t) => t.traffic,
          isBest: (value, tariffs) => {
            const best = getBestResource(tariffs, "traffic");
            return value === best && best !== null;
          },
          format: (value) => formatResource(value, "ГБ"),
        },
        {
          key: "domains",
          label: "Доменов",
          getValue: (t) => t.domains,
          isBest: (value, tariffs) => {
            const best = getBestResource(tariffs, "domains");
            return value === best && best !== null;
          },
          format: formatNumber,
        },
        {
          key: "sites",
          label: "Сайтов",
          getValue: (t) => t.sites,
          isBest: (value, tariffs) => {
            const best = getBestResource(tariffs, "sites");
            return value === best && best !== null;
          },
          format: formatNumber,
        },
        {
          key: "ftpAccounts",
          label: "FTP аккаунтов",
          getValue: (t) => t.ftpAccounts,
          isBest: (value, tariffs) => {
            const best = getBestResource(tariffs, "ftpAccounts");
            return value === best && best !== null;
          },
          format: formatNumber,
        },
      ],
    },
    {
      name: "БД и почта",
      parameters: [
        {
          key: "countDb",
          label: "Баз данных",
          getValue: (t) => t.countDb,
          isBest: (value, tariffs) => {
            const best = getBestResource(tariffs, "countDb");
            return value === best && best !== null;
          },
          format: formatNumber,
        },
        {
          key: "mailboxes",
          label: "Почтовых ящиков",
          getValue: (t) => t.mailboxes,
          isBest: (value, tariffs) => {
            const best = getBestResource(tariffs, "mailboxes");
            return value === best && best !== null;
          },
          format: formatNumber,
        },
      ],
    },
    {
      name: "Технологии",
      parameters: [
        {
          key: "cms",
          label: "CMS",
          getValue: (t) => t.cms,
          format: (value) => formatArray(value as ReferenceItem[]),
        },
        {
          key: "controlPanels",
          label: "Панели управления",
          getValue: (t) => t.controlPanels,
          format: (value) => formatArray(value as ReferenceItem[]),
        },
        {
          key: "dataStores",
          label: "Базы данных",
          getValue: (t) => t.dataStores,
          format: (value) => formatArray(value as ReferenceItem[]),
        },
        {
          key: "programmingLanguages",
          label: "Языки программирования",
          getValue: (t) => t.programmingLanguages,
          format: (value) => formatArray(value as ReferenceItem[]),
        },
        {
          key: "operationSystems",
          label: "Операционные системы",
          getValue: (t) => t.operationSystems,
          format: (value) => formatArray(value as ReferenceItem[]),
        },
      ],
    },
    {
      name: "Безопасность",
      parameters: [
        {
          key: "ssl",
          label: "SSL",
          getValue: (t) => t.ssl,
          isBest: (value, tariffs) => {
            return getBestBoolean(tariffs, "ssl") && value === true;
          },
          format: formatBoolean,
        },
        {
          key: "backup",
          label: "Резервное копирование",
          getValue: (t) => t.backup,
          isBest: (value, tariffs) => {
            return getBestBoolean(tariffs, "backup") && value === true;
          },
          format: formatBoolean,
        },
        {
          key: "ddosDef",
          label: "Защита от DDoS",
          getValue: (t) => t.ddosDef,
          isBest: (value, tariffs) => {
            return getBestBoolean(tariffs, "ddosDef") && value === true;
          },
          format: formatBoolean,
        },
        {
          key: "antivirus",
          label: "Антивирус",
          getValue: (t) => t.antivirus,
          isBest: (value, tariffs) => {
            return getBestBoolean(tariffs, "antivirus") && value === true;
          },
          format: formatBoolean,
        },
      ],
    },
    {
      name: "Локация",
      parameters: [
        {
          key: "countries",
          label: "Страны",
          getValue: (t) => t.countries,
          format: (value) => formatArray(value as ReferenceItem[]),
        },
      ],
    },
    {
      name: "Прочее",
      parameters: [
        {
          key: "ssh",
          label: "SSH доступ",
          getValue: (t) => t.ssh,
          isBest: (value, tariffs) => {
            return getBestBoolean(tariffs, "ssh") && value === true;
          },
          format: formatBoolean,
        },
        {
          key: "automaticCms",
          label: "Автоустановка CMS",
          getValue: (t) => t.automaticCms,
          isBest: (value, tariffs) => {
            return getBestBoolean(tariffs, "automaticCms") && value === true;
          },
          format: formatBoolean,
        },
        {
          key: "hosting.startYear",
          label: "Год основания",
          getValue: (t) => t.hosting.startYear,
          format: (value) => (value ? (value as React.ReactNode) : "—"),
        },
        {
          key: "hosting.clients",
          label: "Количество клиентов",
          getValue: (t) => t.hosting.clients,
          format: (value) => {
            if (value === null || value === undefined) return "—";
            return new Intl.NumberFormat("ru-RU").format(value as number);
          },
        },
      ],
    },
  ];
};

/**
 * Компонент таблицы сравнения тарифов
 */
export function ComparisonTable({
  tariffs,
  onRemoveTariff,
  showActions = false,
}: ComparisonTableProps) {
  if (tariffs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          Нет тарифов для сравнения
        </p>
      </div>
    );
  }

  const categories = getParameterCategories();

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead
              className="sticky left-0 z-10 min-w-[200px] bg-background border-r shadow-[2px_0_4px_rgba(0,0,0,0.05)]"
            >
              Параметр
            </TableHead>
            {tariffs.map((tariff) => (
              <TableHead
                key={tariff.id}
                className="min-w-[200px] text-center align-middle"
              >
                <div className="flex flex-col items-center gap-2">
                  {tariff.hosting.logoUrl && (
                    <div className="relative h-12 w-12">
                      <Image
                        src={tariff.hosting.logoUrl}
                        alt={tariff.hosting.name}
                        fill
                        className="object-contain"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-semibold text-sm">
                      {tariff.hosting.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {tariff.name}
                    </span>
                    {tariff.subtitle && (
                      <span className="text-xs text-muted-foreground">
                        {tariff.subtitle}
                      </span>
                    )}
                  </div>
                  {showActions && onRemoveTariff && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveTariff(tariff.id)}
                      className="h-6 w-6 p-0"
                      aria-label={`Удалить ${tariff.name} из сравнения`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <React.Fragment key={category.name}>
              <TableRow className="bg-muted/50">
                <TableHead
                  colSpan={tariffs.length + 1}
                  className="font-semibold text-base"
                >
                  {category.name}
                </TableHead>
              </TableRow>
              {category.parameters.map((param) => (
                <TableRow key={param.key}>
                  <TableCell
                    className="sticky left-0 z-10 min-w-[200px] bg-background font-medium border-r shadow-[2px_0_4px_rgba(0,0,0,0.05)]"
                  >
                    {param.label}
                  </TableCell>
                  {tariffs.map((tariff) => {
                    const value = param.getValue(tariff);
                    const isBest =
                      param.isBest?.(value, tariffs) ?? false;
                    const formattedValue = param.format
                      ? param.format(value, tariff)
                      : String(value ?? "—");

                    return (
                      <TableCell
                        key={tariff.id}
                        className={cn(
                          "text-center align-middle",
                          isBest && "bg-[#e8f5e9]"
                        )}
                      >
                        {formattedValue}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

