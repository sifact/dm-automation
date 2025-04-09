"use client";
import PostNode from "@/components/global/automations/post/node";
import ThenNode from "@/components/global/automations/then/node";
import Trigger from "@/components/global/automations/trigger";
import ActivateAutomationButton from "@/components/global/activate-automation-button";
import AutomationsBreadCrumb from "@/components/global/bread-crumbs/automations";
import { Warning } from "@/icons";
import { INTEGRATIONS } from "@prisma/client";
import React from "react";

type Props = {
  id: string;
  platform: INTEGRATIONS;
};

const AutomationDetails = ({ id, platform }: Props) => {
  return (
    <div className="flex flex-col gap-y-20">
      <div className="w-full flex items-center">
        <div className="flex-1">
          <AutomationsBreadCrumb id={id} platform={platform} />
        </div>
        <ActivateAutomationButton id={id} />
      </div>
      <div className="w-full lg:w-10/12 xl:w-6/12 p-5 rounded-xl flex flex-col bg-[#1D1D1D] gap-y-3">
        <div className="flex gap-x-2">
          <Warning />
          When...
        </div>
        <Trigger id={id} platform={platform} />
      </div>
      <ThenNode id={id} />
      <PostNode id={id} />
    </div>
  );
};

export default AutomationDetails;
