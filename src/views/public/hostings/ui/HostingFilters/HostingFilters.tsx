"use client";

import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Label } from "@/shared/ui/Label";
import { Checkbox } from "@/shared/ui/Checkbox";
import { cn } from "@/shared/lib/utils";
import { Search, X, Filter, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface FilterOption {
  slug: string;
  name: string;
  count: number;
}

interface HostingFiltersProps {
  search: string;
  countries: string[];
  minPrice: string;
  maxPrice: string;
  cms: string[];
  controlPanels: string[];
  operationSystems: string[];
  availableFilters: {
    countries: FilterOption[];
    cms: FilterOption[];
    controlPanels: FilterOption[];
    operationSystems: FilterOption[];
    priceRange: { min: number; max: number };
  };
  onSearchChange: (value: string) => void;
  onCountriesChange: (values: string[]) => void;
  onPriceChange: (min: string, max: string) => void;
  onCmsChange: (values: string[]) => void;
  onControlPanelsChange: (values: string[]) => void;
  onOperationSystemsChange: (values: string[]) => void;
  onClear: () => void;
}

function MultiSelectFilter({
  label,
  options,
  value,
  onChange,
  placeholder = "Выберите...",
  className,
}: {
  label: string;
  options: FilterOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const searchLower = search.toLowerCase();
    return options.filter(
      (option) =>
        option.name.toLowerCase().includes(searchLower) ||
        option.slug.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  const handleToggle = (optionSlug: string) => {
    const newValue = value.includes(optionSlug)
      ? value.filter((slug) => slug !== optionSlug)
      : [...value, optionSlug];
    onChange(newValue);
  };

  const selectedOptions = useMemo(() => {
    return options.filter((option) => value.includes(option.slug));
  }, [options, value]);

  const handleClear = () => {
    onChange([]);
    setSearch("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      <Label>{label}</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            isOpen && "ring-2 ring-ring"
          )}
        >
          <span className="truncate text-left">
            {selectedOptions.length === 0
              ? placeholder
              : selectedOptions.length === 1
              ? selectedOptions[0].name
              : `Выбрано: ${selectedOptions.length}`}
          </span>
          <div className="flex items-center gap-1">
            {value.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClear();
                  }
                }}
                className="rounded-sm p-1 hover:bg-accent cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              >
                <X className="h-4 w-4" />
              </span>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isOpen && "transform rotate-180"
              )}
            />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
            <div className="border-b p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Поиск..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            <div className="max-h-60 overflow-auto p-2">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Ничего не найдено
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredOptions.map((option) => (
                    <label
                      key={option.slug}
                      className="flex items-center justify-between space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <Checkbox
                          checked={value.includes(option.slug)}
                          onChange={() => handleToggle(option.slug)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-sm truncate">{option.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        ({option.count})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <div
              key={option.slug}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs"
            >
              <span>{option.name}</span>
              <button
                type="button"
                onClick={() => handleToggle(option.slug)}
                className="rounded-full hover:bg-primary/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HostingFilters({
  search,
  countries,
  minPrice,
  maxPrice,
  cms,
  controlPanels,
  operationSystems,
  availableFilters,
  onSearchChange,
  onCountriesChange,
  onPriceChange,
  onCmsChange,
  onControlPanelsChange,
  onOperationSystemsChange,
  onClear,
}: HostingFiltersProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const hasActiveFilters =
    search ||
    countries.length > 0 ||
    minPrice ||
    maxPrice ||
    cms.length > 0 ||
    controlPanels.length > 0 ||
    operationSystems.length > 0;

  return (
    <div className="space-y-4">
      {/* Desktop and Mobile Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Поиск по названию хостинга..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden"
        >
          <Filter className="h-4 w-4 mr-2" />
          Фильтры
        </Button>

        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onClear}
            className="hidden lg:flex"
          >
            <X className="h-4 w-4 mr-2" />
            Сбросить
          </Button>
        )}
      </div>

      {/* Desktop Filters */}
      <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4 bg-card rounded-lg border">
        <MultiSelectFilter
          label="Страны"
          options={availableFilters.countries}
          value={countries}
          onChange={onCountriesChange}
          placeholder="Выберите страны"
        />

        <div className="space-y-2">
          <Label>Цена (руб/мес)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="От"
              value={minPrice}
              onChange={(e) =>
                onPriceChange(e.target.value, maxPrice)
              }
              min={availableFilters.priceRange.min}
              max={availableFilters.priceRange.max}
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="number"
              placeholder="До"
              value={maxPrice}
              onChange={(e) =>
                onPriceChange(minPrice, e.target.value)
              }
              min={availableFilters.priceRange.min}
              max={availableFilters.priceRange.max}
            />
          </div>
        </div>

        <MultiSelectFilter
          label="CMS"
          options={availableFilters.cms}
          value={cms}
          onChange={onCmsChange}
          placeholder="Выберите CMS"
        />

        <MultiSelectFilter
          label="Панели управления"
          options={availableFilters.controlPanels}
          value={controlPanels}
          onChange={onControlPanelsChange}
          placeholder="Выберите панели"
        />

        <MultiSelectFilter
          label="ОС"
          options={availableFilters.operationSystems}
          value={operationSystems}
          onChange={onOperationSystemsChange}
          placeholder="Выберите ОС"
        />

        {hasActiveFilters && (
          <div className="flex items-end">
            <Button variant="outline" onClick={onClear} className="w-full">
              <X className="h-4 w-4 mr-2" />
              Сбросить фильтры
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Filters (Drawer) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-card border-l shadow-lg overflow-y-auto">
            <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Фильтры</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <MultiSelectFilter
                label="Страны"
                options={availableFilters.countries}
                value={countries}
                onChange={onCountriesChange}
                placeholder="Выберите страны"
              />

              <div className="space-y-2">
                <Label>Цена (руб/мес)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="От"
                    value={minPrice}
                    onChange={(e) =>
                      onPriceChange(e.target.value, maxPrice)
                    }
                    min={availableFilters.priceRange.min}
                    max={availableFilters.priceRange.max}
                  />
                  <span className="text-muted-foreground">—</span>
                  <Input
                    type="number"
                    placeholder="До"
                    value={maxPrice}
                    onChange={(e) =>
                      onPriceChange(minPrice, e.target.value)
                    }
                    min={availableFilters.priceRange.min}
                    max={availableFilters.priceRange.max}
                  />
                </div>
              </div>

              <MultiSelectFilter
                label="CMS"
                options={availableFilters.cms}
                value={cms}
                onChange={onCmsChange}
                placeholder="Выберите CMS"
              />

              <MultiSelectFilter
                label="Панели управления"
                options={availableFilters.controlPanels}
                value={controlPanels}
                onChange={onControlPanelsChange}
                placeholder="Выберите панели"
              />

              <MultiSelectFilter
                label="ОС"
                options={availableFilters.operationSystems}
                value={operationSystems}
                onChange={onOperationSystemsChange}
                placeholder="Выберите ОС"
              />

              {hasActiveFilters && (
                <Button variant="outline" onClick={onClear} className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Сбросить фильтры
                </Button>
              )}

              <Button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full"
              >
                Применить фильтры
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

