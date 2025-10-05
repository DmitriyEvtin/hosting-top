import { AuthGuard } from "@/shared/ui/AuthGuard";
import { Navigation } from "@/shared/ui/Navigation";

export default function PersonalLayout({
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
