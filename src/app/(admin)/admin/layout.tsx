import { authOptions } from "@/shared/lib/auth-config";
import { UserRole } from "@/shared/lib/types";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Проверяем авторизацию и права администратора
  if (!session || session.user.role !== UserRole.ADMIN) {
    notFound();
  }

  // Если пользователь авторизован как администратор, показываем содержимое
  return <>{children}</>;
}
