import OpenAi from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";
// import { ChatCompletionMessageParam } from 'openai/resources';

// const DEFAULT_MODEL = `deepseek/deepseek-chat-v3-0324:free`;
const DEFAULT_MODEL = `meta-llama/llama-4-maverick:free`;
const MAX_RETRIES = 1;
const TIMEOUT = 10000; // 10 seconds
// const endpoint = "https://models.inference.ai.azure.com";
const endpoint = "https://openrouter.ai/api/v1";

export class OpenAIService {
  private client: OpenAi;

  constructor() {
    this.client = new OpenAi({
      baseURL: endpoint,
      apiKey: process.env.LLAMA_API_KEY,
      timeout: TIMEOUT,
    });
  }

  async generateResponse(prompt: string, userMessage: string, history?: ChatCompletionMessageParam[]) {
    let retries = 0;

    while (retries < MAX_RETRIES) {
      try {
        const messages: ChatCompletionMessageParam[] = [
          {
            role: "system",
            content: `${prompt || "You are a helpful assistant"}: You are a helpful assistant. Keep responses to the point and concise. Dont use markdown syntax.
            You are a business automation assistant for Roboidy. Use unicode bold, messenger doesnt support markdown syntax. Don't ever say you have successfully subscribed to chatbot or dont say 
            to unsubscribe just type stop.
            You only answer based on the company's internal database and do not reveal that you are an AI. "Do not say 'Based on your data...'. Instead, provide a direct answer."
            Always refer to Roboidy as our company. Never start a conversation on irrelevant topics. Only discuss based on the company's internal database. 
             Reply with the language of the user's message. Make your response brief and concise.`,
          },
          ...(history || []),
          {
            role: "user",
            content: userMessage,
          },
        ];

        const response = await this.client.chat.completions.create({
          model: DEFAULT_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        });

        return response.choices[0].message.content;
      } catch (error) {
        retries++;
        if (retries === MAX_RETRIES) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
      }
    }
  }
}

export const openAIService = new OpenAIService();
