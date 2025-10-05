"use client";

import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Label } from "@/shared/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/Select";
import { Filter, Search, X } from "lucide-react";
import {
  DealerFilters as DealerFiltersType,
  DealerType,
} from "../../model/types";

interface DealerFiltersProps {
  filters: DealerFiltersType;
  onFiltersChange: (filters: DealerFiltersType) => void;
  onReset: () => void;
  cities: Array<{ id: string; name: string }>;
  holdings: Array<{ id: string; name: string }>;
  managers: Array<{ id: string; name: string; email: string }>;
}

export function DealerFilters({
  filters,
  onFiltersChange,
  onReset,
  cities,
  holdings,
  managers,
}: DealerFiltersProps) {
  const handleFilterChange = (key: keyof DealerFiltersType, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === "all" ? "" : value,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.cityId ||
    filters.holdingId ||
    filters.managerId ||
    filters.dealerType ||
    filters.cooperationStartDateFrom ||
    filters.cooperationStartDateTo ||
    filters.lastVisitDateFrom ||
    filters.lastVisitDateTo;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h3 className="font-medium">Фильтры</h3>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="h-4 w-4 mr-1" />
            Сбросить
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Поиск по названию */}
        <div className="md:col-span-2">
          <Label htmlFor="search">Поиск по названию</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Введите название дилера..."
              value={filters.search}
              onChange={e => handleFilterChange("search", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Город */}
        <div>
          <Label htmlFor="city">Город</Label>
          <Select
            value={filters.cityId || "all"}
            onValueChange={value => handleFilterChange("cityId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Все города" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все города</SelectItem>
              {cities.map(city => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Холдинг */}
        <div>
          <Label htmlFor="holding">Холдинг</Label>
          <Select
            value={filters.holdingId || "all"}
            onValueChange={value => handleFilterChange("holdingId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Все холдинги" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все холдинги</SelectItem>
              {holdings.map(holding => (
                <SelectItem key={holding.id} value={holding.id}>
                  {holding.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Менеджер */}
        <div>
          <Label htmlFor="manager">Менеджер</Label>
          <Select
            value={filters.managerId || "all"}
            onValueChange={value => handleFilterChange("managerId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Все менеджеры" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все менеджеры</SelectItem>
              {managers.map(manager => (
                <SelectItem key={manager.id} value={manager.id}>
                  {manager.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Тип дилера */}
        <div>
          <Label htmlFor="dealerType">Тип дилера</Label>
          <Select
            value={filters.dealerType || "all"}
            onValueChange={value => handleFilterChange("dealerType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Все типы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value={DealerType.VIP}>VIP</SelectItem>
              <SelectItem value={DealerType.STANDARD}>Стандарт</SelectItem>
              <SelectItem value={DealerType.PREMIUM}>Премиум</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Дата начала сотрудничества - от */}
        <div>
          <Label htmlFor="cooperationStartDateFrom">
            Дата сотрудничества от
          </Label>
          <Input
            id="cooperationStartDateFrom"
            type="date"
            value={filters.cooperationStartDateFrom}
            onChange={e =>
              handleFilterChange("cooperationStartDateFrom", e.target.value)
            }
          />
        </div>

        {/* Дата начала сотрудничества - до */}
        <div>
          <Label htmlFor="cooperationStartDateTo">Дата сотрудничества до</Label>
          <Input
            id="cooperationStartDateTo"
            type="date"
            value={filters.cooperationStartDateTo}
            onChange={e =>
              handleFilterChange("cooperationStartDateTo", e.target.value)
            }
          />
        </div>

        {/* Дата последнего посещения - от */}
        <div>
          <Label htmlFor="lastVisitDateFrom">Последний визит от</Label>
          <Input
            id="lastVisitDateFrom"
            type="date"
            value={filters.lastVisitDateFrom}
            onChange={e =>
              handleFilterChange("lastVisitDateFrom", e.target.value)
            }
          />
        </div>

        {/* Дата последнего посещения - до */}
        <div>
          <Label htmlFor="lastVisitDateTo">Последний визит до</Label>
          <Input
            id="lastVisitDateTo"
            type="date"
            value={filters.lastVisitDateTo}
            onChange={e =>
              handleFilterChange("lastVisitDateTo", e.target.value)
            }
          />
        </div>
      </div>
    </div>
  );
}
