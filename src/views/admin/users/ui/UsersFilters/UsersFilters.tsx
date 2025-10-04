"use client";

import { UserRole } from "@/shared/lib/types";
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

interface UsersFiltersProps {
  search: string;
  role: string;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onClear: () => void;
}

export function UsersFilters({
  search,
  role,
  onSearchChange,
  onRoleChange,
  onClear,
}: UsersFiltersProps) {
  const hasActiveFilters = search || role;

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Поиск по имени или email..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="w-full sm:w-48">
        <Select value={role || "all"} onValueChange={onRoleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Все роли" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все роли</SelectItem>
            <SelectItem value={UserRole.ADMIN}>Администратор</SelectItem>
            <SelectItem value={UserRole.USER}>Пользователь</SelectItem>
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
          Очистить
        </Button>
      )}
    </div>
  );
}
