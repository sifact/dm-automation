import { GitBranch } from "lucide-react";
import { BaseNode } from "./BaseNode";

export function ConditionNode({ data }: { data: any }) {
  return <BaseNode data={data} type="condition" icon={<GitBranch className="w-4 h-4 text-yellow-500" />} color="border-yellow-500 bg-yellow-500/10" />;
}
