const ACCESS_TOKEN =
  "EAAJc7OQeeFQBOzAvnM1hV7UMzdmkR0cfWs239mhoRV30dEcsPKta9BR3iFlsfTEFyQ6Aq1bGvc3DGM9U5KwevQA7DzgXIk1Po5pEHstuBSDDr01uprYYZCqGFb9X2jnl9usEdCaZAYUub5BRZALqy2uJKCjq2xA0ZAI1WSrDdXnOXwq4B3vt9azpQjnr7oSiZCQZDZD";
const PAGE_ID = "your_page_id";
const GRAPH_API_URL = `https://graph.facebook.com/v19.0/me/conversations`;

async function getConversations() {
  const response = await fetch(`${GRAPH_API_URL}?fields=messages{message,id,from,created_time}&access_token=${ACCESS_TOKEN}`);
  const data = await response.json();
  return data.data || [];
}

async function markAsDone(conversationId: string) {
  const response = await fetch(`https://graph.facebook.com/v19.0/${conversationId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ tags: ["ARCHIVED"] }),
  });
  return response.json();
}

export async function automateMessenger() {
  const conversations = await getConversations();
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  for (const convo of conversations) {
    const messages = convo.messages?.data || [];
    if (messages.length < 3) {
      const lastMessage = messages[messages.length - 1];
      const lastSender = lastMessage.from.id;
      const lastTimestamp = new Date(lastMessage.created_time);

      if (lastSender !== PAGE_ID && lastTimestamp < oneDayAgo) {
        const result = await markAsDone(convo.id);
        console.log(`Archived conversation ${convo.id}:`, result);
      }
    }
  }
}

// automateMessenger();
