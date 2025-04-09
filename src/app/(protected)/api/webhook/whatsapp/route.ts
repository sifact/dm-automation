import { findAutomation } from "@/actions/automations/queries";
import { createChatHistory, findKeywordsInText, getChatHistory, getKeywordAutomation, matchKeyword, trackResponses } from "@/actions/webhook/queries";
import { sendWhatsAppMessage } from "@/lib/fetch";
import { client } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { openAIService } from "@/lib/services/openai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  console.log("WhatsApp Webhook GET request received");
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified successfully");
    return new NextResponse(challenge);
  }

  console.log("WhatsApp webhook verification failed");
  return new NextResponse("Verification failed", { status: 403 });
}

export async function POST(req: NextRequest) {
  console.log("WhatsApp Webhook POST request received");

  try {
    const webhook_payload = await req.json();
    console.log("WhatsApp webhook payload:", JSON.stringify(webhook_payload, null, 2));

    // WhatsApp specific payload structure
    if (!webhook_payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      return NextResponse.json({ message: "Invalid webhook payload" }, { status: 400 });
    }

    const message = webhook_payload.entry[0].changes[0].value.messages[0];
    const metadata = webhook_payload.entry[0].changes[0].value.metadata;

    if (!message?.text?.body) {
      return NextResponse.json({ message: "No message text found" }, { status: 200 });
    }

    // Try exact keyword matching first
    let matcher = await matchKeyword(message.text.body);

    // If no exact match, try to find keywords within the text
    if (!matcher) {
      console.log("No exact keyword match, trying to find keywords in message text");
      const matchedKeywords = await findKeywordsInText(message.text.body);

      if (matchedKeywords.length > 0) {
        console.log(`Found ${matchedKeywords.length} matching keywords in message text`);
        matcher = matchedKeywords[0];
      }
    }

    if (matcher?.automationId) {
      const automation = await getKeywordAutomation(matcher.automationId, true);

      if (!automation?.triggers || !automation.User?.integrations?.[0]?.token) {
        return NextResponse.json({ message: "Invalid automation configuration" }, { status: 200 });
      }

      const pageToken = automation.User.integrations[0].token;

      if (automation.listener?.listener === "MESSAGE") {
        const response = await sendWhatsAppMessage(message.from, automation.listener.prompt || "Thanks for your message!", pageToken);

        if (response.status === 200) {
          await trackResponses(automation.id, "DM");
          return NextResponse.json({ message: "Message sent" }, { status: 200 });
        }

        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
      }

      if (automation.listener?.listener === "SMARTAI" && automation.User?.subscription?.plan === "PRO") {
        try {
          const aiResponse = await openAIService.generateResponse(automation.listener.prompt, message.text.body);

          if (!aiResponse) {
            return NextResponse.json({ error: "No AI response generated" }, { status: 500 });
          }

          await client.$transaction([
            client.dms.create({
              data: {
                Automation: { connect: { id: automation.id } },
                senderId: message.from,
                reciever: metadata.display_phone_number,
                message: message.text.body,
              },
            }),
            client.dms.create({
              data: {
                Automation: { connect: { id: automation.id } },
                senderId: metadata.display_phone_number,
                reciever: message.from,
                message: aiResponse,
              },
            }),
          ]);

          const response = await sendWhatsAppMessage(message.from, aiResponse, pageToken);

          if (response.status === 200) {
            await trackResponses(automation.id, "DM");
            return NextResponse.json({ message: "AI message sent" }, { status: 200 });
          }

          return NextResponse.json({ error: "Failed to send AI message" }, { status: 500 });
        } catch (error) {
          console.error("Error in AI response process:", error);
          return NextResponse.json({ error: "AI response generation failed" }, { status: 500 });
        }
      }
    }

    if (!matcher) {
      const customer_history = await getChatHistory(metadata.display_phone_number, message.from);

      if (customer_history?.automationId) {
        const automation = await findAutomation(customer_history.automationId);

        if (automation?.User?.subscription?.plan === "PRO" && automation.listener?.listener === "SMARTAI" && automation.User?.integrations?.[0]?.token) {
          try {
            const aiResponse = await openAIService.generateResponse(automation.listener?.prompt, message.text.body, customer_history.history);

            if (!aiResponse) {
              return NextResponse.json({ error: "No AI response generated" }, { status: 500 });
            }

            await client.$transaction([
              client.dms.create({
                data: {
                  Automation: { connect: { id: automation.id } },
                  senderId: message.from,
                  reciever: metadata.display_phone_number,
                  message: message.text.body,
                },
              }),
              client.dms.create({
                data: {
                  Automation: { connect: { id: automation.id } },
                  senderId: metadata.display_phone_number,
                  reciever: message.from,
                  message: aiResponse,
                },
              }),
            ]);

            const response = await sendWhatsAppMessage(message.from, aiResponse, automation.User.integrations[0].token);

            if (response.status === 200) {
              return NextResponse.json({ message: "AI message sent" }, { status: 200 });
            }

            return NextResponse.json({ error: "Failed to send AI message" }, { status: 500 });
          } catch (error) {
            console.error("Error in continued conversation:", error);
            return NextResponse.json({ error: "Failed to process continued conversation" }, { status: 500 });
          }
        }
      }
    }

    return NextResponse.json({ message: "No matching automation found" }, { status: 200 });
  } catch (error) {
    console.error("Error processing WhatsApp webhook:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}
