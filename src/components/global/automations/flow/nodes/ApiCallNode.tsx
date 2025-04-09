import { Globe } from "lucide-react";
import { BaseNode } from "./BaseNode";

export function ApiCallNode({ data }: { data: any }) {
  return <BaseNode data={data} type="apiCall" icon={<Globe className="w-4 h-4 text-red-500" />} color="border-red-500 bg-red-500/10" />;
}
