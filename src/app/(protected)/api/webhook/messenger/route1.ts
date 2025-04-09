import { findAutomation } from "@/actions/automations/queries";
import { createChatHistory, getChatHistory, getKeywordAutomation, matchAIKeyword, matchKeyword, trackResponses } from "@/actions/webhook/queries";
import { sendMessengerMessage } from "@/lib/fetch";
import { client } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { openAIService } from "@/lib/services/openai";

// export const dynamic = "force-dynamic";
// export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  console.log("Messenger Webhook GET request received");
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.MESSENGER_VERIFY_TOKEN) {
    console.log("Messenger webhook verified successfully");
    return new NextResponse(challenge);
  }

  console.log("Messenger webhook verification failed");
  return new NextResponse("Verification failed", { status: 403 });
}

export async function POST(req: NextRequest) {
  console.log("Messenger Webhook POST request received");

  try {
    const webhook_payload = await req.json();
    console.log("Messenger webhook payload:", JSON.stringify(webhook_payload, null, 2));

    if (!webhook_payload?.entry?.[0]?.messaging?.[0]) {
      return NextResponse.json({ message: "Invalid webhook payload" }, { status: 200 });
    }

    const messaging = webhook_payload.entry[0].messaging[0];

    // Skip messages sent by the page itself to prevent recursion
    if (messaging.sender?.id === messaging.recipient?.id) {
      return NextResponse.json({ message: "Ignoring self-sent message" }, { status: 200 });
    }

    if (!messaging?.message?.text) {
      return NextResponse.json({ message: "No message text found" }, { status: 200 });
    }

    const matcher = await matchKeyword(messaging.message.text);

    if (matcher?.automationId) {
      const automation = await getKeywordAutomation(matcher.automationId, true);

      if (!automation?.triggers || !automation.User?.integrations?.[0]?.token) {
        return NextResponse.json({ message: "Invalid automation configuration" }, { status: 200 });
      }

      const pageToken = automation.User.integrations[0].token;

      if (automation.listener?.listener === "MESSAGE") {
        const response = await sendMessengerMessage(messaging.sender.id, automation.listener.prompt || "Thanks for your message!", pageToken);

        if (response.status === 200) {
          await trackResponses(automation.id, "DM");
          return NextResponse.json({ message: "Message sent" }, { status: 200 });
        }

        return NextResponse.json({ error: "Failed to send message" }, { status: 200 });
      }
    }

    if (!matcher) {
      const customer_history = await getChatHistory(messaging?.recipient?.id, messaging?.sender?.id);

      if (customer_history?.automationId) {
        console.log("Found existing conversation history");
        const automation = await findAutomation(customer_history.automationId);

        if (automation?.User?.subscription?.plan === "PRO" && automation.listener?.listener === "SMARTAI" && automation.User?.integrations?.[0]?.token) {
          try {
            const aiResponse = await openAIService.generateResponse(automation.listener?.prompt, messaging.message.text, customer_history.history);

            if (!aiResponse) {
              return NextResponse.json({ error: "No AI response generated" }, { status: 200 });
            }

            await client.$transaction([
              client.dms.create({
                data: {
                  Automation: { connect: { id: automation.id } },
                  senderId: messaging.sender.id,
                  reciever: messaging.recipient.id,
                  message: messaging.message.text,
                },
              }),
              client.dms.create({
                data: {
                  Automation: { connect: { id: automation.id } },
                  senderId: messaging.recipient.id,
                  reciever: messaging.sender.id,
                  message: aiResponse,
                },
              }),
            ]);

            const response = await sendMessengerMessage(messaging.sender.id, aiResponse, automation.User.integrations[0].token);

            if (response.status === 200) {
              return NextResponse.json({ message: "AI message sent" }, { status: 200 });
            }

            return NextResponse.json({ error: "Failed to send AI message" }, { status: 200 });
          } catch (error) {
            console.error("Error in continued conversation:", error);
            return NextResponse.json({ error: "Failed to process continued conversation" }, { status: 200 });
          }
        }
      }

      // ai matcher with any prompt

      const aiMatcher = await matchAIKeyword(messaging.message.text);

      if (!aiMatcher) {
        return NextResponse.json({ error: "No AI  matching automation found" }, { status: 200 });
      }

      const automation = await getKeywordAutomation(aiMatcher?.automationId!, true);
      console.log(automation, "automation");
      if (!automation?.listener || !automation.User?.integrations?.[0]?.token) {
        console.log("inside invalid conf...");
        return NextResponse.json({ message: "Invalid automation configuration" }, { status: 200 });
      }

      try {
        const aiResponse = await openAIService.generateResponse(automation?.listener?.prompt, messaging.message.text);

        if (!aiResponse) {
          return NextResponse.json({ error: "No AI response generated" }, { status: 200 });
        }

        await client.$transaction([
          client.dms.create({
            data: {
              Automation: { connect: { id: automation.id } },
              senderId: messaging.sender.id,
              reciever: messaging.recipient.id,
              message: messaging.message.text,
            },
          }),
          client.dms.create({
            data: {
              Automation: { connect: { id: automation.id } },
              senderId: messaging.recipient.id,
              reciever: messaging.sender.id,
              message: aiResponse,
            },
          }),
        ]);

        const response = await sendMessengerMessage(messaging.sender.id, aiResponse, automation.User.integrations[0].token);

        if (response.status === 200) {
          await trackResponses(automation.id, "DM");
          return NextResponse.json({ message: "AI message sent" }, { status: 200 });
        }

        return NextResponse.json({ error: "Failed to send AI message" }, { status: 200 });
      } catch (error) {
        console.error("Error in AI response process:", error);
        return NextResponse.json({ error: "AI response generation failed" }, { status: 200 });
      }
    }

    return NextResponse.json({ message: "No matching automation found" }, { status: 200 });
  } catch (error) {
    console.error("Error processing Messenger webhook:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 200 });
  }
}
