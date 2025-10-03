import { Button } from "@/shared/ui/Button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Страница не найдена
          </h2>
          <p className="text-gray-500 mb-8">
            К сожалению, запрашиваемая страница не существует или у вас нет прав
            доступа к ней.
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/">
            <Button className="w-full">Вернуться на главную</Button>
          </Link>

          <Link href="/profile">
            <Button variant="outline" className="w-full">
              Перейти в профиль
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
