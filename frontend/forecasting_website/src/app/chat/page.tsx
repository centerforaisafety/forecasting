"use client";

import React, { useEffect, useRef, useState } from "react";
import { BookmarkIcon, FileTextIcon } from "@radix-ui/react-icons";
import { readStreamableValue } from "ai/rsc";
import type { ForecastingChat, Message, Source } from "../types";
import ChatSkeleton from "./chat-skeleton";
import ReportRenderer from "./report";
import SourceCard from "./source-card";
import SettingsPanel from "./settings-panel";
import {
  defaultPlannerPrompt,
  defaultPublisherPrompt,
} from "../prompts/prompts";
import ExampleQueries from "./example-queries";
import { useForecastStore } from "../store/forecastStore";
import { useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import SearchQueries from "./search-queries";
import ChatInput from "./chat-input";
import XLoadingIndicator from "@/components/x-loading";
import { streamForecastingChat } from "../server_actions/llm-actions";

import { Turnstile } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

export const maxDuration = 300;

const maxTurn = 1;

interface RelatedForecast {
  query: string;
  icon: string;
  topic: string;
}

const RelatedForecasts: React.FC<{
  forecasts: RelatedForecast[];
  onForecastClick: (query: string) => void;
}> = ({ forecasts, onForecastClick }) => {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Explore Forecasts</h3>
      <ExampleQueries queries={forecasts} onExampleClick={onForecastClick} />
    </div>
  );
};

export default function Chat() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<string>(
    process.env.NEXT_PUBLIC_DEFAULT_MODEL ?? "gpt-4o-mini"
  );
  const [beforeTimestamp, setBeforeTimestamp] = useState<number | undefined>(
    undefined
  );
  const [breadth, setBreadth] = useState(7);
  const [plannerPrompt, setPlannerPrompt] = useState(defaultPlannerPrompt);
  const [publisherPrompt, setPublisherPrompt] = useState(
    defaultPublisherPrompt
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [shouldCreateForecast, setShouldCreateForecast] = useState(false);
  const [queries, setQueries] = useState<string[]>([]);
  const [relatedForecasts, setRelatedForecasts] = useState<RelatedForecast[]>(
    []
  );
  const [isFetchingForecast, setIsFetchingForecast] = useState<
    boolean | undefined
  >(undefined);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const turnstileSiteKey =
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "";
  const [isTurnstileReady, setIsTurnstileReady] = useState(false);

  const shouldScrollRef = useRef(true);

  const {
    forecastId,
    createForecast,
    fetchForecast,
    currentForecast,
    currentSources,
    messages,
    settings,
    setMessages,
    addMessage,
    updateLastMessage,
  } = useForecastStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    const initTurnstile = async () => {
      try {
        await turnstileRef.current?.getResponsePromise();
        setIsTurnstileReady(true);
      } catch (error) {
        toast.error(
          "Failed to initialize Turnstile. Please refresh the page to try again."
        );
      }
    };

    initTurnstile();
  }, []);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setIsFetchingForecast(true);
      useForecastStore.setState({ forecastId: id });
      fetchForecast(id)
        .catch((error) => {
          console.error("Error fetching forecast:", error);
          toast.error("Failed to load forecast. Please try again.");
        })
        .finally(() => {
          setIsFetchingForecast(false);
        });
    } else {
      setIsFetchingForecast(false);
    }
  }, [searchParams, fetchForecast]);

  useEffect(() => {
    if (currentForecast && currentSources.length > 0) {
      let currentMessages: Message[] = currentForecast.messages.map(
        (message) => ({
          ...message,
          sources: message.role === "assistant" ? currentSources : undefined,
        })
      );
      setMessages(currentMessages);
    }
  }, [currentForecast, currentSources, setMessages]);

  useEffect(() => {
    if (shouldCreateForecast && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const forecastingChatOutput: ForecastingChat = {
        messages: messages.map(({ content, role }) => ({ content, role })),
        settings: {
          model,
          breadth,
          plannerPrompt,
          publisherPrompt,
          beforeTimestamp,
        },
      };
      createForecast(forecastingChatOutput, lastMessage.sources ?? []);
      setShouldCreateForecast(false);
    }
  }, [
    shouldCreateForecast,
    messages,
    model,
    breadth,
    plannerPrompt,
    publisherPrompt,
    beforeTimestamp,
    createForecast,
  ]);

  const handleSubmit = async (submittedInput: string) => {
    if (!submittedInput.trim()) {
      return;
    }

    const turnstileToken = await turnstileRef.current?.getResponsePromise();
    if (!turnstileToken) {
      toast.error("Unable to process Cloudflare Turnstile.");
      return;
    }
    turnstileRef.current?.reset();

    const newMessages: Message[] = [
      ...messages,
      { content: submittedInput, role: "user" as const } as Message,
    ].slice(-(maxTurn * 2) + 1);

    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setQueries([]);
    setRelatedForecasts([]);

    try {
      const forecastingChatInput: ForecastingChat = {
        messages: newMessages.map(({ content, role }) => ({ content, role })),
        settings,
      };
      let fullContent = "";
      let forecastContent = "";
      let isForecastingStarted = false;

      const { output } = await streamForecastingChat(forecastingChatInput);

      addMessage({ role: "assistant" as const, sources: [], content: "" });

      for await (const delta of readStreamableValue(output)) {
        if (delta) {
          fullContent += delta;

          if (fullContent.includes("[SEP_QUERIES]")) {
            const [queriesPart, rest] = fullContent.split("[SEP_QUERIES]");
            const parsedQueries = JSON.parse(queriesPart) as string[];
            setQueries(parsedQueries);
            fullContent = rest;
          }

          if (fullContent.includes("[SEP_SOURCE]")) {
            const parts = fullContent.split("[SEP_SOURCE]");
            const currentSources = JSON.parse(
              parts[parts.length - 2]
            ) as Source[];

            updateLastMessage("", currentSources);

            fullContent = parts[parts.length - 1];
          }

          if (fullContent.includes("[FORECASTING_START]")) {
            [, fullContent] = fullContent.split("[FORECASTING_START]");
            isForecastingStarted = true;
            forecastContent = "";
          }

          if (isForecastingStarted) {
            if (fullContent.includes("[FORECASTING_END]")) {
              const [forecast, rest] = fullContent.split("[FORECASTING_END]");
              forecastContent += forecast;
              isForecastingStarted = false;
              fullContent = rest;

              updateLastMessage(forecastContent.trim());
            } else {
              forecastContent += fullContent;
              fullContent = "";

              updateLastMessage(forecastContent.trim());
            }
          }

          if (fullContent.includes("[SEP_RESPONSE]")) {
            const [, relatedForecastsJson] =
              fullContent.split("[SEP_RESPONSE]");

            const parsedRelatedForecasts = JSON.parse(
              relatedForecastsJson
            ) as RelatedForecast[];
            setRelatedForecasts(parsedRelatedForecasts);

            fullContent = "";
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
      setShouldCreateForecast(true);
    }
  };

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      shouldScrollRef.current = scrollHeight - scrollTop === clientHeight;
    };

    chatContainer.addEventListener("scroll", handleScroll);

    if (shouldScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    return () => chatContainer.removeEventListener("scroll", handleScroll);
  }, [messages]);

  const handleExampleClick = (query: string) => {
    handleSubmit(query);
  };

  const handleShare = () => {
    if (forecastId) {
      const shareUrl = `${window.location.origin}${window.location.pathname}?id=${forecastId}`;
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          toast.success("Share link copied to clipboard!");
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
          toast.error("Failed to copy share link. Please try again.");
        });
    }
  };

  return (
    <div className="flex flex-col h-full justify-center">
      <Toaster />
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <div className="flex-1 overflow-y-auto relative" ref={chatContainerRef}>
        {!isTurnstileReady || isFetchingForecast ? (
          <div className="absolute inset-0 flex flex-col justify-center items-center">
            <div className="w-8 h-8 mb-2">
              <XLoadingIndicator />
            </div>
            <p className="text-sm text-muted-foreground">
              {!isTurnstileReady
                ? "Verifying..."
                : isFetchingForecast
                ? "Loading Forecast..."
                : ""}
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-8">
            {messages.map((message, i) => (
              <React.Fragment key={i}>
                {message.role === "user" ? (
                  <p className="border-t py-2 sm:py-3 text-lg sm:text-2xl font-bold">
                    {message.content.split("\n")[0]}
                    {message.content
                      .split("\n")
                      .slice(1)
                      .map((line, index) => (
                        <span
                          key={index}
                          className="block text-foreground/80 font-medium text-base"
                        >
                          {line}
                        </span>
                      ))}
                  </p>
                ) : (
                  <>
                    {queries.length > 0 && <SearchQueries queries={queries} />}
                    {message.sources?.length ? (
                      <div>
                        <p className="mb-2 flex items-center text-xs sm:text-sm font-semibold">
                          <BookmarkIcon className="mr-2 size-3 sm:size-4" />{" "}
                          Sources
                        </p>
                        <SourceCard sources={message.sources} />
                      </div>
                    ) : null}
                    {message.content ? (
                      <>
                        <p className="flex items-center gap-2 py-2 sm:py-3 text-base sm:text-lg mt-3 sm:mt-4 font-semibold">
                          <FileTextIcon className="size-4 sm:size-5" /> Answer
                        </p>
                        <ReportRenderer
                          className="mx-1 sm:mx-2 mt-2 rounded-2xl sm:rounded-3xl bg-background px-3 sm:px-4 py-2 drop-shadow-lg text-sm sm:text-base"
                          content={message.content}
                        />
                      </>
                    ) : (
                      <ChatSkeleton
                        showSources={
                          !Boolean(
                            message.sources && message.sources.length > 0
                          )
                        }
                        showAnswer={!message.content}
                      />
                    )}
                  </>
                )}
              </React.Fragment>
            ))}
            {relatedForecasts.length > 0 && (
              <RelatedForecasts
                forecasts={relatedForecasts}
                onForecastClick={handleSubmit}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="relative mb-6">
        <div className="max-w-[calc(100%-2rem)] sm:max-w-3xl w-full mx-auto">
          <div className="bg-transparent rounded-2xl">
            {messages.length === 0 &&
              isFetchingForecast !== undefined &&
              isTurnstileReady && (
                <ExampleQueries onExampleClick={handleExampleClick} />
              )}
            <Turnstile
              ref={turnstileRef}
              options={{
                size: "invisible",
                theme: "auto",
              }}
              siteKey={turnstileSiteKey}
            />
            <ChatInput
              isLoading={
                isLoading ||
                isFetchingForecast ||
                isFetchingForecast === undefined
              }
              onSubmit={handleSubmit}
              onSettingsOpen={() => setIsSettingsOpen(!isSettingsOpen)}
              onShare={handleShare}
              canShare={Boolean(forecastId)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
