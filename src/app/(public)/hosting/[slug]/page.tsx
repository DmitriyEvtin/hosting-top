import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/shared/api/database";
import { HostingOverviewPage } from "@/views/public/hostings/ui/HostingOverviewPage";

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
    const { isActive, ...hostingData } = hosting;

    return hostingData;
  } catch (error) {
    console.error("Ошибка получения хостинга:", error);
    return null;
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

  const hosting = await getHosting(slug);

  if (!hosting) {
    notFound();
  }

  return <HostingOverviewPage hosting={hosting} />;
}

