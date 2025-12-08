import { Metadata } from "next";
import { SharedComparePage } from "@/views/compare/ui/SharedComparePage";

interface Props {
  params: Promise<{ shareId: string }> | { shareId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await Promise.resolve(params);

  return {
    title: "Сравнение тарифов",
    description: "Публичное сравнение тарифов хостингов",
  };
}

export default async function SharedComparePageRoute({ params }: Props) {
  const resolvedParams = await Promise.resolve(params);
  const { shareId } = resolvedParams;

  return <SharedComparePage shareId={shareId} />;
}

