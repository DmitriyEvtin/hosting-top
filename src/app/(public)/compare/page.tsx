import { Metadata } from "next";
import { ComparePage } from "@/views/compare/ui/ComparePage";

export const metadata: Metadata = {
  title: "Сравнение тарифов",
  description:
    "Сравните выбранные тарифы хостингов по различным параметрам: цена, ресурсы, технологии, безопасность и многое другое.",
};

export default function CompareRoute() {
  return <ComparePage />;
}

