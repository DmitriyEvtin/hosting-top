"use client";

import { Category } from "@/entities/category/model/types";
import { Site } from "@/entities/site/model/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/Select";
import { Label } from "@/shared/ui/Label";

interface ProductsFiltersProps {
  sites: Site[];
  categories: Category[];
  selectedSiteId: string | null;
  selectedCategoryId: string | null;
  onSiteChange: (siteId: string | null) => void;
  onCategoryChange: (categoryId: string | null) => void;
}

export function ProductsFilters({
  sites,
  categories,
  selectedSiteId,
  selectedCategoryId,
  onSiteChange,
  onCategoryChange,
}: ProductsFiltersProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Label htmlFor="site-filter">Сайт:</Label>
        <Select
          value={selectedSiteId || "all"}
          onValueChange={(value) => onSiteChange(value === "all" ? null : value)}
        >
          <SelectTrigger id="site-filter" className="w-[200px]">
            <SelectValue placeholder="Выберите сайт" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все сайты</SelectItem>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="category-filter">Категория:</Label>
        <Select
          value={selectedCategoryId || "all"}
          onValueChange={(value) =>
            onCategoryChange(value === "all" ? null : value)
          }
        >
          <SelectTrigger id="category-filter" className="w-[200px]">
            <SelectValue placeholder="Выберите категорию" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

