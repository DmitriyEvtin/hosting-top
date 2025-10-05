import { AuthGuard } from "@/shared/ui/AuthGuard";
import { CRMSidebar } from "@/shared/ui/CRMSidebar";
import { Navigation } from "@/shared/ui/Navigation";

export default function CRMLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex">
          <CRMSidebar />
          <main className="flex-1 lg:ml-0">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
