"use client";

import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/Select";
import { Search, X } from "lucide-react";

interface ContentBlocksFiltersProps {
  search: string;
  isActive: string;
  onSearchChange: (value: string) => void;
  onIsActiveChange: (value: string) => void;
  onClear: () => void;
}

export function ContentBlocksFilters({
  search,
  isActive,
  onSearchChange,
  onIsActiveChange,
  onClear,
}: ContentBlocksFiltersProps) {
  const hasActiveFilters = search || isActive !== "all";

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Поиск по ключу или заголовку..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="w-full sm:w-48">
        <Select value={isActive || "all"} onValueChange={onIsActiveChange}>
          <SelectTrigger>
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="true">Активные</SelectItem>
            <SelectItem value="false">Неактивные</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={onClear}
          className="w-full sm:w-auto"
        >
          <X className="h-4 w-4 mr-2" />
          Сбросить фильтры
        </Button>
      )}
    </div>
  );
}

