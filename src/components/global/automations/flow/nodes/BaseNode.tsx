import { Handle, Position } from "reactflow";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils"; // Import cn utility

type BaseNodeProps = {
  data: {
    content?: string;
  };
  type: string;
  icon: React.ReactNode;
  color: string;
  className?: string; // Add optional className prop
};

export function BaseNode({ data, type, icon, color, className }: BaseNodeProps) {
  return (
    <Card className={cn("p-4 w-[200px] border-2", color, className)}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-medium">{data.content}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  );
}
