"use client";
import AutomationList from "@/components/global/automation-list";
import CreateAutomation from "@/components/global/create-automation";
import InfoBar from "@/components/global/infobar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { INTEGRATIONS } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const platform = (searchParams.get("platform") as INTEGRATIONS) || INTEGRATIONS.MESSENGER;

  const handleTabChange = (value: string) => {
    router.push(`?platform=${value}`);
  };

  return (
    <>
      {" "}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-5">
        <div className="lg:col-span-4 ">
          <Tabs defaultValue={platform} className="mb-8" onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-4 gap-4 bg-background-80">
              <TabsTrigger value={INTEGRATIONS.MESSENGER}>Messenger</TabsTrigger>
              <TabsTrigger value={INTEGRATIONS.FACEBOOK}>Facebook</TabsTrigger>

              <TabsTrigger value={INTEGRATIONS.WHATSAPP}>WhatsApp</TabsTrigger>

              <TabsTrigger value={INTEGRATIONS.INSTAGRAM}>Instagram</TabsTrigger>
            </TabsList>
            <TabsContent value={INTEGRATIONS.FACEBOOK}>
              <AutomationList platform={INTEGRATIONS.FACEBOOK} />
            </TabsContent>
            <TabsContent value={INTEGRATIONS.MESSENGER}>
              <AutomationList platform={INTEGRATIONS.MESSENGER} />
            </TabsContent>
            <TabsContent value={INTEGRATIONS.WHATSAPP}>
              <AutomationList platform={INTEGRATIONS.WHATSAPP} />
            </TabsContent>
            <TabsContent value={INTEGRATIONS.INSTAGRAM}>
              <AutomationList platform={INTEGRATIONS.INSTAGRAM} />
            </TabsContent>
          </Tabs>
        </div>
        {/* <div className="lg:col-span-2">
        <div className="flex flex-col rounded-xl bg-background-80 gap-y-6 p-5 border-[1px] overflow-hidden border-in-active">
          <div>
            <h2 className="text-xl ">Automations</h2>
            <p className="text-text-secondary">Your live automations will show here.</p>
          </div>
          <CreateAutomation platform={platform} />
        </div>
      </div> */}
      </div>
    </>
  );
};

export default Page;
