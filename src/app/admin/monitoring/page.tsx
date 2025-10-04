import { authOptions } from "@/shared/lib/auth-config";
import { UserRole } from "@/shared/lib/types";
import { MonitoringPage } from "@/views/admin/monitoring/ui/MonitoringPage";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AdminMonitoringPage() {
  const session = await getServerSession(authOptions);

  // Дополнительная проверка на сервере
  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect("/");
  }

  return <MonitoringPage />;
}
