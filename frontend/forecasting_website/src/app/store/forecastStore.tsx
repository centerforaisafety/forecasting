import { create } from "zustand";
import {
  checkAdminStatus,
  createForecast as createForecastAction,
  fetchForecast as fetchForecastAction,
  fetchSources as fetchSourcesAction,
} from "../server_actions/forecast-actions";
import { ForecastingChat, Source, UserInfo, Message, Settings } from "../types";
import { getIpInfo } from "../server_actions/ip-actions";
import { CreateForecastSchema, SourceItemSchema } from "@/lib/validation/forecast";
import { Forecast as ForecastModel, sources as SourceModel } from "@prisma/client";
import { defaultPlannerPrompt, defaultPublisherPrompt } from "../prompts/prompts";

interface ForecastStore {
  loading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  userInfo: UserInfo | null;
  ipInfo: any;
  forecastId: string | null;
  currentForecast: ForecastModel | null;
  currentSources: SourceModel[];
  messages: Message[];
  settings: Settings;
  setAuthentication: (status: boolean, userInfo?: UserInfo) => void;
  checkAdminStatus: () => Promise<void>;
  createForecast: (chat: ForecastingChat, sources: Source[]) => Promise<void>;
  fetchForecast: (id: string) => Promise<void>;
  fetchSources: (ids: string[]) => Promise<void>;
  initializeIpInfo: () => Promise<void>;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string, sources?: Source[]) => void;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}


const defaultSettings: Settings = {
  model: process.env.NEXT_PUBLIC_DEFAULT_MODEL ?? "gpt-4o-mini",
  breadth: Number(process.env.NEXT_PUBLIC_BREADTH) || 7,
  plannerPrompt: defaultPlannerPrompt,
  publisherPrompt: defaultPublisherPrompt,
  beforeTimestamp: undefined,
};

export const useForecastStore = create<ForecastStore>((set, get) => ({
  loading: true,
  isAdmin: false,
  isAuthenticated: false,
  userInfo: null,
  ipInfo: null,
  forecastId: null,
  currentForecast: null,
  currentSources: [],
  messages: [],
  settings: defaultSettings,
  setAuthentication: async (status: boolean, userInfo?: UserInfo) => {
    if (status && userInfo) {
      set({ isAuthenticated: true, userInfo });
      await get().checkAdminStatus();
    } else {
      set({
        isAuthenticated: false,
        userInfo: null,
        isAdmin: false,
      });
    }
  },
  checkAdminStatus: async () => {
    const userInfo = get().userInfo;
    if (!userInfo) {
      set({ isAdmin: false });
      return;
    }
    try {
      const adminStatus = await checkAdminStatus(userInfo.emails);
      set({ isAdmin: adminStatus });
    } catch (error) {
      console.error("Failed to check admin status:", error);
      set({ isAdmin: false });
    }
  },
  createForecast: async (chat: ForecastingChat, sources: Source[]) => {
    try {
      const userInfo = get().userInfo;
      const ipInfo = get().ipInfo;
      
      const sourceItem: SourceItemSchema[] = sources.map(({query, id, link}) => ({query, link: link || id}));
      const createForecastInput: CreateForecastSchema = {
        name: userInfo?.name || undefined,
        emails: userInfo?.emails,
        ...chat,
        public: false,
        sources: sourceItem,
        extraInfo: ipInfo ? { ipInfo: ipInfo } : {},
      };

      const response = await createForecastAction(createForecastInput, sources);
      set({forecastId: response.id})
    } catch (error) {
      console.error("Failed to create forecast:", error);
    }
  },
  fetchForecast: async (id: string) => {
    try {
      const forecast = await fetchForecastAction(id);
      const sourceLinks: string[] = (forecast?.sources as any[])?.map(source => source.link) || [];
      console.log("Fetching source with ", sourceLinks)
      get().fetchSources(sourceLinks);

      set({ currentForecast: forecast });
      if (forecast && forecast.messages) {
        set({ messages: forecast.messages as Message[] });
      }
    } catch (error) {
      console.error("Failed to fetch forecast:", error);
      set({ currentForecast: null, messages: [] });
    }
  },
  fetchSources: async (ids: string[]) => {
    try {
      const sources = await fetchSourcesAction(ids);
      set({ currentSources: sources });
    } catch (error) {
      console.error("Failed to fetch sources:", error);
      set({ currentSources: [] });
    }
  },
  initializeIpInfo: async () => {
    try {
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      const { ip } = await ipResponse.json();
      const ipInfo = await getIpInfo(ip);

      if (ipInfo.status === 200) {
        set({ ipInfo: ipInfo.data });
      } else {
        set({ ipInfo: null });
      }
    } catch (error) {
      set({ ipInfo: null });
    }
  },
  setMessages: (messages: Message[]) => set({ messages }),
  addMessage: (message: Message) => set(state => ({ messages: [...state.messages, message] })),
  updateLastMessage: (content: string, sources?: Source[]) => set(state => {
    const updatedMessages = [...state.messages];
    if (updatedMessages.length > 0) {
      const lastMessage = updatedMessages[updatedMessages.length - 1];
      updatedMessages[updatedMessages.length - 1] = {
        ...lastMessage,
        content,
        sources: sources || lastMessage.sources,
      };
    }
    return { messages: updatedMessages };
  }),
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) =>
    set((state) => ({
      settings: {
        ...state.settings,
        [key]: value,
      },
    })),
}));