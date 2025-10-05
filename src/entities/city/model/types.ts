export interface City {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCityData {
  name: string;
}

export interface UpdateCityData {
  name: string;
}

export interface CitySearchParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CityListResponse {
  cities: City[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}
