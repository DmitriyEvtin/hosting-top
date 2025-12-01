"use client";

import { Site } from "@/entities/site/model/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/Select";
import { Label } from "@/shared/ui/Label";

interface CategoriesFiltersProps {
  sites: Site[];
  selectedSiteId: string | null;
  onSiteChange: (siteId: string | null) => void;
}

export function CategoriesFilters({
  sites,
  selectedSiteId,
  onSiteChange,
}: CategoriesFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      <Label htmlFor="site-filter">Фильтр по сайту:</Label>
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
  );
}

