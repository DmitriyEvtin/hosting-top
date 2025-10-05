import { DealerApi } from "@/entities/dealer/api";
import { DealerSearchParams, DealerType } from "@/entities/dealer/model";
import { authOptions } from "@/shared/lib/auth-config";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const params: DealerSearchParams = {
      search: searchParams.get("search") || undefined,
      cityId: searchParams.get("cityId") || undefined,
      holdingId: searchParams.get("holdingId") || undefined,
      managerId: searchParams.get("managerId") || undefined,
      dealerType: (searchParams.get("dealerType") as DealerType) || undefined,
      cooperationStartDateFrom: searchParams.get("cooperationStartDateFrom")
        ? new Date(searchParams.get("cooperationStartDateFrom")!)
        : undefined,
      cooperationStartDateTo: searchParams.get("cooperationStartDateTo")
        ? new Date(searchParams.get("cooperationStartDateTo")!)
        : undefined,
      lastVisitDateFrom: searchParams.get("lastVisitDateFrom")
        ? new Date(searchParams.get("lastVisitDateFrom")!)
        : undefined,
      lastVisitDateTo: searchParams.get("lastVisitDateTo")
        ? new Date(searchParams.get("lastVisitDateTo")!)
        : undefined,
    };

    const dealers = await DealerApi.exportDealers(params);

    // Создаем CSV данные
    const csvHeaders = [
      "ID",
      "Название",
      "Холдинг",
      "Город",
      "Тип дилера",
      "Сумма продаж",
      "Баланс",
      "Менеджер",
      "Дата начала сотрудничества",
      "Дата последнего посещения",
      "Создано",
      "Обновлено",
    ];

    const csvRows = dealers.map(dealer => [
      dealer.id,
      dealer.name,
      dealer.holding?.name || "",
      dealer.city?.name || "",
      dealer.dealerType,
      dealer.totalSales || 0,
      dealer.balance || 0,
      dealer.manager?.name || "",
      dealer.cooperationStartDate
        ? dealer.cooperationStartDate.toLocaleDateString("ru-RU")
        : "",
      dealer.lastVisitDate
        ? dealer.lastVisitDate.toLocaleDateString("ru-RU")
        : "",
      dealer.createdAt.toLocaleDateString("ru-RU"),
      dealer.updatedAt.toLocaleDateString("ru-RU"),
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dealers-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });

    return response;
  } catch (error) {
    console.error("Ошибка API GET /api/dealers/export:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
