import { sendMessengerMessage } from "@/lib/fetch";
import { client } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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
  console.log("Messenger Flow Webhook POST request received");

  try {
    const webhook_payload = await req.json();
    console.log("Messenger flow webhook payload:", JSON.stringify(webhook_payload, null, 2));

    if (!webhook_payload?.entry?.[0]?.messaging?.[0]) {
      return NextResponse.json({ message: "Invalid webhook payload" }, { status: 200 });
    }

    const messaging = webhook_payload.entry[0].messaging[0];
    const platformUserId = messaging.sender.id;
    const pageId = messaging.recipient.id;

    // Skip messages sent by the page itself to prevent recursion
    if (platformUserId === pageId) {
      return NextResponse.json({ message: "Ignoring self-sent message" }, { status: 200 });
    }

    // Find active conversation or start new one
    const existingConversation = await client.flowConversation.findFirst({
      where: {
        platformUserId,
        isComplete: false,
      },
      include: {
        Flow: {
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
        },
      },
    });

    if (existingConversation) {
      const { Flow: flow, currentNodeId } = existingConversation;
      const currentNode = flow.nodes.find((node) => node.id === currentNodeId);

      if (!currentNode) {
        return NextResponse.json({ message: "Invalid flow state" }, { status: 200 });
      }

      // Find next node based on user input and edge conditions
      const nextEdge = flow.edges.find((edge) => edge.fromNodeId === currentNodeId && edge.buttonValue === messaging.message.text);

      if (!nextEdge) {
        return NextResponse.json({ message: "No matching edge found" }, { status: 200 });
      }

      const nextNode = flow.nodes.find((node) => node.id === nextEdge.toNodeId);

      if (!nextNode) {
        return NextResponse.json({ message: "Next node not found" }, { status: 200 });
      }

      // Update conversation state
      await client.flowConversation.update({
        where: { id: existingConversation.id },
        data: {
          currentNodeId: nextNode.id,
          isComplete: nextNode.type === "END",
          updatedAt: new Date(),
        },
      });

      // Send node content as response
      const response = await sendMessengerMessage(platformUserId, nextNode.content, flow.User.integrations[0].token);

      if (response.status !== 200) {
        return NextResponse.json({ error: "Failed to send flow message" }, { status: 200 });
      }

      return NextResponse.json({ message: "Flow message sent" }, { status: 200 });
    }

    // No existing conversation, look for a flow to start
    const activeFlow = await client.flow.findFirst({
      where: {
        isActive: true,
        platform: "MESSENGER",
      },
      include: {
        nodes: true,
        User: {
          select: {
            integrations: {
              select: { token: true },
            },
          },
        },
      },
    });

    if (!activeFlow) {
      return NextResponse.json({ message: "No active flow found" }, { status: 200 });
    }

    // Find start node
    const startNode = activeFlow.nodes.find((node) => node.type === "START");
    if (!startNode) {
      return NextResponse.json({ message: "Invalid flow configuration" }, { status: 200 });
    }

    // Create new conversation
    await client.flowConversation.create({
      data: {
        flowId: activeFlow.id,
        platformUserId,
        currentNodeId: startNode.id,
      },
    });

    // Send initial message
    const response = await sendMessengerMessage(platformUserId, startNode.content, activeFlow.User.integrations[0].token);

    if (response.status !== 200) {
      return NextResponse.json({ error: "Failed to send initial flow message" }, { status: 200 });
    }

    return NextResponse.json({ message: "Flow started" }, { status: 200 });
  } catch (error) {
    console.error("Error processing Messenger flow webhook:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 200 });
  }
}
