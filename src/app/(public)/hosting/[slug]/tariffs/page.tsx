import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/shared/api/database";
import { HostingTariffsPage } from "@/views/public/hostings/ui/HostingTariffsPage";

interface Props {
  params: Promise<{ slug: string }> | { slug: string };
}

async function getHostingWithTariffs(slug: string) {
  try {
    // Получаем хостинг по slug с проверкой активности
    const hosting = await prisma.hosting.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        websiteUrl: true,
        isActive: true,
      },
    });

    // Если хостинг не найден или неактивен, возвращаем null
    if (!hosting || !hosting.isActive) {
      return null;
    }

    // Получаем все активные тарифы хостинга со всеми связями
    const tariffs = await prisma.tariff.findMany({
      where: {
        hostingId: hosting.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        subtitle: true,
        link: true,
        priceMonth: true,
        priceYear: true,
        currency: true,
        diskSpace: true,
        traffic: true,
        domains: true,
        sites: true,
        countDb: true,
        ftpAccounts: true,
        mailboxes: true,
        ssl: true,
        backup: true,
        ssh: true,
        automaticCms: true,
        ddosDef: true,
        antivirus: true,
        countTestDays: true,
        cms: {
          select: {
            cms: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        controlPanels: {
          select: {
            controlPanel: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        countries: {
          select: {
            country: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        dataStores: {
          select: {
            dataStore: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        operationSystems: {
          select: {
            operationSystem: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        programmingLanguages: {
          select: {
            programmingLanguage: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Трансформируем структуру связанных данных (убираем вложенность)
    const transformedTariffs = tariffs.map((tariff) => ({
      id: tariff.id,
      name: tariff.name,
      subtitle: tariff.subtitle,
      link: tariff.link,
      priceMonth: tariff.priceMonth,
      priceYear: tariff.priceYear,
      currency: tariff.currency,
      diskSpace: tariff.diskSpace,
      traffic: tariff.traffic,
      domains: tariff.domains,
      sites: tariff.sites,
      countDb: tariff.countDb,
      ftpAccounts: tariff.ftpAccounts,
      mailboxes: tariff.mailboxes,
      ssl: tariff.ssl,
      backup: tariff.backup,
      ssh: tariff.ssh,
      automaticCms: tariff.automaticCms,
      ddosDef: tariff.ddosDef,
      antivirus: tariff.antivirus,
      countTestDays: tariff.countTestDays,
      cms: tariff.cms.map((tc) => tc.cms),
      controlPanels: tariff.controlPanels.map((tcp) => tcp.controlPanel),
      countries: tariff.countries.map((tc) => tc.country),
      dataStores: tariff.dataStores.map((tds) => tds.dataStore),
      operationSystems: tariff.operationSystems.map((tos) => tos.operationSystem),
      programmingLanguages: tariff.programmingLanguages.map(
        (tpl) => tpl.programmingLanguage
      ),
    }));

    return {
      hosting: {
        id: hosting.id,
        name: hosting.name,
        slug: hosting.slug,
        logoUrl: hosting.logoUrl,
        websiteUrl: hosting.websiteUrl,
      },
      tariffs: transformedTariffs,
    };
  } catch (error) {
    console.error("Ошибка получения тарифов хостинга:", error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;

  const data = await getHostingWithTariffs(slug);

  if (!data) {
    return {
      title: "Хостинг не найден",
      description: "Запрашиваемый хостинг не найден или неактивен",
    };
  }

  return {
    title: `${data.hosting.name} - Тарифы`,
    description: `Все тарифы хостинга ${data.hosting.name} с подробными характеристиками. Сравните цены, технические характеристики и возможности тарифов.`,
  };
}

export default async function HostingTariffsPageRoute({ params }: Props) {
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;

  const data = await getHostingWithTariffs(slug);

  if (!data) {
    notFound();
  }

  return (
    <HostingTariffsPage hosting={data.hosting} tariffs={data.tariffs} />
  );
}

