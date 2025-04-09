"use server";

import { client } from "@/lib/prisma";
import { NODE_TYPE } from "@prisma/client";
import type { JsonValue } from "@prisma/client/runtime/library";

type ButtonData = {
  text: string;
  payload?: string;
};

type NodeData = JsonValue & {
  title?: string;
  buttons?: ButtonData[];
};

export const generateFlowPreview = async (flowId: string) => {
  const flow = await client.flow.findUnique({
    where: { id: flowId },
    include: {
      nodes: {
        select: {
          id: true,
          type: true,
          data: true,
        },
      },
      edges: true,
    },
  });

  if (!flow) return null;

  return flow.nodes
    .filter((node) => {
      const data = node.data as NodeData | null;
      return node.type === NODE_TYPE.BUTTON || (data?.buttons && data.buttons.length > 0);
    })
    .map((node) => {
      const data = node.data as NodeData;
      return {
        id: node.id,
        title: data?.title || "Flow Interaction",
        buttons:
          data?.buttons?.map((btn) => ({
            text: btn.text,
            payload: btn.payload || `flow_${flowId}_node_${node.id}`,
          })) || [],
      };
    });
};
