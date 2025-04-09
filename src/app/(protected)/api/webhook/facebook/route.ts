import { findKeywordsInText, trackResponses } from "@/actions/webhook/queries";
import { sendFacebookComment, sendFacebookDM } from "@/lib/fetch";
import { client } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { openAIService } from "@/lib/services/openai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  console.log("Facebook webhook GET verification request received");
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  console.log("Facebook verification params:", { mode, token, challenge });

  // Accept multiple verification tokens to increase chances of success
  const validTokens = [
    process.env.FACEBOOK_VERIFY_TOKEN,
    process.env.MESSENGER_VERIFY_TOKEN,
    "testing123", // Fallback to common test token
  ].filter(Boolean);

  if (mode === "subscribe" && token && validTokens.includes(token)) {
    console.log("Facebook webhook verified successfully with token:", token);
    return new NextResponse(challenge);
  }

  console.log("Facebook webhook verification failed");
  return new NextResponse("Verification failed", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const webhook_payload = await req.json();

    // Check if this is a comment event
    const isCommentEvent =
      webhook_payload.entry?.[0]?.changes?.[0]?.value?.item === "comment" || (webhook_payload.object === "page" && webhook_payload.entry?.[0]?.changes?.[0]?.field === "feed");

    if (isCommentEvent) {
      return handleCommentEvent(webhook_payload);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ message: "Event received but not handled" }, { status: 200 });
  } catch (error) {
    console.error("Error processing Facebook webhook:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 200 }); // Return 200 to acknowledge
  }
}

// Handle Facebook direct messages
// async function handleMessagingEvent(webhook_payload: any) {
//   const messaging = webhook_payload.entry[0].messaging[0];
//   const senderId = messaging.sender.id;
//   const recipientId = messaging.recipient.id;
//   const pageId = webhook_payload.entry[0].id;

//   console.log("Facebook DM received:", {
//     senderId,
//     recipientId,
//     message: messaging.message?.text,
//   });

//   if (!messaging.message?.text) {
//     console.log("No message text found in Facebook DM");
//     return NextResponse.json({ message: "No message text" }, { status: 200 });
//   }

//   // Try to match a keyword
//   const matcher = await matchKeyword(messaging.message.text);

//   // If we matched a keyword, find automation
//   if (matcher && matcher.automationId) {
//     console.log("Matched keyword to automation:", matcher.automationId);

//     const automation = await getKeywordAutomation(matcher.automationId, true);

//     if (!automation || !automation.triggers) {
//       console.log("No valid automation found for the matched keyword");
//       return NextResponse.json({ message: "No valid automation found" }, { status: 200 });
//     }

//     // Check if we have a token in the user's integrations
//     if (!automation.User?.integrations?.[0]?.token) {
//       console.log("No Facebook token found in user integrations");
//       return NextResponse.json({ message: "No token found" }, { status: 200 });
//     }

//     const pageToken = automation.User.integrations[0].token;

//     // Process standard message automation
//     if (automation.listener?.listener === "MESSAGE") {
//       try {
//         console.log("Sending standard message response");

//         const response = await sendFacebookDM(pageId, senderId, automation.listener.prompt || "Thanks for your message!", pageToken);

//         if (response.status === 200) {
//           await trackResponses(automation.id, "DM");
//           return NextResponse.json({ message: "Message sent" }, { status: 200 });
//         } else {
//           console.error("Failed to send DM:", response);
//           return NextResponse.json({ error: "Failed to send message" }, { status: 200 });
//         }
//       } catch (error) {
//         console.error("Error sending Facebook DM:", error);
//         return NextResponse.json({ error: "Exception sending message" }, { status: 200 });
//       }
//     }

//     // Process AI response for PRO users
//     if (automation.listener?.listener === "SMARTAI" && automation.User?.subscription?.plan === "PRO") {
//       try {
//         console.log("Generating Smart AI response for PRO user");

//         const aiResponse = await openAIService.generateResponse(automation.listener.prompt || "You are a helpful assistant", messaging.message.text);

//         if (!aiResponse) {
//           console.error("No AI response generated");
//           return NextResponse.json({ error: "No AI response generated" }, { status: 200 });
//         }

//         // Store conversation history
//         const receiverMessage = createChatHistory(automation.id, pageId, senderId, messaging.message.text);

//         const senderMessage = createChatHistory(automation.id, pageId, senderId, aiResponse);

//         await client.$transaction([receiverMessage, senderMessage]);

//         // Send the AI response
//         const response = await sendFacebookDM(pageId, senderId, aiResponse, pageToken);

//         if (response.status === 200) {
//           await trackResponses(automation.id, "DM");
//           return NextResponse.json({ message: "AI message sent" }, { status: 200 });
//         } else {
//           console.error("Failed to send AI response:", response);
//           return NextResponse.json({ error: "Failed to send AI message" }, { status: 200 });
//         }
//       } catch (error) {
//         console.error("Error in AI response process:", error);
//         return NextResponse.json({ error: "Exception in AI response process" }, { status: 200 });
//       }
//     }

//     return NextResponse.json({ message: "No matching automation type" }, { status: 200 });
//   }

//   // No keyword match, check for ongoing conversation
//   console.log("No keyword match, checking for existing conversation");

//   try {
//     const conversation = await getChatHistory(recipientId, senderId);
//     if (!conversation?.automationId) {
//       console.log("No existing conversation found");
//       return NextResponse.json({ message: "No existing conversation" }, { status: 200 });
//     }

//     if (conversation.history.length > 0) {
//       console.log("Found existing conversation history");
//       const automation = await findAutomation(conversation?.automationId);

//       if (automation?.User?.subscription?.plan === "PRO" && automation.listener?.listener === "SMARTAI") {
//         console.log("Continuing conversation with Smart AI");

//         // Generate AI response with conversation history
//         const aiResponse = await openAIService.generateResponse(automation.listener.prompt || "You are a helpful assistant", messaging.message.text, conversation.history);

//         if (!aiResponse) {
//           console.log("No AI response generated for continued conversation");
//           return NextResponse.json({ error: "No AI response generated" }, { status: 200 });
//         }

//         // Store new messages
//         const receiverMessage = createChatHistory(automation.id, pageId, senderId, messaging.message.text);

//         const senderMessage = createChatHistory(automation.id, pageId, senderId, aiResponse);

//         await client.$transaction([receiverMessage, senderMessage]);

//         // Send the AI response
//         const response = await sendFacebookDM(pageId, senderId, aiResponse, automation.User.integrations[0].token);

//         if (response.status === 200) {
//           await trackResponses(automation.id, "DM");
//           return NextResponse.json({ message: "Continued conversation message sent" }, { status: 200 });
//         } else {
//           console.error("Failed to send continued conversation message:", response);
//           return NextResponse.json({ error: "Failed to send continued conversation" }, { status: 200 });
//         }
//       }
//     }
//   } catch (error) {
//     console.error("Error processing continued conversation:", error);
//   }

//   return NextResponse.json({ message: "No matching automation or conversation found" }, { status: 200 });
// }

// Handle Facebook comments
async function handleCommentEvent(webhook_payload: any) {
  const commentData = webhook_payload.entry[0].changes[0].value;
  const postId = commentData.post_id;
  const commentId = commentData.comment_id;
  const commentText = commentData.message || ""; // Ensure commentText is a string
  const commenterId = commentData.from?.id;
  const pageId = webhook_payload.entry[0].id;

  console.log("Comment details:", { postId, commentId, commentText, commenterId, pageId });

  // First try to find automation by post ID
  let automation = await client.automation.findFirst({
    where: {
      posts: {
        some: {
          postid: postId,
        },
      },
      // active: true,
    },
    include: {
      listener: true,
      User: {
        select: {
          subscription: true,
          integrations: true,
        },
      },
    },
  });

  // If no automation found by post ID, try to match keywords in the comment text
  if (!automation && commentText) {
    console.log("No automation found by post ID, trying to match keywords in comment text");
    const matchedKeywords = await findKeywordsInText(commentText);

    if (matchedKeywords.length > 0) {
      console.log(`Found ${matchedKeywords.length} matching keywords in comment text`);

      // Use the first matching keyword's automation
      const firstMatch = matchedKeywords[0];
      if (firstMatch.automationId) {
        console.log(`Using automation ID ${firstMatch.automationId} from matched keyword '${firstMatch.word}'`);

        automation = await client.automation.findUnique({
          where: {
            id: firstMatch.automationId,
          },
          include: {
            listener: true,
            User: {
              select: {
                subscription: true,
                integrations: true,
              },
            },
          },
        });
      }
    } else {
      console.log("No matching keywords found in comment text");
    }
  }

  if (!automation?.listener || !automation.User?.integrations?.[0]?.token) {
    console.log("No active automation or token found");
    return NextResponse.json({ message: "No active automation found" }, { status: 200 });
  }

  const pageToken = automation.User.integrations[0].token;

  // Handle standard message response
  if (automation.listener.listener === "MESSAGE") {
    try {
      console.log(automation?.listener);
      // First reply to the comment if configured
      if (automation.listener.commentReply) {
        console.log("Sending comment reply");
        const commentResponse = await sendFacebookComment(commentId, automation.listener.commentReply, pageToken);
        console.log("Comment reply response:", commentResponse?.status);
      }

      // Only send DM if we have a commenter ID
      if (!commenterId) {
        console.log("No commenter ID found, cannot send DM");
        return NextResponse.json({ message: "No commenter ID" }, { status: 200 });
      }

      // Then send a DM
      console.log("Sending DM to commenter");
      const dmResponse = await sendFacebookDM(pageId, commenterId, automation.listener.prompt || "Thanks for your comment!", pageToken);
      console.log("DM response status:", dmResponse.status);

      if (dmResponse.status === 200) {
        await trackResponses(automation.id, "COMMENT");
        return NextResponse.json({ message: "Response sent" }, { status: 200 });
      } else {
        console.error("Failed to send DM:", dmResponse);
        return NextResponse.json({ error: "Failed to send message" }, { status: 200 });
      }
    } catch (error) {
      console.error("Error processing comment with MESSAGE automation:", error);
      return NextResponse.json({ error: "Exception processing comment" }, { status: 200 });
    }
  }

  // Handle AI response
  if (automation.listener.listener === "SMARTAI" && automation.User?.subscription?.plan === "PRO") {
    try {
      console.log("Processing SMARTAI automation for comment");

      // Convert commentText to a guaranteed string type for TypeScript
      const messageContent: string = commentText ?? "";
      console.log("Using message content:", messageContent);

      const aiResponse = await openAIService.generateResponse(automation.listener.prompt || "You are a helpful assistant", messageContent);

      if (!aiResponse) {
        console.log("No AI response generated");
        return NextResponse.json({ error: "No AI response generated" }, { status: 200 });
      }

      // If we have a commenter ID, store the conversation and send DM
      if (commenterId) {
        // Store the conversation
        await client.$transaction([
          client.dms.create({
            data: {
              Automation: { connect: { id: automation.id } },
              senderId: commenterId,
              reciever: pageId,
              message: commentText,
            },
          }),
          client.dms.create({
            data: {
              Automation: { connect: { id: automation.id } },
              senderId: pageId,
              reciever: commenterId,
              message: aiResponse,
            },
          }),
        ]);

        // Reply to comment if specified
        if (automation.listener.commentReply) {
          console.log("Sending comment reply");
          await sendFacebookComment(commentId, automation.listener.commentReply, pageToken);
        }

        // Send AI response as DM
        console.log("Sending AI response as DM");
        const dmResponse = await sendFacebookDM(pageId, commenterId, aiResponse, pageToken);
        console.log("DM response status:", dmResponse.status);

        if (dmResponse.status === 200) {
          await trackResponses(automation.id, "COMMENT");
          return NextResponse.json({ message: "AI response sent" }, { status: 200 });
        } else {
          console.error("Failed to send AI DM:", dmResponse);
          return NextResponse.json({ error: "Failed to send AI message" }, { status: 200 });
        }
      } else {
        // If no commenter ID, just reply to the comment with AI response
        console.log("No commenter ID, posting AI response as comment reply");
        const commentResponse = await sendFacebookComment(commentId, aiResponse, pageToken);

        if (commentResponse?.status === 200) {
          await trackResponses(automation.id, "COMMENT");
          return NextResponse.json({ message: "AI comment reply sent" }, { status: 200 });
        } else {
          console.error("Failed to send AI comment reply:", commentResponse);
          return NextResponse.json({ error: "Failed to send AI comment" }, { status: 200 });
        }
      }
    } catch (error) {
      console.error("Error in AI response generation for comment:", error);
      return NextResponse.json({ error: "Error in AI response for comment" }, { status: 200 });
    }
  }

  console.log("No matching automation type for comment");
  return NextResponse.json({ message: "No matching automation type for comment" }, { status: 200 });
}
