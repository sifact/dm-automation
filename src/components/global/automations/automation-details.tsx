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
      <div className="w-full flex items-center justify-between">
        <AutomationsBreadCrumb id={id} platform={platform} />
        <ActivateAutomationButton id={id} />
      </div>
      <div className="w-full flex flex-col items-center">
        <div className="w-full lg:w-10/12 xl:w-6/12 p-5 rounded-xl flex flex-col bg-[#1D1D1D] gap-y-3">
          <div className="flex gap-x-2 items-center">
            <Warning />
            <span className="text-lg">When...</span>
          </div>
          <Trigger id={id} platform={platform} />
        </div>
        <div className="w-full flex flex-col items-center gap-y-20 mt-20">
          <ThenNode id={id} />
          <PostNode id={id} />
        </div>
      </div>
    </div>
  );
};

export default AutomationDetails;
