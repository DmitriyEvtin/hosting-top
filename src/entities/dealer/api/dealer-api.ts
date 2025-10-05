import { prisma } from "@/shared/api/database/prisma";
import {
  CreateDealerData,
  Dealer,
  DealerListResponse,
  DealerSearchParams,
  DealerType,
  UpdateDealerData,
} from "../model/types";

// Функция преобразования типов
const mapPrismaDealerToDealer = (prismaDealer: unknown): Dealer => {
  const dealer = prismaDealer as Record<string, unknown>;
  return {
    ...dealer,
    dealerType: dealer.dealerType as DealerType,
  } as Dealer;
};

export class DealerApi {
  // Получить список дилеров с фильтрацией и пагинацией
  static async getDealers(
    params: DealerSearchParams = {}
  ): Promise<DealerListResponse> {
    try {
      const {
        search = "",
        page = 1,
        limit = 10,
        cityId,
        holdingId,
        managerId,
        dealerType,
        cooperationStartDateFrom,
        cooperationStartDateTo,
        lastVisitDateFrom,
        lastVisitDateTo,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = params;

      const skip = (page - 1) * limit;

      // Построение условий фильтрации
      const where: Record<string, unknown> = {};

      if (search) {
        where.name = {
          contains: search,
          mode: "insensitive",
        };
      }

      if (cityId) {
        where.cityId = cityId;
      }

      if (holdingId) {
        where.holdingId = holdingId;
      }

      if (managerId) {
        where.managerId = managerId;
      }

      if (dealerType) {
        where.dealerType = dealerType;
      }

      if (cooperationStartDateFrom || cooperationStartDateTo) {
        where.cooperationStartDate = {};
        if (cooperationStartDateFrom) {
          where.cooperationStartDate.gte = cooperationStartDateFrom;
        }
        if (cooperationStartDateTo) {
          where.cooperationStartDate.lte = cooperationStartDateTo;
        }
      }

      if (lastVisitDateFrom || lastVisitDateTo) {
        where.lastVisitDate = {};
        if (lastVisitDateFrom) {
          where.lastVisitDate.gte = lastVisitDateFrom;
        }
        if (lastVisitDateTo) {
          where.lastVisitDate.lte = lastVisitDateTo;
        }
      }

      // Построение сортировки
      const orderBy: Record<string, string> = {};
      orderBy[sortBy] = sortOrder;

      // Получение дилеров с связанными данными
      const [dealers, total] = await Promise.all([
        prisma.dealer.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            holding: {
              select: {
                id: true,
                name: true,
              },
            },
            city: {
              select: {
                id: true,
                name: true,
              },
            },
            manager: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            updatedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.dealer.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        dealers: dealers.map(mapPrismaDealerToDealer),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error("Ошибка при получении дилеров:", error);
      return {
        dealers: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        error: "Ошибка при загрузке дилеров",
      };
    }
  }

  // Получить дилера по ID
  static async getDealerById(id: string): Promise<Dealer | null> {
    try {
      const dealer = await prisma.dealer.findUnique({
        where: { id },
        include: {
          holding: {
            select: {
              id: true,
              name: true,
            },
          },
          city: {
            select: {
              id: true,
              name: true,
            },
          },
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return dealer ? mapPrismaDealerToDealer(dealer) : null;
    } catch (error) {
      console.error("Ошибка при получении дилера:", error);
      return null;
    }
  }

  // Создать дилера
  static async createDealer(
    data: CreateDealerData,
    createdById?: string
  ): Promise<Dealer | null> {
    try {
      // Валидация внешних ключей
      if (data.holdingId) {
        const holding = await prisma.holding.findUnique({
          where: { id: data.holdingId },
          select: { id: true },
        });
        if (!holding) {
          console.error(`Холдинг с ID ${data.holdingId} не найден`);
          data.holdingId = undefined;
        }
      }

      if (data.cityId) {
        const city = await prisma.city.findUnique({
          where: { id: data.cityId },
          select: { id: true },
        });
        if (!city) {
          console.error(`Город с ID ${data.cityId} не найден`);
          data.cityId = undefined;
        }
      }

      if (data.managerId) {
        const manager = await prisma.user.findUnique({
          where: { id: data.managerId },
          select: { id: true },
        });
        if (!manager) {
          console.error(`Менеджер с ID ${data.managerId} не найден`);
          data.managerId = undefined;
        }
      }

      const dealer = await prisma.dealer.create({
        data: {
          ...data,
          createdById,
          updatedById: createdById,
        },
        include: {
          holding: {
            select: {
              id: true,
              name: true,
            },
          },
          city: {
            select: {
              id: true,
              name: true,
            },
          },
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return dealer ? mapPrismaDealerToDealer(dealer) : null;
    } catch (error) {
      console.error("Ошибка при создании дилера:", error);
      return null;
    }
  }

  // Обновить дилера
  static async updateDealer(
    id: string,
    data: UpdateDealerData,
    updatedById?: string
  ): Promise<Dealer | null> {
    try {
      const dealer = await prisma.dealer.update({
        where: { id },
        data: {
          ...data,
          updatedById,
        },
        include: {
          holding: {
            select: {
              id: true,
              name: true,
            },
          },
          city: {
            select: {
              id: true,
              name: true,
            },
          },
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return dealer ? mapPrismaDealerToDealer(dealer) : null;
    } catch (error) {
      console.error("Ошибка при обновлении дилера:", error);
      return null;
    }
  }

  // Удалить дилера
  static async deleteDealer(id: string): Promise<boolean> {
    try {
      await prisma.dealer.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("Ошибка при удалении дилера:", error);
      return false;
    }
  }

  // Экспорт дилеров в Excel
  static async exportDealers(
    params: DealerSearchParams = {}
  ): Promise<Dealer[]> {
    try {
      const {
        search = "",
        cityId,
        holdingId,
        managerId,
        dealerType,
        cooperationStartDateFrom,
        cooperationStartDateTo,
        lastVisitDateFrom,
        lastVisitDateTo,
      } = params;

      const where: Record<string, unknown> = {};

      if (search) {
        where.name = {
          contains: search,
          mode: "insensitive",
        };
      }

      if (cityId) {
        where.cityId = cityId;
      }

      if (holdingId) {
        where.holdingId = holdingId;
      }

      if (managerId) {
        where.managerId = managerId;
      }

      if (dealerType) {
        where.dealerType = dealerType;
      }

      if (cooperationStartDateFrom || cooperationStartDateTo) {
        where.cooperationStartDate = {};
        if (cooperationStartDateFrom) {
          where.cooperationStartDate.gte = cooperationStartDateFrom;
        }
        if (cooperationStartDateTo) {
          where.cooperationStartDate.lte = cooperationStartDateTo;
        }
      }

      if (lastVisitDateFrom || lastVisitDateTo) {
        where.lastVisitDate = {};
        if (lastVisitDateFrom) {
          where.lastVisitDate.gte = lastVisitDateFrom;
        }
        if (lastVisitDateTo) {
          where.lastVisitDate.lte = lastVisitDateTo;
        }
      }

      const dealers = await prisma.dealer.findMany({
        where,
        include: {
          holding: {
            select: {
              id: true,
              name: true,
            },
          },
          city: {
            select: {
              id: true,
              name: true,
            },
          },
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return dealers.map(mapPrismaDealerToDealer);
    } catch (error) {
      console.error("Ошибка при экспорте дилеров:", error);
      return [];
    }
  }

  // Получить статистику дилеров
  static async getDealerStats() {
    try {
      const [totalDealers, totalSales, totalBalance, dealersByType] =
        await Promise.all([
          prisma.dealer.count(),
          prisma.dealer.aggregate({
            _sum: {
              totalSales: true,
            },
          }),
          prisma.dealer.aggregate({
            _sum: {
              balance: true,
            },
          }),
          prisma.dealer.groupBy({
            by: ["dealerType"],
            _count: {
              id: true,
            },
          }),
        ]);

      return {
        totalDealers,
        totalSales: totalSales._sum.totalSales || 0,
        totalBalance: totalBalance._sum.balance || 0,
        dealersByType,
      };
    } catch (error) {
      console.error("Ошибка при получении статистики дилеров:", error);
      return {
        totalDealers: 0,
        totalSales: 0,
        totalBalance: 0,
        dealersByType: [],
      };
    }
  }
}
