import axios from "axios";

export const refreshToken = async (token: string) => {
  const refresh_token = await axios.get(`${process.env.INSTAGRAM_BASE_URL}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`);

  return refresh_token.data;
};

export const sendDM = async (userId: string, recieverId: string, prompt: string, token: string) => {
  try {
    console.log("sending message");
    return await axios.post(
      `${process.env.INSTAGRAM_BASE_URL}/v22.0/${userId}/messages`,
      {
        recipient: {
          id: recieverId,
        },
        message: {
          text: prompt,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.log("error sending message", error);
    return { status: 200, data: error?.response?.data || error?.message };
  }
};

export const sendPrivateMessage = async (userId: string, recieverId: string, prompt: string, token: string) => {
  try {
    console.log("sending message");
    return await axios.post(
      `${process.env.INSTAGRAM_BASE_URL}/v22.0/${userId}/messages`,
      {
        recipient: {
          comment_id: recieverId,
        },
        message: {
          text: prompt,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.log("error sending message", error);
    return { status: 200, data: error?.response?.data || error?.message };
  }
};

export const generateTokens = async (code: string) => {
  const insta_form = new FormData();
  insta_form.append("client_id", process.env.INSTAGRAM_CLIENT_ID as string);

  insta_form.append("client_secret", process.env.INSTAGRAM_CLIENT_SECRET as string);
  insta_form.append("grant_type", "authorization_code");
  insta_form.append("redirect_uri", `${process.env.NEXT_PUBLIC_HOST_URL}/callback/instagram`);
  insta_form.append("code", code);

  const shortTokenRes = await fetch(process.env.INSTAGRAM_TOKEN_URL as string, {
    method: "POST",
    body: insta_form,
  });

  const token = await shortTokenRes.json();
  if (token.permissions.length > 0) {
    console.log(token, "got permissions");
    const long_token = await axios.get(
      `${process.env.INSTAGRAM_BASE_URL}/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${token.access_token}`
    );

    return long_token.data;
  }
};

// Facebook Messenger API functions
export const MESSENGER_API_VERSION = "v11.0";
export const sendMessengerMessage = async (recipientId: string, message: string, pageToken: string) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/${MESSENGER_API_VERSION}/me/messages`,
      {
        recipient: {
          id: recipientId,
        },
        message: {
          text: message,
        },
      },
      {
        params: {
          access_token: pageToken,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error("Error sending Messenger message:", error.response?.data || error.message);
    return {
      status: error.response?.status || 200,
      data: error.response?.data || error.message,
    };
  }
};

export const sendMessengerMessageWithQuickReplies = async (
  recipientId: string,
  messagePayload: {
    text: string;
    quick_replies?: Array<{
      content_type: string;
      title: string;
      payload: string;
    }>;
  },
  pageToken: string
) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/${MESSENGER_API_VERSION}/me/messages`,
      {
        recipient: {
          id: recipientId,
        },
        message: messagePayload,
      },
      {
        params: {
          access_token: pageToken,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Response from Messenger API:", response.data);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error("Error sending Messenger message with quick replies:", error.response?.data || error.message);
    return {
      status: error.response?.status || 200,
      data: error.response?.data || error.message,
    };
  }
};

export const WHATSAPP_API_VERSION = "v22.0";
const phone_id = process.env.WHATSAPP_PHONE_ID;
export async function sendWhatsAppMessage(to: string, message: string, token: string) {
  const response = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phone_id}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: { body: message },
    }),
  });

  return response;
}

export const FACEBOOK_API_VERSION = "v22.0";

// export async function sendFacebookComment(commentId: string, message: string, token: string) {
//   try {
//     const response = await fetch(`https://graph.facebook.com/${FACEBOOK_API_VERSION}/${commentId}/comments`, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         message: message,
//       }),
//     });

//     return response;
//   } catch (error) {
//     console.log(error);
//   }
// }

export async function sendFacebookComment(commentId: string, message: string, token: string) {
  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${commentId}/comments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        message: message,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending Facebook comment:", error);
    // throw error;
  }
}

export async function sendFacebookDM(pageId: string, userId: string, message: string, token: string) {
  const response = await fetch(`https://graph.facebook.com/${FACEBOOK_API_VERSION}/${pageId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: { id: userId },
      message: { text: message },
      messaging_type: "RESPONSE",
    }),
  });

  return response;
}

export async function getFacebookPagePosts(pageId: string, token: string, limit: number = 10) {
  try {
    const response = await axios.get(`https://graph.facebook.com/${FACEBOOK_API_VERSION}/${pageId}/posts`, {
      params: {
        fields: "id,message,full_picture,permalink_url,created_time,attachments{media_type,url}",
        limit: limit,
        access_token: token,
      },
    });

    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error("Error fetching Facebook page posts:", error.response?.data || error.message);
    return {
      status: error.response?.status || 200,
      data: error.response?.data || error.message,
    };
  }
}

/**
 * Check the status of Facebook webhook subscriptions
 * This is useful for debugging why webhooks aren't triggering
 */
export async function checkFacebookWebhookSubscriptions(token: string) {
  try {
    // Get app subscriptions
    const appResponse = await axios.get(`https://graph.facebook.com/${FACEBOOK_API_VERSION}/app/subscriptions`, {
      params: {
        access_token: token,
      },
    });

    // Get page subscriptions
    let pageSubscriptions = null;
    try {
      const pageResponse = await axios.get(`https://graph.facebook.com/${FACEBOOK_API_VERSION}/me/subscribed_apps`, {
        params: {
          access_token: token,
        },
      });
      pageSubscriptions = pageResponse.data;
    } catch (error: any) {
      console.error("Error fetching page subscriptions:", error.response?.data || error.message);
    }

    return {
      status: appResponse.status,
      data: {
        appSubscriptions: appResponse.data,
        pageSubscriptions,
      },
    };
  } catch (error: any) {
    console.error("Error checking webhook subscriptions:", error.response?.data || error.message);
    return {
      status: error.response?.status || 200,
      data: error.response?.data || error.message,
    };
  }
}

export async function checkMessengerWebhookStatus(token: string) {
  try {
    const appId = process.env.MESSENGER_APP_ID;
    const appSecret = process.env.MESSENGER_APP_SECRET;

    if (!appId || !appSecret) {
      throw new Error("Missing MESSENGER_APP_ID or MESSENGER_APP_SECRET");
    }

    // Check app subscriptions
    const appResponse = await axios.get(`https://graph.facebook.com/${MESSENGER_API_VERSION}/app/subscriptions`, {
      params: {
        access_token: `${appId}|${appSecret}`, // Using app token format
      },
    });

    // Check page subscriptions using page access token
    const pageResponse = await axios.get(`https://graph.facebook.com/${MESSENGER_API_VERSION}/me/subscribed_apps`, {
      params: {
        access_token: token, // Using the provided page access token
      },
    });

    return {
      status: 200,
      appSubscriptions: appResponse.data,
      pageSubscriptions: pageResponse.data,
    };
  } catch (error: any) {
    console.error("Error checking Messenger webhook status:", error.response?.data || error.message);
    return {
      status: error.response?.status || 200,
      error: error.response?.data || error.message,
    };
  }
}

export async function subscribePageToApp(pageId: string, pageAccessToken: string) {
  try {
    const response = await axios.post(`https://graph.facebook.com/v17.0/${pageId}/subscribed_apps`, {
      subscribed_fields: ["feed", "messages", "messaging_postbacks"],
      access_token: pageAccessToken,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error subscribing page to app:", error.response?.data || error);
    throw error;
  }
}
