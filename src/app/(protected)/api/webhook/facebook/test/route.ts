import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  try {
    const pageId = "me"; // Replace with your page ID
    const pageAccessToken = process.env.MESSENGER_ACCESS_TOKEN;

    // Subscribe the page to the app
    const subscribeResponse = await axios.post(`https://graph.facebook.com/v17.0/${pageId}/subscribed_apps`, {
      subscribed_fields: ["feed", "messages", "messaging_postbacks"],
      access_token: pageAccessToken,
    });

    // Verify permissions
    const permissionsResponse = await axios.get(`https://graph.facebook.com/v17.0/${pageId}/permissions`, {
      params: {
        access_token: pageAccessToken,
      },
    });

    return NextResponse.json({
      subscribeResponse: subscribeResponse.data,
      permissions: permissionsResponse.data,
    });
  } catch (error: any) {
    console.error("Error:", error.response?.data || error);
    return NextResponse.json({ error: error.response?.data || error.message }, { status: 500 });
  }
}
