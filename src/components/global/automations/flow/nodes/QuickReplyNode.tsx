import { User } from "lucide-react";
import { BaseNode } from "./BaseNode";

export function QuickReplyNode({ data }: { data: any }) {
  return <BaseNode data={data} type="quickReply" icon={<User className="w-4 h-4 text-purple-500" />} color="border-purple-500 bg-purple-500/10" />;
}
