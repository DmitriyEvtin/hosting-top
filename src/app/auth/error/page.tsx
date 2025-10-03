import { Card } from "@/shared/ui/Card";
import Link from "next/link";

interface ErrorPageProps {
  searchParams: {
    error?: string;
  };
}

const errorMessages: Record<string, string> = {
  Configuration: "Проблема с конфигурацией сервера",
  AccessDenied: "Доступ запрещен",
  Verification: "Токен верификации истек или недействителен",
  Default: "Произошла ошибка при входе в систему",
};

export default function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const error = searchParams.error || "Default";
  const message = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="w-full">
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              Ошибка аутентификации
            </h1>

            <p className="mt-2 text-gray-600">{message}</p>

            <div className="mt-6 space-y-3">
              <Link
                href="/auth/signin"
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Попробовать снова
              </Link>

              <Link
                href="/"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                На главную
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
