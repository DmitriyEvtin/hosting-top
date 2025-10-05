import { ThemeProvider } from "@/shared/lib/theme-context";
import { AuthProvider } from "@/shared/ui/AuthProvider";
import { Navigation } from "@/shared/ui/Navigation";
import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Паркет CRM",
  description: "CRM для работы оптовой базы паркета",
};

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <div className="min-h-screen bg-background">
              <Navigation />
              <main>{children}</main>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
