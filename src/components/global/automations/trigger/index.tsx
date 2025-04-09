"use client";
import { useQueryAutomation } from "@/hooks/user-queries";
import React from "react";
import ActiveTrigger from "./active";
import { Separator } from "@/components/ui/separator";
import ThenAction from "../then/then-action";
import TriggerButton from "../trigger-button";
import { useTriggers } from "@/hooks/use-automations";
import { cn } from "@/lib/utils";
import Keywords from "./keywords";
import { Button } from "@/components/ui/button";
import Loader from "../../loader";
import { INTEGRATIONS } from "@prisma/client";
import { TinyInstagram, TinyMessenger, TinyWhatsApp, TinyFacebook } from "@/icons";

type Props = {
  id: string;
  platform: INTEGRATIONS;
};

const defaultTriggers = {
  INSTAGRAM: [
    {
      id: "1",
      type: "DM",
      label: "Direct Message",
      description: "Trigger when someone sends you a direct message",
      icon: <TinyInstagram />,
    },
    {
      id: "2",
      type: "COMMENT",
      label: "Comment",
      description: "Trigger when someone comments on your post",
      icon: <TinyInstagram />,
    },
  ],
  MESSENGER: [
    {
      id: "1",
      type: "DM",
      label: "Message",
      description: "Trigger when someone sends you a message",
      icon: <TinyMessenger />,
    },
  ],
  WHATSAPP: [
    {
      id: "1",
      type: "DM",
      label: "Message",
      description: "Trigger when someone sends you a message",
      icon: <TinyWhatsApp />,
    },
  ],
  FACEBOOK: [
    {
      id: "1",
      type: "DM",
      label: "Message",
      description: "Trigger when someone sends you a message",
      icon: <TinyFacebook />,
    },
    {
      id: "2",
      type: "COMMENT",
      label: "Comment",
      description: "Trigger when someone comments on your post",
      icon: <TinyFacebook />,
    },
  ],
} as const;

const Trigger = ({ id, platform }: Props) => {
  const { types, onSetTrigger, onSaveTrigger, isPending } = useTriggers(id);
  const { data } = useQueryAutomation(id);
  console.log(data);

  // const validPlatform = Object.values(INTEGRATIONS).includes(platform) ? platform : INTEGRATIONS.INSTAGRAM;

  const currentTriggers = defaultTriggers[platform || "INSTAGRAM"] || defaultTriggers.INSTAGRAM;

  if (data && data?.triggers.length > 0) {
    return (
      <div className="flex flex-col ga-y-6 items-center">
        <ActiveTrigger type={data.triggers[0].type} keywords={data.keywords} platform={platform} />

        {data?.triggers.length > 1 && (
          <>
            <div className="relative w-6/12 my-4">
              <p className="absolute transform  px-2 -translate-y-1/2 top-1/2 -translate-x-1/2 left-1/2">or</p>
              <Separator orientation="horizontal" className="border-muted border-[1px]" />
            </div>
            <ActiveTrigger type={data.triggers[1].type} keywords={data.keywords} platform={platform} />
          </>
        )}

        {!data.listener && <ThenAction id={id} />}
      </div>
    );
  }

  return (
    <TriggerButton label="Add Trigger">
      <div className="flex flex-col gap-y-2">
        {currentTriggers.map((trigger) => (
          <div
            key={trigger.id}
            onClick={() => onSetTrigger(trigger.type)}
            className={cn(
              "hover:opacity-80 text-white rounded-xl flex cursor-pointer flex-col p-3 gap-y-2",
              !types?.find((t) => t === trigger.type) ? "bg-background-80" : "bg-gradient-to-br from-[#3352CC] font-medium to-[#1C2D70]"
            )}
          >
            <div className="flex gap-x-2 items-center">
              {trigger.icon}
              <p className="font-bold">{trigger.label}</p>
            </div>
            <p className="text-sm font-light">{trigger.description}</p>
          </div>
        ))}
        <Keywords id={id} />
        <Button onClick={onSaveTrigger} disabled={types?.length === 0} className="bg-gradient-to-br w-full from-[#3352CC] font-medium text-white to-[#1C2D70]">
          <Loader state={isPending}>Create Trigger</Loader>
        </Button>
      </div>
    </TriggerButton>
  );
};

export default Trigger;
