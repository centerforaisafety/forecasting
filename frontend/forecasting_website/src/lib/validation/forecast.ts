import { z } from "zod";

const messageSchema = z.object({
  content: z.string(),
  role: z.enum(["user", "assistant"]),
});

export const sourceItemSchema = z.object({
    link: z.string().url(),
    query: z.string(),
});

export const sourceSchema = z.object({
    link: z.string().url(),
    favicon: z.string().optional(),
    sourceId: z.number().int().optional(),
    snippet: z.string().optional(),
    title: z.string().optional(),
    content: z.string().optional(),
    date: z.string().optional(),
    queries: z.array(z.string()).default([]),
  });

const ipInfoSchema = z.object({
  ip: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const settingsSchema = z.object({
    model: z.string().optional(),
    plannerPrompt: z.string().optional(),
    publisherPrompt: z.string().optional(),
    breadth: z.number().int().optional(),
    beforeTimestamp: z.number().int().optional(),
});
  
export const createForecastSchema = z.object({
    name: z.string().optional(),
    emails: z.array(z.string().email()).optional(),
    public: z.boolean().default(false),
    messages: z.array(messageSchema).optional(),
    sources: z.array(sourceItemSchema).default([]),
    settings: settingsSchema.default({}),
    extraInfo: z.object({
      ipInfo: ipInfoSchema.optional(),
    }).default({}),
  });

export type CreateForecastSchema = z.infer<typeof createForecastSchema>;
export type SourceItemSchema = z.infer<typeof sourceItemSchema>;
export type CreateSourceSchema = z.infer<typeof sourceSchema>;
export type MessageSchema = z.infer<typeof messageSchema>;
export type SettingsSchema = z.infer<typeof settingsSchema>;
