"use client";

import { Checkbox } from "@/shared/ui/Checkbox";
import { Input } from "@/shared/ui/Input";
import { Label } from "@/shared/ui/Label";
import { cn } from "@/shared/lib/utils";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface MultiSelectOption {
  id: string;
  name: string;
  slug: string;
}

interface MultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Поиск...",
  className,
}: MultiSelectProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Фильтрация опций по поиску
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const searchLower = search.toLowerCase();
    return options.filter(
      (option) =>
        option.name.toLowerCase().includes(searchLower) ||
        option.slug.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  // Обработка изменения чекбокса
  const handleToggle = (optionId: string) => {
    const newValue = value.includes(optionId)
      ? value.filter((id) => id !== optionId)
      : [...value, optionId];
    onChange(newValue);
  };

  // Получение выбранных опций
  const selectedOptions = useMemo(() => {
    return options.filter((option) => value.includes(option.id));
  }, [options, value]);

  // Очистка выбора
  const handleClear = () => {
    onChange([]);
    setSearch("");
  };

  // Закрытие при клике вне компонента
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
        {/* Триггер */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            isOpen && "ring-2 ring-ring"
          )}
        >
          <span className="truncate">
            {selectedOptions.length === 0
              ? placeholder
              : selectedOptions.length === 1
              ? selectedOptions[0].name
              : `Выбрано: ${selectedOptions.length}`}
          </span>
          <div className="flex items-center gap-1">
            {value.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="rounded-sm p-1 hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </button>

        {/* Выпадающий список */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
            {/* Поиск */}
            <div className="border-b p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={placeholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Список опций */}
            <div className="max-h-60 overflow-auto p-2">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Ничего не найдено
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredOptions.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        checked={value.includes(option.id)}
                        onChange={() => handleToggle(option.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-sm">{option.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Выбранные элементы (теги) */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <div
              key={option.id}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs"
            >
              <span>{option.name}</span>
              <button
                type="button"
                onClick={() => handleToggle(option.id)}
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

