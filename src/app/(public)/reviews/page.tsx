import { AllReviewsPage } from "@/views/public/reviews/ui/AllReviewsPage";
import { Metadata } from "next";

async function getInitialReviewsData() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/public/reviews`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        reviews: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };
    }

    return await response.json();
  } catch (error) {
    console.error("Ошибка получения отзывов:", error);
    return {
      reviews: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };
  }
}

export const metadata: Metadata = {
  title: "Все отзывы - Hosting Top",
  description: "Отзывы пользователей о хостинг-провайдерах",
};

export default async function AllReviews() {
  const initialData = await getInitialReviewsData();

  return <AllReviewsPage initialData={initialData} />;
}

