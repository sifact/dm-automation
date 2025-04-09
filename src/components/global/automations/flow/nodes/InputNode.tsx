import { Keyboard } from "lucide-react";
import { BaseNode } from "./BaseNode";

export function InputNode({ data }: { data: any }) {
  return <BaseNode data={data} type="input" icon={<Keyboard className="w-4 h-4 text-orange-500" />} color="border-orange-500 bg-orange-500/10" />;
}
