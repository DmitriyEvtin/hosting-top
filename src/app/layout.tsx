import { ThemeProvider } from "@/shared/lib/theme-context";
import { AuthProvider } from "@/shared/ui/AuthProvider";
import { Toaster } from "@/shared/ui/Toaster";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hosting Top",
  description: "CRM для работы розничной базы паркета",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
