"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INTEGRATIONS } from "@prisma/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  platform: INTEGRATIONS;
}

const CreateFlow = ({ platform }: Props) => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    // if (!name.trim()) {
    //   toast.error("Please enter a flow name");
    //   return;
    // }

    setIsLoading(true);
    try {
      const response = await fetch("/api/flows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          platform,
        }),
      });

      if (!response.ok) throw new Error("Failed to create flow");

      const data = await response.json();
      toast.success("Flow created successfully");
      router.push(`/dashboard/flow/${data.id}?platform=${platform.toLowerCase()}`);
    } catch (error) {
      toast.error("Failed to create flow");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Input placeholder="Enter flow name" value={name} onChange={(e) => setName(e.target.value)} />
      <Button onClick={handleCreate} disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Flow"}
      </Button>
    </div>
  );
};

export default CreateFlow;
