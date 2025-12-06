import { AuthGuard } from "@/shared/ui/AuthGuard";
import { Navigation } from "@/shared/ui/Navigation";

export const metadata = {
  title: "Админ панель - Hosting Top",
  description: "Административная панель для управления системой",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main>{children}</main>
      </div>
    </AuthGuard>
  );
}
