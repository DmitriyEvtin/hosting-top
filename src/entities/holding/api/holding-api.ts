import { prisma } from "@/shared/api/database/prisma";
import {
  CreateHoldingData,
  Holding,
  HoldingListResponse,
  HoldingSearchParams,
  UpdateHoldingData,
} from "../model/types";

export class HoldingApi {
  /**
   * Получить список холдингов с поиском и пагинацией
   */
  static async getHoldings(
    params: HoldingSearchParams = {}
  ): Promise<HoldingListResponse> {
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

    const [holdings, total] = await Promise.all([
      prisma.holding.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.holding.count({ where }),
    ]);

    return {
      holdings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Получить холдинг по ID
   */
  static async getHoldingById(id: string): Promise<Holding | null> {
    return await prisma.holding.findUnique({
      where: { id },
    });
  }

  /**
   * Создать новый холдинг
   */
  static async createHolding(data: CreateHoldingData): Promise<Holding> {
    return await prisma.holding.create({
      data,
    });
  }

  /**
   * Обновить холдинг
   */
  static async updateHolding(
    id: string,
    data: UpdateHoldingData
  ): Promise<Holding> {
    return await prisma.holding.update({
      where: { id },
      data,
    });
  }

  /**
   * Удалить холдинг
   */
  static async deleteHolding(id: string): Promise<Holding> {
    return await prisma.holding.delete({
      where: { id },
    });
  }

  /**
   * Проверить существование холдинга по названию
   */
  static async holdingExists(
    name: string,
    excludeId?: string
  ): Promise<boolean> {
    const where: { name: string; id?: { not: string } } = { name };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const holding = await prisma.holding.findFirst({ where });
    return !!holding;
  }
}
