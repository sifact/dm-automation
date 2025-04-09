import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useListener } from "@/hooks/use-automations";
import { MessageSquare, Sparkles } from "lucide-react";
import React from "react";
import TriggerButton from "../trigger-button";
import { cn } from "@/lib/utils";
import { useQueryUser } from "@/hooks/user-queries";

type Props = {
  id: string;
};

const ThenAction = ({ id }: Props) => {
  const { onSetListener, listener, onFormSubmit, register, isPending, currentMessage } = useListener(id);
  const { data } = useQueryUser();
  const isPro = data?.data?.subscription?.plan === "PRO";

  return (
    <TriggerButton label="Then">
      <div className="flex flex-col gap-y-3">
        <div className="flex flex-col gap-y-3">
          <p className="text-sm text-text-secondary">Choose how you want to respond</p>
          <div className="grid grid-cols-2 gap-x-3">
            <button
              onClick={() => onSetListener("MESSAGE")}
              className={cn(
                "hover:opacity-80 text-white rounded-xl flex cursor-pointer flex-col p-3 gap-y-2",
                listener !== "MESSAGE" ? "bg-background-80" : "bg-gradient-to-br from-[#3352CC] font-medium to-[#1C2D70]"
              )}
            >
              <MessageSquare />
              <p>Message</p>
              <p className="text-xs text-text-secondary">Send a message to your customers</p>
            </button>
            <button
              onClick={() => (isPro ? onSetListener("SMARTAI") : null)}
              className={cn(
                "text-white rounded-xl flex cursor-pointer flex-col p-3 gap-y-2",
                !isPro ? "opacity-50 cursor-not-allowed" : "hover:opacity-80",
                listener !== "SMARTAI" ? "bg-background-80" : "bg-gradient-to-br from-[#3352CC] font-medium to-[#1C2D70]"
              )}
            >
              <Sparkles />
              <p>Smart AI</p>
              <p className="text-xs text-text-secondary">{isPro ? "Let AI handle your responses" : "Upgrade to PRO to use Smart AI"}</p>
            </button>
          </div>
        </div>

        {currentMessage ? (
          <div className="bg-background-80 p-3 rounded-xl">
            <p>{currentMessage}</p>
          </div>
        ) : (
          <form onSubmit={onFormSubmit} className="flex flex-col gap-y-2">
            <Textarea
              placeholder={listener === "SMARTAI" ? "Add a prompt that your smart ai can use [for message prompt]..." : "Add a message you want to send to your customers"}
              {...register("prompt")}
              className="bg-background-80 outline-none border-none ring-0 focus:ring-0"
            />
            <Textarea
              placeholder={listener === "SMARTAI" ? "Add a prompt that your smart ai can use [for reply prompt]..." : "Add a reply to customer comment"}
              {...register("reply")}
              className="bg-background-80 outline-none border-none ring-0 focus:ring-0"
            />
            <Button type="submit" disabled={isPending} className="bg-gradient-to-br from-[#3352CC] to-[#1C2D70] hover:opacity-80">
              Add listener
            </Button>
          </form>
        )}
      </div>
    </TriggerButton>
  );
};

export default ThenAction;
