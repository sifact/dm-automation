import { Bot } from "lucide-react";
import { BaseNode } from "./BaseNode";

export function ButtonNode({ data }: { data: any }) {
  return (
    <BaseNode
      data={data}
      type="button"
      icon={<Bot className="w-4 h-4 text-green-500" />}
      color="border-green-500 bg-green-500/10"
      className="p-2 w-[150px]" // Add classes for smaller size
    />
  );
}
