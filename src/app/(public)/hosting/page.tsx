import { Metadata } from "next";
import { Suspense } from "react";
import { HostingsListPage } from "@/views/public/hostings/ui/HostingsListPage";

export const metadata: Metadata = {
  title: "Каталог хостингов",
  description: "Полный каталог хостинг-провайдеров с фильтрацией и сравнением тарифов",
};

function HostingsListPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HostingPage() {
  return (
    <Suspense fallback={<HostingsListPageSkeleton />}>
      <HostingsListPage />
    </Suspense>
  );
}

