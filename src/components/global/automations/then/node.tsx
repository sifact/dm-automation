"use client";
import { Separator } from "@/components/ui/separator";
import { useQueryAutomation } from "@/hooks/user-queries";
import { PlaneBlue, SmartAi, Warning } from "@/icons";
import { PencilIcon } from "lucide-react";
import React, { useState } from "react";
import PostButton from "../post";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutationData } from "@/hooks/use-mutation-data";
import { listenerUpdate, saveListener } from "@/actions/automations";
import { LISTENERS } from "@prisma/client";

type Props = {
  id: string;
};

const ThenNode = ({ id }: Props) => {
  const { data } = useQueryAutomation(id);
  const commentTrigger = data?.triggers.find((t) => t.type === "COMMENT");
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data?.listener?.prompt || "");

  const { mutate, isPending } = useMutationData(
    ["update-listener"],
    async (data: { prompt: string }) => {
      return await listenerUpdate(id, LISTENERS.SMARTAI, data.prompt);
    },
    "automation-info"
  );

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editValue.trim()) {
      mutate({ prompt: editValue });
      setIsEditing(false);
    }
  };

  return !data?.listener ? (
    <></>
  ) : (
    <div className="w-full lg:w-10/12 relative xl:w-6/12 p-5 rounded-xl flex flex-col bg-[#1D1D1D] gap-y-3">
      <div className="absolute h-20 left-1/2 bottom-full flex flex-col items-center z-50">
        <span className="h-[9px] w-[9px] bg-connector/10 rounded-full" />
        <Separator orientation="vertical" className="bottom-full flex-1 border-[1px] border-connector/10" />
        <span className="h-[9px] w-[9px] bg-connector/10 rounded-full" />
      </div>
      <div className="flex gap-x-2 items-center justify-between">
        <div className="flex gap-x-2">
          <Warning />
          Then...
        </div>
        <button onClick={() => setIsEditing(true)} className="hover:text-primary transition-colors">
          <PencilIcon size={14} />
        </button>
      </div>

      <div className="bg-background-80 p-3 rounded-xl flex flex-col gap-y-2">
        <div className="flex gap-x-2 items-center">
          {data.listener.listener === "MESSAGE" ? <PlaneBlue /> : <SmartAi />}
          <p className="text-lg">{data.listener.listener === "MESSAGE" ? "Send the user a message." : "Let Smart AI take over"}</p>
        </div>
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-y-2">
            <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-72  bg-background-100 outline-none border-none ring-0 focus:ring-0" />
            <div className="flex gap-x-2">
              <Button type="submit" disabled={isPending} className="bg-gradient-to-br from-[#3352CC] to-[#1C2D70] hover:opacity-80">
                Save Changes
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditValue(data?.listener?.prompt || "");
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <p className="font-light text-text-secondary">{data.listener.prompt}</p>
        )}
      </div>
      {data.posts.length > 0 ? <></> : commentTrigger ? <PostButton id={id} /> : <></>}
    </div>
  );
};

export default ThenNode;
