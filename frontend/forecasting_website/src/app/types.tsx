import { sources as Source, benchmarks as BenchmarkQuestion } from "@prisma/client";

interface ResponseChunk {
  type: "sources" | "response",
  content: Source[] | string,
}

interface Message {
  content: string;
  role: "user" | "assistant";
  sources?: Source[];
}

interface Settings {
  model?: string,
  breadth?: number,
  plannerPrompt?: string,
  publisherPrompt?: string,
  beforeTimestamp?: number
}

interface ForecastingChat {
  messages: Message[],
  settings: Settings
}

interface UserInfo {
  name: string | null;
  emails: string[];
}


export type { Message, Source, ResponseChunk, BenchmarkQuestion, ForecastingChat, UserInfo, Settings };
