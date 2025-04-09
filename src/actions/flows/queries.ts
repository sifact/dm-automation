import { client } from "@/lib/prisma";

export const findFlow = async (flowId: string) => {
  return await client.flow.findUnique({
    where: { id: flowId },
    include: {
      User: {
        select: {
          // subscription: {
          //   select: {
          //     plan: true,
          //   },
          // },
          integrations: {
            select: {
              token: true,
            },
          },
        },
      },
      nodes: true,
      edges: true,
      conversations: true,
    },
  });
};
