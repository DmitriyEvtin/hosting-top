import { prisma } from "@/shared/api/database";
import { HostingOverviewPage } from "@/views/public/hostings/ui/HostingOverviewPage";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }> | { slug: string };
}

async function getHosting(slug: string) {
  try {
    const hosting = await prisma.hosting.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        websiteUrl: true,
        startYear: true,
        clients: true,
        testPeriod: true,
        isActive: true,
        contentBlocks: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            key: true,
            title: true,
            content: true,
            type: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    // Если хостинг не найден или неактивен, возвращаем null
    if (!hosting || !hosting.isActive) {
      return null;
    }

    // Исключаем isActive из данных
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isActive, ...hostingData } = hosting;

    return hostingData;
  } catch (error) {
    console.error("Ошибка получения хостинга:", error);
    return null;
  }
}

async function getHostingRating(slug: string) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const response = await fetch(
      `${baseUrl}/api/public/hostings/${slug}/reviews?limit=1`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return {
        average: 0,
        count: 0,
        criteria: {
          performance: 0,
          support: 0,
          priceQuality: 0,
          reliability: 0,
          easeOfUse: 0,
        },
      };
    }

    const data = await response.json();
    return data.hostingRating || {
      average: 0,
      count: 0,
      criteria: {
        performance: 0,
        support: 0,
        priceQuality: 0,
        reliability: 0,
        easeOfUse: 0,
      },
    };
  } catch (error) {
    console.error("Ошибка получения рейтинга хостинга:", error);
    return {
      average: 0,
      count: 0,
      criteria: {
        performance: 0,
        support: 0,
        priceQuality: 0,
        reliability: 0,
        easeOfUse: 0,
      },
    };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;

  const hosting = await getHosting(slug);

  if (!hosting) {
    return {
      title: "Хостинг не найден",
      description: "Запрашиваемый хостинг не найден или неактивен",
    };
  }

  return {
    title: `${hosting.name} - Обзор хостинга`,
    description:
      hosting.description ||
      `Детальный обзор хостинга ${hosting.name}. Узнайте больше о тарифах, возможностях и особенностях хостинг-провайдера.`,
  };
}

export default async function HostingPage({ params }: Props) {
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;

  const [hosting, hostingRating] = await Promise.all([
    getHosting(slug),
    getHostingRating(slug),
  ]);

  if (!hosting) {
    notFound();
  }

  return (
    <HostingOverviewPage hosting={hosting} hostingRating={hostingRating} />
  );
}
