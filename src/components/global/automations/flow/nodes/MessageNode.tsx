import { MessageSquare } from "lucide-react";
import { BaseNode } from "./BaseNode";

export function MessageNode({ data }: { data: any }) {
  return <BaseNode data={data} type="message" icon={<MessageSquare className="w-4 h-4 text-blue-500" />} color="border-blue-500 bg-blue-500/10" />;
}
