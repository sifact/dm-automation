"use server";

import { client } from "@/lib/prisma";
import { INTEGRATIONS } from "@prisma/client";

export const updateIntegration = async (token: string, expire: Date, id: string) => {
  return await client.integrations.update({
    where: { id },
    data: {
      token,
      expiresAt: expire,
    },
  });
};

export const getIntegration = async (clerkId: string) => {
  return await client.user.findUnique({
    where: {
      clerkId,
    },
    select: {
      integrations: {
        where: {
          name: "INSTAGRAM",
        },
      },
    },
  });
};

export const createIntegration = async (strategy: INTEGRATIONS, clerkId: string, token: string) => {
  return await client.user.update({
    where: {
      clerkId,
    },
    data: {
      integrations: {
        create: {
          name: strategy,
          token: token,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        },
      },
    },
    include: {
      integrations: true,
    },
  });
};
