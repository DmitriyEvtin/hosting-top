import { EmailTestSimple } from "@/views/admin/email/ui/EmailTest/EmailTestSimple";

export default function AdminEmailPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Тестирование Email</h1>
        <p className="text-gray-600">
          Проверка работы email сервиса и отправка тестовых писем
        </p>
      </div>

      <EmailTestSimple />
    </div>
  );
}
