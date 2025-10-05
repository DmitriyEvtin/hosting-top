"use client";

import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Search, X } from "lucide-react";

interface CitiesFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  onClear: () => void;
}

export function CitiesFilters({
  search,
  onSearchChange,
  onClear,
}: CitiesFiltersProps) {
  const hasActiveFilters = search;

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Поиск по названию города..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={onClear}
          className="w-full sm:w-auto"
        >
          <X className="h-4 w-4 mr-2" />
          Очистить
        </Button>
      )}
    </div>
  );
}
