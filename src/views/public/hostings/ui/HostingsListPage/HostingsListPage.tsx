"use client";

import { Alert, AlertDescription } from "@/shared/ui/Alert";
import { Card } from "@/shared/ui/Card";
import { HostingCard } from "@/shared/ui/HostingCard";
import { HostingsPagination } from "@/views/manager/hostings/ui/HostingsPagination";
import { HostingFilters } from "@/views/public/hostings/ui/HostingFilters";
import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface FilterOption {
  slug: string;
  name: string;
  count: number;
}

interface Hosting {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  startYear: string | null;
  clients: number | null;
  testPeriod: number;
  _count: { tariffs: number };
}

interface FiltersData {
  countries: FilterOption[];
  cms: FilterOption[];
  controlPanels: FilterOption[];
  operationSystems: FilterOption[];
  priceRange: { min: number; max: number };
}

interface HostingsResponse {
  hostings: Hosting[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function HostingsListPage() {
  const router = useRouter();
  const searchParamsHook = useSearchParams();

  const [hostings, setHostings] = useState<Hosting[]>([]);
  const [filters, setFilters] = useState<FiltersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Извлекаем значения фильтров из URL
  // Используем useMemo для стабилизации массивов, чтобы избежать зацикливания
  // Сравниваем массивы по их строковому представлению
  const currentSearch = searchParamsHook?.get("search") || "";
  const currentPage = parseInt(searchParamsHook?.get("page") || "1", 10);

  const countriesArray = searchParamsHook?.getAll("country") || [];
  const countriesKey = countriesArray.join(",");
  // Используем только ключ в зависимостях, так как массив создается заново при каждом рендере
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentCountries = useMemo(() => countriesArray, [countriesKey]);

  const currentMinPrice = searchParamsHook?.get("minPrice") || "";
  const currentMaxPrice = searchParamsHook?.get("maxPrice") || "";

  const cmsArray = searchParamsHook?.getAll("cms") || [];
  const cmsKey = cmsArray.join(",");
  // Используем только ключ в зависимостях, так как массив создается заново при каждом рендере
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentCms = useMemo(() => cmsArray, [cmsKey]);

  const controlPanelsArray = searchParamsHook?.getAll("controlPanel") || [];
  const controlPanelsKey = controlPanelsArray.join(",");
  // Используем только ключ в зависимостях, так как массив создается заново при каждом рендере
  const currentControlPanels = useMemo(
    () => controlPanelsArray,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controlPanelsKey]
  );

  const osArray = searchParamsHook?.getAll("os") || [];
  const osKey = osArray.join(",");
  // Используем только ключ в зависимостях, так как массив создается заново при каждом рендере
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentOs = useMemo(() => osArray, [osKey]);

  // Функция для обновления URL параметров
  const updateURL = useCallback(
    (updates: {
      page?: number;
      search?: string;
      countries?: string[];
      minPrice?: string;
      maxPrice?: string;
      cms?: string[];
      controlPanels?: string[];
      os?: string[];
    }) => {
      const params = new URLSearchParams();

      if (updates.search !== undefined) {
        if (updates.search) {
          params.set("search", updates.search);
        }
      } else if (currentSearch) {
        params.set("search", currentSearch);
      }

      const page = updates.page !== undefined ? updates.page : currentPage;
      if (page > 1) {
        params.set("page", page.toString());
      }

      const countries =
        updates.countries !== undefined ? updates.countries : currentCountries;
      countries.forEach(country => params.append("country", country));

      const minPrice =
        updates.minPrice !== undefined ? updates.minPrice : currentMinPrice;
      if (minPrice) {
        params.set("minPrice", minPrice);
      }

      const maxPrice =
        updates.maxPrice !== undefined ? updates.maxPrice : currentMaxPrice;
      if (maxPrice) {
        params.set("maxPrice", maxPrice);
      }

      const cms = updates.cms !== undefined ? updates.cms : currentCms;
      cms.forEach(cmsItem => params.append("cms", cmsItem));

      const controlPanels =
        updates.controlPanels !== undefined
          ? updates.controlPanels
          : currentControlPanels;
      controlPanels.forEach(panel => params.append("controlPanel", panel));

      const os = updates.os !== undefined ? updates.os : currentOs;
      os.forEach(osItem => params.append("os", osItem));

      const queryString = params.toString();
      router.push(`/hosting${queryString ? `?${queryString}` : ""}`);
    },
    [
      router,
      currentSearch,
      currentPage,
      currentCountries,
      currentMinPrice,
      currentMaxPrice,
      currentCms,
      currentControlPanels,
      currentOs,
    ]
  );

  // Загрузка фильтров
  const loadFilters = useCallback(async () => {
    try {
      const response = await fetch("/api/public/filters");
      if (!response.ok) {
        throw new Error("Ошибка загрузки фильтров");
      }
      const data = await response.json();
      setFilters(data);
    } catch (err) {
      console.error("Ошибка загрузки фильтров:", err);
      // Не показываем ошибку для фильтров, просто используем пустые значения
      setFilters({
        countries: [],
        cms: [],
        controlPanels: [],
        operationSystems: [],
        priceRange: { min: 0, max: 0 },
      });
    }
  }, []);

  // Загрузка хостингов
  const loadHostings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (currentSearch) {
        params.set("search", currentSearch);
      }

      if (currentPage > 1) {
        params.set("page", currentPage.toString());
      }

      params.set("limit", "20");

      currentCountries.forEach(country => params.append("country", country));
      if (currentMinPrice) {
        params.set("minPrice", currentMinPrice);
      }
      if (currentMaxPrice) {
        params.set("maxPrice", currentMaxPrice);
      }
      currentCms.forEach(cmsItem => params.append("cms", cmsItem));
      currentControlPanels.forEach(panel =>
        params.append("controlPanel", panel)
      );
      currentOs.forEach(osItem => params.append("os", osItem));

      const response = await fetch(`/api/public/hostings?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка загрузки хостингов");
      }

      const data: HostingsResponse = await response.json();
      setHostings(data.hostings);
      setPagination(data.pagination);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка загрузки хостингов";
      setError(errorMessage);
      setHostings([]);
      setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
    } finally {
      setLoading(false);
    }
  }, [
    currentSearch,
    currentPage,
    currentCountries,
    currentMinPrice,
    currentMaxPrice,
    currentCms,
    currentControlPanels,
    currentOs,
  ]);

  // Загружаем данные при монтировании и изменении параметров
  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    loadHostings();
  }, [loadHostings]);

  // Обработчики изменения фильтров
  const handleSearchChange = (value: string) => {
    updateURL({ search: value, page: 1 });
  };

  const handleCountriesChange = (values: string[]) => {
    updateURL({ countries: values, page: 1 });
  };

  const handlePriceChange = (min: string, max: string) => {
    updateURL({ minPrice: min, maxPrice: max, page: 1 });
  };

  const handleCmsChange = (values: string[]) => {
    updateURL({ cms: values, page: 1 });
  };

  const handleControlPanelsChange = (values: string[]) => {
    updateURL({ controlPanels: values, page: 1 });
  };

  const handleOperationSystemsChange = (values: string[]) => {
    updateURL({ os: values, page: 1 });
  };

  const handleClear = () => {
    updateURL({
      search: "",
      page: 1,
      countries: [],
      minPrice: "",
      maxPrice: "",
      cms: [],
      controlPanels: [],
      os: [],
    });
  };

  const handlePageChange = (page: number) => {
    updateURL({ page });
    // Прокручиваем вверх при смене страницы
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleItemsPerPageChange = (_itemsPerPage: number) => {
    // Для публичной страницы используем фиксированный лимит 20
    // Но можем обновить URL если нужно
    updateURL({ page: 1 });
  };

  // Если фильтры еще не загружены, показываем loading
  if (!filters) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Каталог хостингов</h1>
          <p className="text-muted-foreground">
            Найдите подходящий хостинг для вашего проекта
          </p>
        </div>

        <HostingFilters
          search={currentSearch}
          countries={currentCountries}
          minPrice={currentMinPrice}
          maxPrice={currentMaxPrice}
          cms={currentCms}
          controlPanels={currentControlPanels}
          operationSystems={currentOs}
          availableFilters={filters}
          onSearchChange={handleSearchChange}
          onCountriesChange={handleCountriesChange}
          onPriceChange={handlePriceChange}
          onCmsChange={handleCmsChange}
          onControlPanelsChange={handleControlPanelsChange}
          onOperationSystemsChange={handleOperationSystemsChange}
          onClear={handleClear}
        />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="h-64 bg-gray-200 rounded"></div>
              </Card>
            ))}
          </div>
        ) : hostings.length === 0 ? (
          <Card className="p-12 text-center">
            <h3 className="text-xl font-semibold mb-2">Хостинги не найдены</h3>
            <p className="text-muted-foreground mb-4">
              Попробуйте изменить параметры фильтрации
            </p>
            <button
              onClick={handleClear}
              className="text-primary hover:underline"
            >
              Сбросить фильтры
            </button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hostings.map(hosting => (
                <HostingCard key={hosting.id} hosting={hosting} />
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="mt-8">
                <HostingsPagination
                  currentPage={pagination.page}
                  totalPages={pagination.pages}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
