import { checkMessengerWebhookStatus, MESSENGER_API_VERSION } from "@/lib/fetch";
import { client } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// export async function GET(req: NextRequest) {
//   try {
//     const token = process.env.MESSENGER_ACCESS_TOKEN;

//     if (!token) {
//       return NextResponse.json({ error: "Messenger access token not found" }, { status: 400 });
//     }

//     const result = await checkMessengerWebhookStatus(token);

//     return NextResponse.json(result);
//   } catch (error: any) {
//     console.error("Error testing Messenger webhook:", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN; // Store this securely

export async function GET(req: NextRequest) {
  const activeFlow = await client.flow.findFirst({
    where: {
      isActive: true,
      platform: "MESSENGER",
    },
    include: {
      nodes: true,
      edges: true,
      User: {
        select: {
          integrations: {
            select: { token: true },
          },
        },
      },
    },
  });

  // if (!activeFlow?.User.integrations?.[0]?.token) {
  //   console.log("No active flow available");
  //   return NextResponse.json({ message: "No active flow available" }, { status: 200 });
  // }

  const access_token = activeFlow?.User.integrations?.[0]?.token;
  console.log(access_token);
  const response = await fetch(`https://graph.facebook.com/${MESSENGER_API_VERSION}/me/messenger_profile?access_token=${access_token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ice_breakers: [
        {
          question: "👋 How does this work?",
          payload: "HOW_DOES_THIS_WORK",
        },
        {
          question: "🛒 What services do you offer?",
          payload: "VIEW_SERVICES",
        },
        {
          question: "📞 Contact support",
          payload: "CONTACT_SUPPORT",
        },
      ],
    }),
  });

  const data = await response.json();
  return NextResponse.json(data);
}
