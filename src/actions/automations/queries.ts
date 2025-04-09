"use server";

import { client } from "@/lib/prisma";
import { INTEGRATIONS } from "@prisma/client";
import { v4 } from "uuid";

export const createAutomation = async (clerkId: string, platform: INTEGRATIONS, id?: string) => {
  if (!platform) {
    throw new Error("Platform is required");
  }

  return await client.user.update({
    where: {
      clerkId,
    },
    data: {
      automations: {
        create: {
          ...(id && { id }),
          platform,
          name: "Untitled",
          active: false,
        },
      },
    },
    include: {
      automations: {
        where: {
          ...(id && { id }),
          platform,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });
};

export const getAutomations = async (clerkId: string, platform: INTEGRATIONS) => {
  return await client.user.findUnique({
    where: {
      clerkId,
    },
    select: {
      automations: {
        where: {
          platform: platform,
        },
        orderBy: {
          createdAt: "asc",
        },
        include: {
          keywords: true,
          listener: true,
        },
      },
    },
  });
};

export const findAutomation = async (id: string | null) => {
  if (!id) {
    console.log("No automation id provided");
    return null;
  }
  return await client.automation.findUnique({
    where: {
      id: id,
    },
    include: {
      keywords: true,
      triggers: true,
      posts: true,
      listener: true,
      User: {
        select: {
          subscription: true,
          integrations: true,
        },
      },
    },
  });
};

export const updateAutomation = async (
  id: string,
  update: {
    name?: string;
    active?: boolean;
  }
) => {
  return await client.automation.update({
    where: { id },
    data: {
      name: update.name,
      active: update.active,
    },
  });
};

export const addListener = async (automationId: string, listener: "SMARTAI" | "MESSAGE", prompt: string, reply?: string) => {
  return await client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      listener: {
        create: {
          listener,
          prompt,
          commentReply: reply,
        },
      },
    },
  });
};

export const updateListener = async (automationId: string, listener: "SMARTAI" | "MESSAGE", prompt: string, reply?: string) => {
  return await client.listener.update({
    where: {
      automationId,
    },
    data: {
      listener,
      prompt,
      // commentReply: reply,
    },
  });
};

export const addTrigger = async (automationId: string, trigger: string[]) => {
  if (trigger.length === 2) {
    return await client.automation.update({
      where: { id: automationId },
      data: {
        triggers: {
          createMany: {
            data: [{ type: trigger[0] }, { type: trigger[1] }],
          },
        },
      },
    });
  }
  return await client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      triggers: {
        create: {
          type: trigger[0],
        },
      },
    },
  });
};

export const addKeyWord = async (automationId: string, keyword: string) => {
  try {
    return await client.automation.update({
      where: {
        id: automationId,
      },
      data: {
        keywords: {
          create: {
            word: keyword.toLowerCase(), // Add toLowerCase() for consistency
          },
        },
      },
      include: {
        // Add include to return the created keyword
        keywords: true,
      },
    });
  } catch (error) {
    console.error("Error adding keyword:", error);
    throw error;
  }
};

export const deleteKeywordQuery = async (id: string) => {
  return client.keyword.delete({
    where: { id },
  });
};

export const updateKeywordQuery = async (id: string, word: string) => {
  return client.keyword.update({
    where: { id },
    data: {
      word: word.toLowerCase(), // Maintain consistency with word casing
    },
  });
};

export const addPost = async (
  autmationId: string,
  posts: {
    postid: string;
    caption?: string;
    media: string;
    mediaType: "IMAGE" | "VIDEO" | "CAROSEL_ALBUM";
  }[]
) => {
  return await client.automation.update({
    where: {
      id: autmationId,
    },
    data: {
      posts: {
        createMany: {
          data: posts,
        },
      },
    },
  });
};
