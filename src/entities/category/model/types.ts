export interface Category {
  id: string;
  name: string;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  sites?: CategorySite[];
}

export interface CategorySite {
  categoryId: string;
  siteId: string;
  site: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface CreateCategoryData {
  name: string;
  siteIds: string[];
}

export interface UpdateCategoryData {
  name?: string;
  siteIds?: string[];
  image?: string | null;
}

