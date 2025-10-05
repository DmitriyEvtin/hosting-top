export interface Holding {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHoldingData {
  name: string;
}

export interface UpdateHoldingData {
  name: string;
}

export interface HoldingSearchParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface HoldingListResponse {
  holdings: Holding[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}
