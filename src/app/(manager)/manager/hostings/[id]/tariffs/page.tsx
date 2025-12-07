import { TariffsPage } from "@/views/manager/tariffs/ui/TariffsPage";

export default async function ManagerHostingTariffsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <TariffsPage hostingId={resolvedParams.id} />;
}

