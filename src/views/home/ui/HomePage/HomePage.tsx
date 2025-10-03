import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import { UserMenu } from "@/shared/ui/UserMenu";
import { ConfigStatus } from "../ConfigStatus";
import { DatabaseStatus } from "../DatabaseStatus";
import { SentryStatus } from "../SentryStatus";

export function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Навигация */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">
                Каталог металлопроката
              </h1>
            </div>
            <UserMenu />
          </div>
        </div>
      </nav>

      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Каталог металлопроката</h1>
          <p className="text-lg text-muted-foreground">
            Автоматический каталог товаров с парсингом данных
          </p>
        </div>

        {/* Статус системы */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DatabaseStatus />
          <ConfigStatus />
          <SentryStatus />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Автоматический парсинг</CardTitle>
              <CardDescription>
                Автоматическое обновление каталога с сайта
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Система автоматически парсит данные о товарах, категориях и
                изображениях
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Управление товарами</CardTitle>
              <CardDescription>
                Админ-панель для управления каталогом
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Полный контроль над товарами, категориями и настройками парсинга
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Облачное хранение</CardTitle>
              <CardDescription>
                Интеграция с AWS S3 для хранения изображений
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Надежное хранение и быстрая доставка изображений через CDN
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
