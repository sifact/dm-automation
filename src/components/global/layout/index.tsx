"use client";

import { INTEGRATIONS } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import InfoBar from "../infobar";
import Sidebar from "../sidebar";

export const ClientLayout = ({ children, params }: { children: React.ReactNode; params: { slug: string } }) => {
  const searchParams = useSearchParams();
  const platform = searchParams.get("platform") || INTEGRATIONS.MESSENGER;

  return (
    <div className="p-3">
      <Sidebar slug={params.slug} />
      <div
        className="
          lg:ml-[250px] 
          lg:pl-10 
          lg:py-5 
          flex 
          flex-col 
          overflow-auto
        "
      >
        <InfoBar slug={params.slug} platform={platform} />
        {children}
      </div>
    </div>
  );
};
