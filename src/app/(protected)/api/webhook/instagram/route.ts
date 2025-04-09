import { findAutomation } from "@/actions/automations/queries";
import { createChatHistory, findKeywordsInText, getChatHistory, getKeywordAutomation, getKeywordPost, matchKeyword, trackResponses } from "@/actions/webhook/queries";
import { sendDM, sendPrivateMessage } from "@/lib/fetch";
import { client } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { openAIService } from "@/lib/services/openai";

// export async function GET(req: NextRequest) {
//   console.log("Webhook GET request received");
//   const hub = req.nextUrl.searchParams.get("hub.challenge");
//   return new NextResponse(hub);
// }

// Simple webhook verification endpoint
export async function GET(req: NextRequest) {
  console.log("PUBLIC Webhook GET request received");
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  // Verify that mode and token are present
  if (mode === "subscribe" && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
    console.log("Webhook verified successfully");
    return new NextResponse(challenge);
  }

  console.log("Webhook verification failed");
  return new NextResponse("Verification failed", { status: 403 });
}

export async function POST(req: NextRequest) {
  console.log("Webhook POST request received");
  const webhook_payload = await req.json();
  let matcher;
  try {
    // Try exact keyword matching first
    if (webhook_payload.entry[0].messaging) {
      const messageText = webhook_payload.entry[0].messaging[0].message.text;
      matcher = await matchKeyword(messageText);

      // If no exact match, try to find keywords within the text
      if (!matcher) {
        console.log("No exact keyword match, trying to find keywords in message text");
        const matchedKeywords = await findKeywordsInText(messageText);

        if (matchedKeywords.length > 0) {
          console.log(`Found ${matchedKeywords.length} matching keywords in message text`);
          matcher = matchedKeywords[0];
        }
      }
    }

    if (webhook_payload.entry[0].changes) {
      const commentText = webhook_payload.entry[0].changes[0].value.text;
      matcher = await matchKeyword(commentText);

      // If no exact match, try to find keywords within the text
      if (!matcher) {
        console.log("No exact keyword match, trying to find keywords in comment text");
        const matchedKeywords = await findKeywordsInText(commentText);

        if (matchedKeywords.length > 0) {
          console.log(`Found ${matchedKeywords.length} matching keywords in comment text`);
          matcher = matchedKeywords[0];
        }
      }
    }

    if (matcher && matcher.automationId) {
      console.log("Matched");
      // We have a keyword matcher

      if (webhook_payload.entry[0].messaging) {
        const automation = await getKeywordAutomation(matcher.automationId, true);

        if (automation && automation.triggers) {
          if (automation.listener && automation.listener.listener === "MESSAGE") {
            const direct_message = await sendDM(
              webhook_payload.entry[0].id,
              webhook_payload.entry[0].messaging[0].sender.id,
              automation.listener?.prompt,
              automation.User?.integrations[0].token!
            );

            if (direct_message.status === 200) {
              const tracked = await trackResponses(automation.id, "DM");
              if (tracked) {
                return NextResponse.json(
                  {
                    message: "Message sent",
                  },
                  { status: 200 }
                );
              }
            }
          }

          if (automation.listener && automation.listener.listener === "SMARTAI" && automation.User?.subscription?.plan === "PRO") {
            try {
              const aiResponse = await openAIService.generateResponse(automation.listener.prompt, webhook_payload.entry[0].messaging[0].message.text);

              if (aiResponse) {
                const reciever = createChatHistory(
                  automation.id,
                  webhook_payload.entry[0].id,
                  webhook_payload.entry[0].messaging[0].sender.id,
                  webhook_payload.entry[0].messaging[0].message.text
                );

                const sender = createChatHistory(automation.id, webhook_payload.entry[0].id, webhook_payload.entry[0].messaging[0].sender.id, aiResponse);

                await client.$transaction([reciever, sender]);

                const direct_message = await sendDM(
                  webhook_payload.entry[0].id,
                  webhook_payload.entry[0].messaging[0].sender.id,
                  aiResponse,
                  automation.User?.integrations[0].token!
                );

                if (direct_message.status === 200) {
                  const tracked = await trackResponses(automation.id, "DM");
                  if (tracked) {
                    return NextResponse.json({ message: "Message sent" }, { status: 200 });
                  }
                }
              }
            } catch (error) {
              console.error("Error in AI response generation:", error);
              return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 });
            }
          }
        }
      }

      if (webhook_payload.entry[0].changes && webhook_payload.entry[0].changes[0].field === "comments") {
        const automation = await getKeywordAutomation(matcher.automationId, false);

        console.log("geting the automations");

        const automations_post = await getKeywordPost(webhook_payload.entry[0].changes[0].value.media.id, automation?.id!);

        console.log("found keyword ", automations_post);

        if (automation && automations_post && automation.triggers) {
          console.log("first if");
          if (automation.listener) {
            console.log("first if");
            if (automation.listener.listener === "MESSAGE") {
              console.log("SENDING DM, WEB HOOK PAYLOAD", webhook_payload, "changes", webhook_payload.entry[0].changes[0].value.from);

              console.log("COMMENT VERSION:", webhook_payload.entry[0].changes[0].value.from.id);

              const direct_message = await sendPrivateMessage(
                webhook_payload.entry[0].id,
                webhook_payload.entry[0].changes[0].value.id,
                automation.listener?.prompt,
                automation.User?.integrations[0].token!
              );

              console.log("DM SENT", direct_message.data);
              if (direct_message.status === 200) {
                const tracked = await trackResponses(automation.id, "COMMENT");

                if (tracked) {
                  return NextResponse.json(
                    {
                      message: "Message sent",
                    },
                    { status: 200 }
                  );
                }
              }
            }
            if (automation.listener.listener === "SMARTAI" && automation.User?.subscription?.plan === "PRO") {
              try {
                const aiResponse = await openAIService.generateResponse(automation.listener.prompt, webhook_payload.entry[0].changes[0].value.text);

                if (aiResponse) {
                  const reciever = createChatHistory(
                    automation.id,
                    webhook_payload.entry[0].id,
                    webhook_payload.entry[0].changes[0].value.from.id,
                    webhook_payload.entry[0].changes[0].value.text
                  );

                  const sender = createChatHistory(automation.id, webhook_payload.entry[0].id, webhook_payload.entry[0].changes[0].value.from.id, aiResponse);

                  await client.$transaction([reciever, sender]);

                  const direct_message = await sendPrivateMessage(
                    webhook_payload.entry[0].id,
                    webhook_payload.entry[0].changes[0].value.id,
                    aiResponse,
                    automation.User?.integrations[0].token!
                  );

                  if (direct_message.status === 200) {
                    const tracked = await trackResponses(automation.id, "COMMENT");
                    if (tracked) {
                      return NextResponse.json({ message: "Message sent" }, { status: 200 });
                    }
                  }
                }
              } catch (error) {
                console.error("Error in AI response generation:", error);
                return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 });
              }
            }
          }
        }
      }
    }

    if (!matcher) {
      const customer_history = await getChatHistory(webhook_payload.entry[0].messaging[0].recipient.id, webhook_payload.entry[0].messaging[0].sender.id);

      if (customer_history?.automationId && customer_history?.history?.length > 0) {
        const automation = await findAutomation(customer_history?.automationId!);

        if (automation?.User?.subscription?.plan === "PRO" && automation.listener?.listener === "SMARTAI") {
          try {
            const aiResponse = await openAIService.generateResponse(automation.listener.prompt, webhook_payload.entry[0].messaging[0].message.text, customer_history.history);

            if (aiResponse) {
              const reciever = createChatHistory(
                automation.id,
                webhook_payload.entry[0].id,
                webhook_payload.entry[0].messaging[0].sender.id,
                webhook_payload.entry[0].messaging[0].message.text
              );

              const sender = createChatHistory(automation.id, webhook_payload.entry[0].id, webhook_payload.entry[0].messaging[0].sender.id, aiResponse);

              await client.$transaction([reciever, sender]);

              const direct_message = await sendDM(
                webhook_payload.entry[0].id,
                webhook_payload.entry[0].messaging[0].sender.id,
                aiResponse,
                automation.User?.integrations[0].token!
              );

              if (direct_message.status === 200) {
                return NextResponse.json({ message: "Message sent" }, { status: 200 });
              }
            }
          } catch (error) {
            console.error("Error in AI response generation:", error);
            return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 });
          }
        }
      }

      return NextResponse.json({ message: "No automation set" }, { status: 200 });
    }
    return NextResponse.json({ message: "No automation set" }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ message: "Error processing webhook" }, { status: 500 });
  }
}
