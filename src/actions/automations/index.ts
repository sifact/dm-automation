"use server";

import axios from "axios";
import { onCurrentUser } from "../user";
import { findUser } from "../user/queries";
import { addKeyWord, addListener, addPost, addTrigger, createAutomation, deleteKeywordQuery, findAutomation, getAutomations, updateAutomation, updateListener } from "./queries";
import { FACEBOOK_API_VERSION } from "@/lib/fetch";
import { INTEGRATIONS } from "@prisma/client";
import { client } from "@/lib/prisma";

export const createAutomations = async (platform: INTEGRATIONS, id?: string) => {
  if (!platform) {
    return { status: 400, data: "Platform is required" };
  }

  const user = await onCurrentUser();
  try {
    const create = await createAutomation(user.id, platform, id);
    if (create) {
      return {
        status: 200,
        data: "Automation created",
        res: {
          ...create,
          platform, // Ensure platform is included in response
        },
      };
    }
  } catch (error) {
    console.error("Error creating automation:", error);
    return { status: 500, data: "Internal server error" };
  }
};

export const getAllAutomations = async (platform: INTEGRATIONS) => {
  const user = await onCurrentUser();
  try {
    const automations = await getAutomations(user.id, platform);
    if (automations) return { status: 200, data: automations.automations };
    return { status: 404, data: [] };
  } catch (error) {
    return { status: 500, data: [] };
  }
};

export const getAutomationInfo = async (id: string) => {
  await onCurrentUser();
  try {
    const automation = await findAutomation(id);
    if (automation) return { status: 200, data: automation };

    return { status: 404 };
  } catch (error) {
    return { status: 500 };
  }
};

export const updateAutomationName = async (
  automationId: string,
  data: {
    name?: string;
    active?: boolean;
    automation?: string;
  }
) => {
  await onCurrentUser();
  try {
    const update = await updateAutomation(automationId, data);
    if (update) {
      return { status: 200, data: "Automation successfully updated" };
    }
    return { status: 404, data: "Oops! could not find automation" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const saveListener = async (autmationId: string, listener: "SMARTAI" | "MESSAGE", prompt: string, reply?: string) => {
  await onCurrentUser();
  try {
    const create = await addListener(autmationId, listener, prompt, reply);
    if (create) return { status: 200, data: "Listener created" };
    return { status: 404, data: "Cant save listener" };
  } catch (error) {
    console.log(error);
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const listenerUpdate: any = async (autmationId: string, listener: "SMARTAI" | "MESSAGE", prompt: string, reply?: string) => {
  await onCurrentUser();
  try {
    const create = await updateListener(autmationId, listener, prompt, reply);
    if (create) return { status: 200, data: "Listener created" };
    return { status: 404, data: "Cant save listener" };
  } catch (error) {
    console.log(error);
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const saveTrigger = async (automationId: string, trigger: string[]) => {
  await onCurrentUser();
  try {
    const create = await addTrigger(automationId, trigger);
    if (create) return { status: 200, data: "Trigger saved" };
    return { status: 404, data: "Cannot save trigger" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const saveKeyword = async (automationId: string, keyword: string) => {
  await onCurrentUser();
  try {
    const create = await addKeyWord(automationId, keyword);

    if (create) return { status: 200, data: "Keyword added successfully" };

    return { status: 404, data: "Cannot add this keyword" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const deleteKeyword = async (id: string) => {
  await onCurrentUser();
  try {
    const deleted = await deleteKeywordQuery(id);
    if (deleted)
      return {
        status: 200,
        data: "Keyword deleted",
      };
    return { status: 404, data: "Keyword not found" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const getProfilePosts = async () => {
  const user = await onCurrentUser();
  try {
    const profile = await findUser(user.id);
    const posts = await fetch(
      `${process.env.INSTAGRAM_BASE_URL}/me/media?fields=id,caption,media_url,media_type,timestamp&limit=10&access_token=${profile?.integrations[0].token}`
    );
    `${process.env.INSTAGRAM_BASE_URL}/me/media?fields=id,caption,media_url,media_type,timestamp&limit=10&access_token=${profile?.integrations[0].token}`;
    const parsed = await posts.json();
    if (parsed) return { status: 200, data: parsed };
    console.log("🔴 Error in getting posts");
    return { status: 404 };
  } catch (error) {
    console.log("🔴 server side Error in getting posts ", error);
    return { status: 500 };
  }
};

export const savePosts = async (
  autmationId: string,
  posts: {
    postid: string;
    caption?: string;
    media: string;
    mediaType: "IMAGE" | "VIDEO" | "CAROSEL_ALBUM";
  }[]
) => {
  await onCurrentUser();
  try {
    const create = await addPost(autmationId, posts);

    if (create) return { status: 200, data: "Posts attached" };

    return { status: 404, data: "Automation not found" };
  } catch (error) {
    console.log(error, "error");
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const activateAutomation = async (id: string, state: boolean) => {
  await onCurrentUser();
  try {
    const update = await updateAutomation(id, { active: state });
    if (update)
      return {
        status: 200,
        data: `Automation ${state ? "activated" : "disabled"}`,
      };
    return { status: 404, data: "Automation not found" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};
export async function getFacebookPagePosts(pageId = "me", limit: number = 10) {
  try {
    const user = await onCurrentUser();
    const profile = await findUser(user.id);

    if (!profile?.integrations?.[0]?.token) {
      console.error("No Facebook integration token found");
      return { status: 401, data: { error: "No Facebook integration found" } };
    }

    const response = await axios.get(`https://graph.facebook.com/${FACEBOOK_API_VERSION}/${pageId}/posts`, {
      params: {
        fields: "id,message,full_picture,permalink_url,created_time,attachments{media_type,url}",
        limit: limit,
        access_token: profile.integrations[0].token,
      },
    });
    console.log(response, "response");
    if (!response.data?.data) {
      console.log("No posts found in response:", response.data);
      return { status: 200, data: { data: [] } };
    }

    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error("Error fetching Facebook page posts:", error.response?.data || error.message);
    return {
      status: error.response?.status || 500,
      data: { error: error.response?.data || error.message },
    };
  }
}

export const getAutomation = async (id: string) => {
  try {
    const automation = await findAutomation(id);
    if (automation) {
      return { status: 200, data: automation };
    }
    return { status: 404, data: null };
  } catch (error) {
    console.error("Error fetching automation:", error);
    return { status: 500, data: null };
  }
};

export const updateKeywordQuery = async (id: string, word: string) => {
  try {
    const response = await client.keyword.update({
      where: { id },
      data: { word },
    });
    return { status: 200, data: response };
  } catch (error) {
    console.error("Error updating keyword:", error);
    return { status: 500, data: null };
  }
};
