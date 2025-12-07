import { HostingReviewsPage } from "@/views/public/reviews/ui/HostingReviewsPage";
import { notFound } from "next/navigation";
import { prisma } from "@/shared/api/database";

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

async function getHosting(slug: string) {
  try {
    const hosting = await prisma.hosting.findUnique({
      where: { slug, isActive: true },
      select: { id: true, name: true, slug: true },
    });

    return hosting;
  } catch (error) {
    console.error("Ошибка получения хостинга:", error);
    return null;
  }
}

async function getInitialReviewsData(slug: string) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const response = await fetch(
      `${baseUrl}/api/public/hostings/${slug}/reviews`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Ошибка получения отзывов:", error);
    return null;
  }
}

export default async function HostingReviews({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;

  // Получить данные хостинга и отзывов параллельно
  const [hosting, reviewsData] = await Promise.all([
    getHosting(slug),
    getInitialReviewsData(slug),
  ]);

  if (!hosting || !reviewsData) {
    notFound();
  }

  return (
    <HostingReviewsPage
      hostingSlug={slug}
      hostingName={hosting.name}
      initialData={reviewsData}
    />
  );
}

