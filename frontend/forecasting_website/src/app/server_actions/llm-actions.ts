"use server";

import type { CoreMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createStreamableValue, StreamableValue } from "ai/rsc";

import type { ForecastingChat, Message } from "../types";

type StreamForecastingChat = (
  input: ForecastingChat
) => Promise<{ output: StreamableValue<string> }>;

const env = process.env;

const name2model = (modelName: string) => {
    const lowerName = modelName.toLowerCase();
    if (lowerName.includes("gpt")) {
      return openai(modelName);
    } else if (lowerName.includes("claude")) {
      return anthropic(modelName);
    } else if (lowerName.includes("gemini")) {
      return google(modelName);
    } else if (lowerName.includes("fireworks")) {
      const fireworks = createOpenAI({
        apiKey: process.env.FIREWORKS_API_KEY,
        baseURL: "https://api.fireworks.ai/inference/v1",
      });
      return fireworks(modelName);
    }
    throw new Error("Unsupported model");
  },
  streamForecastingChat: StreamForecastingChat = async ({
    messages,
    settings,
  }: ForecastingChat) => {

    const stream = createStreamableValue("");
    try {
      void (async () => {
        const base = env.FORECASTING_CHAT_END_POINT,
          response = await fetch(`${base}`, {
            body: JSON.stringify({
              messages,
              ...settings
            }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Response body is not readable");
        }

        while (true) {
          // eslint-disable-next-line no-await-in-loop
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          const chunk = new TextDecoder().decode(value);
          stream.update(chunk);
        }

        stream.done();
      })();

      return { output: stream.value };
    } catch (error) {
      console.error(error);
      throw new Error("Internal server error");
    }
  },  
  batchForecastingChat = async (questions: any[], settings: any) => {
    try {
      const response = await fetch(env.FORECASTING_CHAT_END_POINT_BATCH!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions: questions.map(q => ({
            question: q.question,
            beforeTimeStamp: q.beforeTimestamp,
            backgroundText: q.backgroundText || '',
          })),
          ...settings,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error in batchForecastingChat:', error);
      throw error;
    }
  },
  streamResponse = async (content: string, modelName: string) => {
    const model = name2model(modelName),
      stream = createStreamableValue("");
    try {
      void (async () => {
        const { textStream } = await streamText({
          maxTokens: 512,
          messages: [{ content, role: "user" } as CoreMessage],
          model,
          temperature: 0.0,
        });

        for await (const delta of textStream) {
          stream.update(delta);
        }

        stream.done();
      })();

      return { output: stream.value };
    } catch (error) {
      console.error(error);
      throw new Error("Internal server error");
    }
  };
export { streamResponse, streamForecastingChat, batchForecastingChat };
