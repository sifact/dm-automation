"use client";
import { usePaths } from "@/hooks/user-nav";
import { useQueryAutomation } from "@/hooks/user-queries";
import { useMutationData } from "@/hooks/use-mutation-data";
import { updateAutomationName } from "@/actions/automations";
import { INTEGRATIONS } from "@prisma/client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";

type Props = {
  id: string;
  platform: INTEGRATIONS;
};

const AutomationsBreadCrumb = ({ id, platform }: Props) => {
  const { data } = useQueryAutomation(id);
  const { pathname } = usePaths();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(data?.name);

  const { mutate } = useMutationData(["update-automation-name", id], (data: { name: string }) => updateAutomationName(id, data), "automation-info");

  useEffect(() => {
    if (data?.name) {
      setName(data.name);
    }
  }, [data?.name]);

  const basePath = pathname.split("/").slice(0, -1).join("/");
  const automationPlatform = data?.platform || platform;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && name !== data?.name) {
      mutate({ name });
    }
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-x-3">
      <Link href={`${basePath}?platform=${automationPlatform}`} className="text-text-secondary">
        Automations
      </Link>
      <span className="text-text-secondary">/</span>
      <span className="text-text-secondary capitalize">{automationPlatform}</span>
      <span className="text-text-secondary">/</span>
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSubmit}
            autoFocus
            className="h-6 text-base bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
          />
        </form>
      ) : (
        <div className="flex items-center gap-x-2">
          <p>{data?.name}</p>
          <button onClick={() => setIsEditing(true)} className="hover:opacity-70">
            <Pencil className="h-4 w-4 text-text-secondary" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AutomationsBreadCrumb;
