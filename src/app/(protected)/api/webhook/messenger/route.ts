import { sendMessengerMessage, sendMessengerMessageWithQuickReplies } from "@/lib/fetch";
import { client } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

enum NODE_TYPE {
  MESSAGE = "MESSAGE",
  BUTTON = "BUTTON",
  END = "END",
}

export async function GET(req: NextRequest) {
  console.log("Messenger Flow Webhook GET request received");
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.MESSENGER_VERIFY_TOKEN) {
    console.log("Messenger flow webhook verified successfully");
    return new NextResponse(challenge);
  }

  console.log("Messenger flow webhook verification failed");
  return new NextResponse("Verification failed", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const webhook_payload = await req.json();
    const messaging = webhook_payload.entry[0].messaging[0];
    const platformUserId = messaging.sender.id;
    const pageId = messaging.recipient.id;

    if (platformUserId === pageId) {
      return NextResponse.json({ message: "Ignoring self-sent message" }, { status: 200 });
    }

    // Handle "Get Started" event
    if (messaging.postback && messaging.postback.payload === "GET_STARTED") {
      const previewResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/flows/welcome/preview`);
      const previewData = await previewResponse.json();

      if (previewData?.length > 0) {
        const firstNode = previewData[0];
        if (!process.env.MESSENGER_PAGE_TOKEN) {
          throw new Error("Messenger page token not configured");
        }

        const response = await sendMessengerMessageWithQuickReplies(
          platformUserId,
          {
            text: firstNode.title,
            quick_replies: firstNode.buttons.map((btn: { text: string; payload: string }) => ({
              content_type: "text",
              title: btn?.text,
              payload: `FLOW_PREVIEW:${btn.payload}`,
            })),
          },
          process.env.MESSENGER_PAGE_TOKEN
        );
        return NextResponse.json({ message: "Welcome message sent" }, { status: 200 });
      }
    }

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

    if (!activeFlow?.User.integrations?.[0]?.token) {
      console.log("No active flow available");
      return NextResponse.json({ message: "No active flow available" }, { status: 200 });
    }

    // Find the button node that matches user's message
    const currentButtonNode = activeFlow.nodes.find((node) => node.type === "BUTTON" && node.content.toLowerCase() === messaging.message?.text.toLowerCase());

    if (currentButtonNode) {
      // Find the next message node connected to this button
      const nextMessageNode = activeFlow.nodes.find(
        (node) => node.type === "MESSAGE" && activeFlow.edges.some((edge) => edge.fromNodeId === currentButtonNode.id && edge.toNodeId === node.id)
      );

      if (nextMessageNode) {
        // Find any buttons connected to the next message node
        const nextButtonNodes = activeFlow.nodes.filter(
          (node) => node.type === "BUTTON" && activeFlow.edges.some((edge) => edge.fromNodeId === nextMessageNode.id && edge.toNodeId === node.id)
        );

        // If there are buttons, send message with quick replies
        if (nextButtonNodes.length > 0) {
          const response = await sendMessengerMessageWithQuickReplies(
            platformUserId,
            {
              text: nextMessageNode.content,
              quick_replies: nextButtonNodes.map((node) => ({
                content_type: "text",
                title: node.content,
                payload: node.content,
              })),
            },
            activeFlow.User.integrations[0].token
          );

          if (response.status !== 200) {
            return NextResponse.json({ error: "Failed to send flow message" }, { status: 200 });
          }
        } else {
          // If no buttons, just send the message
          const response = await sendMessengerMessage(platformUserId, nextMessageNode.content, activeFlow.User.integrations[0].token);

          if (response.status !== 200) {
            return NextResponse.json({ error: "Failed to send flow message" }, { status: 200 });
          }
        }

        return NextResponse.json({ message: "Flow message sent" }, { status: 200 });
      }
    }

    // If no button match found or it's the first message, send initial message with options
    // const initialMessageNode = activeFlow.nodes.find((node) => node.type === "MESSAGE");
    // if (initialMessageNode) {
    //   const buttonNodes = activeFlow.nodes.filter(
    //     (node) => node.type === "BUTTON" && activeFlow.edges.some((edge) => edge.fromNodeId === initialMessageNode.id && edge.toNodeId === node.id)
    //   );

    //   const response = await sendMessengerMessageWithQuickReplies(
    //     platformUserId,
    //     {
    //       text: initialMessageNode.content,
    //       quick_replies: buttonNodes.map((node) => ({
    //         content_type: "text",
    //         title: node.content,
    //         payload: node.content,
    //       })),
    //     },
    //     activeFlow.User.integrations[0].token
    //   );

    //   if (response.status !== 200) {
    //     return NextResponse.json({ error: "Failed to send flow message" }, { status: 200 });
    //   }
    // }

    return NextResponse.json({ message: "Flow processed" }, { status: 200 });
  } catch (error) {
    console.error("Error processing Messenger flow webhook:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 200 });
  }
}
