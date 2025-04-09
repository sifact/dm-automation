"use client";
import AutomationList from "@/components/global/automation-list";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { INTEGRATIONS } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { Bot } from "lucide-react";
import FlowList from "@/components/global/flow/flow-list";
import CreateFlow from "@/components/global/flow/create-flow";

const Page = () => {
  const searchParams = useSearchParams();
  const platform = (searchParams.get("platform") as INTEGRATIONS) || INTEGRATIONS.MESSENGER;

  return (
    <div className="flex flex-col gap-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-x-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Flow Builder</h1>
          <p className="text-sm text-muted-foreground">Create and manage your conversation flows</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-5">
        <div className="lg:col-span-4">
          <FlowList platform={platform} />
        </div>
        <div className="lg:col-span-2">
          <div className="flex flex-col rounded-xl bg-background-80 gap-y-6 p-5 border-[1px] border-in-active">
            <div>
              <h2 className="text-xl">Create New Flow</h2>
              <p className="text-text-secondary">Start building your conversation flow</p>
            </div>
            <CreateFlow platform={platform} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
