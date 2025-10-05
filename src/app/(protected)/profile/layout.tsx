import { notFound } from "next/navigation";
import { authOptions } from "@/shared/lib/auth-config";
import { getServerSession } from "next-auth";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Проверяем авторизацию и права администратора
  if (!session?.user) {
    notFound();
  }

  // Если пользователь авторизован как администратор, показываем содержимое
  return <>{children}</>;
}
