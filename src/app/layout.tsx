import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Каталог металлопроката",
  description: "Автоматический каталог товаров с парсингом данных с bvb-alyans.ru",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}