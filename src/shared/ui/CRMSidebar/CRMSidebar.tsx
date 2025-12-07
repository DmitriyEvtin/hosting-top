"use client";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/Button";
import {
  Menu,
  X,
  LayoutDashboard,
  Server,
  FileText,
  BookOpen,
  Database,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface CRMSidebarProps {
  className?: string;
}

interface MenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export function CRMSidebar({ className }: CRMSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const menuSections: MenuSection[] = [
    {
      title: "Основное",
      items: [
        {
          href: "/manager",
          label: "Главная",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Управление",
      items: [
        {
          href: "/manager/hostings",
          label: "Хостинги",
          icon: Server,
        },
        {
          href: "/manager/content-blocks",
          label: "Блоки контента",
          icon: FileText,
        },
        {
          href: "/manager/references",
          label: "Справочники",
          icon: BookOpen,
        },
        {
          href: "/manager/migration",
          label: "Миграция данных",
          icon: Database,
        },
      ],
    },
  ];

  const isActiveRoute = (href: string) => {
    if (href === "/manager") {
      // Для главной страницы проверяем точное совпадение
      return pathname === href;
    }
    // Для остальных страниц проверяем, начинается ли путь с href
    return pathname.startsWith(href);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Мобильная кнопка-бургер */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileMenu}
          className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Мобильное меню (оверлей) */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={closeMobileMenu}
        />
      )}

      {/* Мобильное меню (сайдбар) */}
      <div
        className={cn(
          "lg:hidden fixed left-0 top-0 z-40 h-full w-64 bg-background border-r border-border transform transition-transform duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-semibold text-foreground">
              Hosting Top Меню
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeMobileMenu}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="space-y-6">
            {menuSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map(item => {
                    const Icon = item.icon;
                    const isActive = isActiveRoute(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobileMenu}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Десктопный сайдбар */}
      <div className="hidden lg:block w-64 bg-background border-r border-border min-h-screen">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-8">
            Hosting Top Меню
          </h2>

          <nav className="space-y-6">
            {menuSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map(item => {
                    const Icon = item.icon;
                    const isActive = isActiveRoute(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
