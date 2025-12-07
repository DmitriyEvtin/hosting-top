"use client";

import { useToast } from "@/shared/lib/use-toast";
import { Button } from "@/shared/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/Card";
import { Progress } from "@/shared/ui/Progress";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface MigrationStatus {
  id: string;
  status: "idle" | "running" | "completed" | "failed";
  progress: {
    current: number;
    total: number;
    stage?: string;
  };
  startedAt: string | null;
  completedAt: string | null;
  errors: Array<{
    stage: string;
    message: string;
    error?: string;
  }>;
  results: {
    hostings: number;
    tariffs: number;
    images: number;
    references: {
      cms: number;
      controlPanels: number;
      countries: number;
      dataStores: number;
      operationSystems: number;
      programmingLanguages: number;
    };
    tariffRelations: {
      cms: number;
      controlPanels: number;
      countries: number;
      dataStores: number;
      operationSystems: number;
      programmingLanguages: number;
    };
    contentBlocks: number;
  } | null;
  dryRun: boolean;
  skippedImages: boolean;
}

export function MigrationPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [skipImages, setSkipImages] = useState(false);

  // Загрузка статуса миграции
  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/admin/migration/status");
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Недостаточно прав доступа");
        }
        throw new Error(data.error || "Ошибка загрузки статуса");
      }

      if (data.status === "idle") {
        setStatus(null);
      } else {
        setStatus(data);
      }

      // Автообновление, если миграция запущена
      if (data.status === "running") {
        setAutoRefresh(true);
      } else {
        setAutoRefresh(false);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Ошибка загрузки статуса";
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Запуск миграции
  const handleStart = async () => {
    setStarting(true);
    try {
      const response = await fetch("/api/admin/migration/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dryRun,
          skipImages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Недостаточно прав доступа. Требуются права администратора.");
        }
        if (response.status === 409) {
          throw new Error("Миграция уже запущена");
        }
        throw new Error(data.error || "Ошибка запуска миграции");
      }

      toast({
        title: "Миграция запущена",
        description: `Миграция ${data.migrationId} успешно запущена`,
        variant: "success",
      });

      setAutoRefresh(true);
      await fetchStatus();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Ошибка запуска миграции";
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setStarting(false);
    }
  };

  // Откат миграции
  const handleRollback = async () => {
    if (!confirm("Вы уверены, что хотите откатить миграцию? Это действие нельзя отменить.")) {
      return;
    }

    setRollingBack(true);
    try {
      const response = await fetch("/api/admin/migration/rollback", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Недостаточно прав доступа");
        }
        if (response.status === 501) {
          toast({
            title: "Функция не реализована",
            description: data.message || "Откат миграции будет реализован в будущих версиях",
            variant: "default",
          });
          return;
        }
        throw new Error(data.error || "Ошибка отката миграции");
      }

      toast({
        title: "Откат выполнен",
        description: "Миграция успешно откачена",
        variant: "success",
      });

      await fetchStatus();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Ошибка отката миграции";
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setRollingBack(false);
    }
  };

  // Автообновление статуса
  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStatus();
    }, 3000); // Обновление каждые 3 секунды

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusIcon = () => {
    if (!status) return <Database className="h-5 w-5" />;
    switch (status.status) {
      case "running":
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };

  const getStatusText = () => {
    if (!status) return "Не запущена";
    switch (status.status) {
      case "running":
        return "Выполняется";
      case "completed":
        return "Завершена";
      case "failed":
        return "Ошибка";
      default:
        return "Неизвестно";
    }
  };

  const getProgressPercent = () => {
    if (!status || status.progress.total === 0) return 0;
    return Math.round((status.progress.current / status.progress.total) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Миграция данных</h1>
        <p className="text-muted-foreground mt-2">
          Управление миграцией данных из MySQL в PostgreSQL
        </p>
      </div>

      {/* Статус миграции */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <CardTitle>Статус миграции</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStatus}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
          </div>
          <CardDescription>
            Текущее состояние процесса миграции данных
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!status ? (
            <div className="text-center py-8 text-muted-foreground">
              Миграция не запущена
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Статус:</span>
                <span className="text-sm">{getStatusText()}</span>
              </div>

              {status.status === "running" && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Прогресс:</span>
                      <span>
                        {status.progress.current} / {status.progress.total} (
                        {getProgressPercent()}%)
                      </span>
                    </div>
                    <Progress value={getProgressPercent()} />
                    {status.progress.stage && (
                      <p className="text-xs text-muted-foreground">
                        Этап: {status.progress.stage}
                      </p>
                    )}
                  </div>
                </>
              )}

              {status.startedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Начало:</span>
                  <span>{new Date(status.startedAt).toLocaleString("ru-RU")}</span>
                </div>
              )}

              {status.completedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Завершение:</span>
                  <span>{new Date(status.completedAt).toLocaleString("ru-RU")}</span>
                </div>
              )}

              {status.dryRun && (
                <div className="flex items-center space-x-2 text-sm text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Режим тестирования (dry-run)</span>
                </div>
              )}

              {status.skippedImages && (
                <div className="flex items-center space-x-2 text-sm text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Миграция изображений пропущена</span>
                </div>
              )}

              {status.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm font-medium text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>Ошибки ({status.errors.length})</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {status.errors.map((error, index) => (
                      <div
                        key={index}
                        className="text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded"
                      >
                        <div className="font-medium">{error.stage}</div>
                        <div className="text-muted-foreground">{error.message}</div>
                        {error.error && (
                          <div className="text-muted-foreground mt-1">
                            {error.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {status.results && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Результаты:</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="bg-muted p-2 rounded">
                      <div className="font-medium">Хостинги</div>
                      <div className="text-muted-foreground">{status.results.hostings}</div>
                    </div>
                    <div className="bg-muted p-2 rounded">
                      <div className="font-medium">Тарифы</div>
                      <div className="text-muted-foreground">{status.results.tariffs}</div>
                    </div>
                    <div className="bg-muted p-2 rounded">
                      <div className="font-medium">Изображения</div>
                      <div className="text-muted-foreground">{status.results.images}</div>
                    </div>
                    <div className="bg-muted p-2 rounded">
                      <div className="font-medium">Блоки контента</div>
                      <div className="text-muted-foreground">
                        {status.results.contentBlocks}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Управление миграцией */}
      <Card>
        <CardHeader>
          <CardTitle>Управление миграцией</CardTitle>
          <CardDescription>
            Запуск и управление процессом миграции данных
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={e => setDryRun(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">
                Режим тестирования (dry-run) - изменения не будут сохранены
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={skipImages}
                onChange={e => setSkipImages(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Пропустить миграцию изображений</span>
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex space-x-2">
          <Button
            onClick={handleStart}
            disabled={starting || (status?.status === "running")}
          >
            {starting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Запуск...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Запустить миграцию
              </>
            )}
          </Button>
          {status?.status === "completed" && status.results && (
            <Button
              variant="outline"
              onClick={handleRollback}
              disabled={rollingBack}
            >
              {rollingBack ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Откат...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Откатить миграцию
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

