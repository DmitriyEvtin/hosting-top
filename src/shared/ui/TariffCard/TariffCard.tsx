"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Check, X, ExternalLink, HardDrive, Globe, Database, Mail, Shield, Server, Zap } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface ReferenceItem {
  id: string;
  name: string;
  slug: string;
}

interface TariffCardProps {
  tariff: {
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
    cms: ReferenceItem[];
    controlPanels: ReferenceItem[];
    countries: ReferenceItem[];
    dataStores: ReferenceItem[];
    operationSystems: ReferenceItem[];
    programmingLanguages: ReferenceItem[];
  };
  className?: string;
}

export function TariffCard({ tariff, className }: TariffCardProps) {
  // Форматирование цены
  const formatPrice = (price: number | string | null): string => {
    if (price === null) return "—";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: tariff.currency || "RUB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numPrice);
  };

  // Форматирование размера
  const formatSize = (size: number | null, unit: string = "ГБ"): string => {
    if (size === null) return "—";
    return `${size} ${unit}`;
  };

  // Форматирование числа
  const formatNumber = (num: number | null): string => {
    if (num === null) return "—";
    return num.toString();
  };

  // Отображение булевого значения
  const renderBoolean = (value: boolean | null) => {
    if (value === null) return null;
    return value ? (
      <Check className="h-4 w-4 text-green-600" />
    ) : (
      <X className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader>
        <CardTitle className="text-2xl mb-1">{tariff.name}</CardTitle>
        {tariff.subtitle && (
          <CardDescription className="text-base">{tariff.subtitle}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Цены */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted rounded-lg">
          <div className="flex-1">
            <div className="text-sm text-muted-foreground mb-1">В месяц</div>
            <div className="text-2xl font-bold">
              {formatPrice(tariff.priceMonth)}
            </div>
          </div>
          {tariff.priceYear && (
            <div className="flex-1">
              <div className="text-sm text-muted-foreground mb-1">В год</div>
              <div className="text-2xl font-bold">
                {formatPrice(tariff.priceYear)}
              </div>
            </div>
          )}
        </div>

        {/* Технические характеристики */}
        <div>
          <h4 className="font-semibold mb-3 text-lg">Технические характеристики</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Диск:</span>
              <span className="text-sm font-medium">
                {formatSize(tariff.diskSpace)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Трафик:</span>
              <span className="text-sm font-medium">
                {formatSize(tariff.traffic)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Доменов:</span>
              <span className="text-sm font-medium">
                {formatNumber(tariff.domains)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Сайтов:</span>
              <span className="text-sm font-medium">
                {formatNumber(tariff.sites)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">БД:</span>
              <span className="text-sm font-medium">
                {formatNumber(tariff.countDb)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Почтовых ящиков:</span>
              <span className="text-sm font-medium">
                {formatNumber(tariff.mailboxes)}
              </span>
            </div>
            {tariff.ftpAccounts !== null && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">FTP аккаунтов:</span>
                <span className="text-sm font-medium">
                  {formatNumber(tariff.ftpAccounts)}
                </span>
              </div>
            )}
            {tariff.countTestDays !== null && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Тестовых дней:</span>
                <span className="text-sm font-medium">
                  {formatNumber(tariff.countTestDays)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Возможности */}
        <div>
          <h4 className="font-semibold mb-3 text-lg">Возможности</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">SSL:</span>
              {renderBoolean(tariff.ssl)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Резервное копирование:</span>
              {renderBoolean(tariff.backup)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">SSH доступ:</span>
              {renderBoolean(tariff.ssh)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Автоустановка CMS:</span>
              {renderBoolean(tariff.automaticCms)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">DDoS защита:</span>
              {renderBoolean(tariff.ddosDef)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Антивирус:</span>
              {renderBoolean(tariff.antivirus)}
            </div>
          </div>
        </div>

        {/* Связанные данные */}
        <div className="space-y-4">
          {tariff.cms.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-muted-foreground">CMS</h5>
              <div className="flex flex-wrap gap-2">
                {tariff.cms.map((item) => (
                  <Badge key={item.id} variant="secondary">
                    {item.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {tariff.controlPanels.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-muted-foreground">Панели управления</h5>
              <div className="flex flex-wrap gap-2">
                {tariff.controlPanels.map((item) => (
                  <Badge key={item.id} variant="secondary">
                    {item.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {tariff.countries.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-muted-foreground">Страны</h5>
              <div className="flex flex-wrap gap-2">
                {tariff.countries.map((item) => (
                  <Badge key={item.id} variant="secondary">
                    {item.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {tariff.dataStores.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-muted-foreground">Хранилища данных</h5>
              <div className="flex flex-wrap gap-2">
                {tariff.dataStores.map((item) => (
                  <Badge key={item.id} variant="secondary">
                    {item.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {tariff.operationSystems.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-muted-foreground">ОС</h5>
              <div className="flex flex-wrap gap-2">
                {tariff.operationSystems.map((item) => (
                  <Badge key={item.id} variant="secondary">
                    {item.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {tariff.programmingLanguages.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-muted-foreground">Языки программирования</h5>
              <div className="flex flex-wrap gap-2">
                {tariff.programmingLanguages.map((item) => (
                  <Badge key={item.id} variant="secondary">
                    {item.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {tariff.link && (
        <CardFooter>
          <Button
            asChild
            className="w-full"
            variant="default"
          >
            <a
              href={tariff.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Перейти на сайт
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

