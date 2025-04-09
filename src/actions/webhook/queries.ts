import { client } from "@/lib/prisma";

export const matchAIKeyword = async (keyword: string) => {
  return await client.keyword.findFirst({
    where: {
      word: {
        equals: `AI`,
        // mode: "insensitive",  // for mysql what is the solution
      },
    },
  });
};

export const matchKeyword = async (keyword: string) => {
  return await client.keyword.findFirst({
    where: {
      word: {
        equals: keyword,
        // mode: "insensitive",  // for mysql what is the solution
      },
    },
  });
};

// Find keywords that are contained within the provided text
export const findKeywordsInText = async (text: string) => {
  // Get all keywords from the database
  const allKeywords = await client.keyword.findMany({
    include: {
      Automation: true,
    },
  });

  // Convert text to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();

  // Filter keywords that are contained in the text
  const matchedKeywords = allKeywords.filter((keyword) => lowerText.includes(keyword.word.toLowerCase()));

  return matchedKeywords;
};

export const getKeywordAutomation = async (automationId: string, dm: boolean) => {
  return await client.automation.findUnique({
    where: {
      id: automationId,
    },

    include: {
      dms: dm,
      triggers: {
        where: {
          type: dm ? "DM" : "COMMENT",
        },
      },
      listener: true,
      User: {
        select: {
          subscription: {
            select: {
              plan: true,
            },
          },
          integrations: {
            select: {
              token: true,
            },
          },
        },
      },
    },
  });
};
export const trackResponses = async (automationId: string, type: "COMMENT" | "DM") => {
  if (type === "COMMENT") {
    return await client.listener.update({
      where: { automationId },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    });
  }

  if (type === "DM") {
    return await client.listener.update({
      where: { automationId },
      data: {
        dmCount: {
          increment: 1,
        },
      },
    });
  }
};

export const createChatHistory = (automationId: string, sender: string, reciever: string, message: string) => {
  return client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      dms: {
        create: {
          reciever,
          senderId: sender,
          message,
        },
      },
    },
  });
};

export const getKeywordPost = async (postId: string, automationId: string) => {
  return await client.post.findFirst({
    where: {
      AND: [{ postid: postId }, { automationId }],
    },
    select: { automationId: true },
  });
};

export const getChatHistory = async (sender: string, reciever: string) => {
  try {
    const history = await client.dms.findMany({
      where: {
        AND: [{ senderId: sender }, { reciever }],
      },
      orderBy: { createdAt: "asc" },
    });
    const chatSession: {
      role: "assistant" | "user";
      content: string;
    }[] = history.map((chat) => {
      return {
        role: chat.reciever ? "assistant" : "user",
        content: chat.message!,
      };
    });

    return {
      history: chatSession,
      automationId: history[history.length - 1]?.automationId,
    };
  } catch (error) {
    console.log(error, "error get history...");
  }
};
