"use client";
import { useQuery } from "@tanstack/react-query";
import { INTEGRATIONS } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Play, Pause } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { usePaths } from "@/hooks/user-nav";

interface Props {
  platform: INTEGRATIONS;
}

const FlowList = ({ platform }: Props) => {
  const router = useRouter();
  const { pathname } = usePaths();

  const { data: flows, isLoading } = useQuery({
    queryKey: ["flows", platform],
    queryFn: async () => {
      const response = await fetch(`/api/flows?platform=${platform}`);
      if (!response.ok) throw new Error("Failed to fetch flows");
      return response.json();
    },
  });

  const handleEditFlow = (flowId: string) => {
    router.push(`${pathname}/${flowId}?platform=${platform}`);
  };

  const handleToggleActive = async (flowId: string, currentState: boolean) => {
    try {
      const response = await fetch(`/api/flows/${flowId}/toggle`, {
        method: "POST",
        body: JSON.stringify({ isActive: !currentState }),
      });

      if (!response.ok) throw new Error("Failed to toggle flow status");

      toast.success(`Flow ${currentState ? "deactivated" : "activated"} successfully`);
    } catch (error) {
      toast.error("Failed to update flow status");
    }
  };

  if (isLoading) {
    return <div>Loading flows...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {flows?.map((flow: any) => (
        <Card key={flow.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{flow.name}</h3>
              <p className="text-sm text-muted-foreground">Created {new Date(flow.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={flow.isActive} onCheckedChange={() => handleToggleActive(flow.id, flow.isActive)} />
              <Button variant="outline" size="sm" onClick={() => handleEditFlow(flow.id)}>
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default FlowList;
