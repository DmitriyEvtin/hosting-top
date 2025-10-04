import { authOptions } from "@/shared/lib/auth-config";
import { UserRole } from "@/shared/lib/types";
import { UsersPage } from "@/views/admin/users";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  // Проверяем авторизацию и права администратора
  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect("/");
  }

  return <UsersPage />;
}
