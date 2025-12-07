import { HostingContentBlocks } from "@/views/manager/hostings/ui/HostingContentBlocks";

export default async function ManagerHostingContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <HostingContentBlocks hostingId={resolvedParams.id} />;
}

