import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import InfoBar from "@/components/global/infobar";
import Sidebar from "@/components/global/sidebar";
import React from "react";
import { PrefetchUserAutomations, PrefetchUserProfile } from "@/react-query/prefetch";
import { INTEGRATIONS } from "@prisma/client";
import { ClientLayout } from "@/components/global/layout";

type Props = {
  children: React.ReactNode;
  params: { slug: string };
  searchParams: { platform: string };
};

const Layout = async ({ children, params, searchParams }: Props) => {
  const query = new QueryClient();
  const platform = searchParams?.platform || INTEGRATIONS.MESSENGER;

  await PrefetchUserProfile(query);

  await PrefetchUserAutomations(query, platform as any);

  return (
    <HydrationBoundary state={dehydrate(query)}>
      <ClientLayout params={params}>{children}</ClientLayout>
    </HydrationBoundary>
  );
};

export default Layout;
