export interface Product {
  id: string;
  name: string;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
  category?: Category | null;
  sites?: ProductSite[];
}

export interface Category {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductSite {
  productId: string;
  siteId: string;
  site: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface CreateProductData {
  name: string;
  categoryId?: string | null;
  siteIds: string[];
}

export interface UpdateProductData {
  name?: string;
  categoryId?: string | null;
  siteIds?: string[];
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductImagesData {
  imageUrls: string[];
}

export interface ReorderProductImagesData {
  imageIds: string[];
}

