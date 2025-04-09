import { getAutomationInfo } from "@/actions/automations";
import { Warning } from "@/icons";
import { PrefetchUserAutomation } from "@/react-query/prefetch";
import { INTEGRATIONS } from "@prisma/client";
import { Suspense } from "react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import AutomationDetails from "@/components/global/automations/automation-details";

type Props = {
  params: { id: string };
  searchParams: { platform?: string };
};

export async function generateMetadata({ params }: { params: { id: string } }) {
  const info = await getAutomationInfo(params.id);
  return {
    title: info.data?.name,
  };
}

const Page = async ({ params, searchParams }: Props) => {
  const query = new QueryClient();
  await PrefetchUserAutomation(query, params.id);
  const platform = (searchParams.platform as INTEGRATIONS) || (INTEGRATIONS.INSTAGRAM as INTEGRATIONS);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HydrationBoundary state={dehydrate(query)}>
        <AutomationDetails id={params.id} platform={platform} />
      </HydrationBoundary>
    </Suspense>
  );
};

export default Page;
