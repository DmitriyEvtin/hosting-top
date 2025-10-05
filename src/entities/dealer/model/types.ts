export interface Dealer {
  id: string;
  name: string;
  holdingId?: string | null;
  cityId?: string | null;
  dealerType: DealerType;
  totalSales?: number | null;
  balance?: number | null;
  managerId?: string | null;
  cooperationStartDate?: Date | null;
  lastVisitDate?: Date | null;

  // Аудит
  createdById?: string | null;
  updatedById?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Связанные данные
  holding?: {
    id: string;
    name: string;
  } | null;
  city?: {
    id: string;
    name: string;
  } | null;
  manager?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  createdBy?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  updatedBy?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export enum DealerType {
  VIP = "VIP",
  STANDARD = "STANDARD",
  PREMIUM = "PREMIUM",
}

export interface CreateDealerData {
  name: string;
  holdingId?: string | null;
  cityId?: string | null;
  dealerType?: DealerType;
  totalSales?: number | null;
  balance?: number | null;
  managerId?: string | null;
  cooperationStartDate?: Date | null;
  lastVisitDate?: Date | null;
}

export interface UpdateDealerData {
  name?: string;
  holdingId?: string | null;
  cityId?: string | null;
  dealerType?: DealerType;
  totalSales?: number | null;
  balance?: number | null;
  managerId?: string | null;
  cooperationStartDate?: Date | null;
  lastVisitDate?: Date | null;
}

export interface DealerSearchParams {
  search?: string;
  page?: number;
  limit?: number;
  cityId?: string;
  holdingId?: string;
  managerId?: string;
  dealerType?: DealerType;
  cooperationStartDateFrom?: Date;
  cooperationStartDateTo?: Date;
  lastVisitDateFrom?: Date;
  lastVisitDateTo?: Date;
  sortBy?:
    | "name"
    | "totalSales"
    | "balance"
    | "cooperationStartDate"
    | "lastVisitDate"
    | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface DealerListResponse {
  dealers: Dealer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}

export interface DealerFilters {
  search: string;
  cityId: string;
  holdingId: string;
  managerId: string;
  dealerType: DealerType | "";
  cooperationStartDateFrom: string;
  cooperationStartDateTo: string;
  lastVisitDateFrom: string;
  lastVisitDateTo: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface DealerExportData {
  dealers: Dealer[];
  total: number;
  exportDate: Date;
}
