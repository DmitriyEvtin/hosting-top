import { prisma } from "@/shared/api/database/prisma";
import {
  City,
  CityListResponse,
  CitySearchParams,
  CreateCityData,
  UpdateCityData,
} from "../model/types";

export class CityApi {
  /**
   * Получить список городов с поиском и пагинацией
   */
  static async getCities(
    params: CitySearchParams = {}
  ): Promise<CityListResponse> {
    const { search = "", page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {};

    const [cities, total] = await Promise.all([
      prisma.city.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.city.count({ where }),
    ]);

    return {
      cities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Получить город по ID
   */
  static async getCityById(id: string): Promise<City | null> {
    return await prisma.city.findUnique({
      where: { id },
    });
  }

  /**
   * Создать новый город
   */
  static async createCity(data: CreateCityData): Promise<City> {
    return await prisma.city.create({
      data,
    });
  }

  /**
   * Обновить город
   */
  static async updateCity(id: string, data: UpdateCityData): Promise<City> {
    return await prisma.city.update({
      where: { id },
      data,
    });
  }

  /**
   * Удалить город
   */
  static async deleteCity(id: string): Promise<City> {
    return await prisma.city.delete({
      where: { id },
    });
  }

  /**
   * Проверить существование города по названию
   */
  static async cityExists(name: string, excludeId?: string): Promise<boolean> {
    const where: { name: string; id?: { not: string } } = { name };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const city = await prisma.city.findFirst({ where });
    return !!city;
  }
}
