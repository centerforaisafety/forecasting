import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Share } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  isLoading: boolean;
  onSubmit: (input: string) => void;
  onSettingsOpen: () => void;
  onShare: () => void;
  canShare: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  isLoading,
  onSubmit,
  onSettingsOpen,
  onShare,
  canShare
}) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === "Tab" && input === "") {
      e.preventDefault();
      setInput("What's the probability that ");
    }
  };

  return (
    <form className="flex flex-col" onSubmit={handleSubmit}>
      <div className="relative bg-background">
        <div className="flex items-center">
          <div className="relative flex-grow">
            <Textarea
              ref={inputRef}
              className="w-full rounded-2xl pl-4 pr-36 pt-3 pb-3 focus-visible:ring-ring resize-none border border-input bg-background shadow-lg"
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="⇥ What's the probability that..."
              value={input}
              rows={2}
            />
          </div>
        </div>
        <div className="absolute right-2 bottom-2 flex items-center space-x-4">
          <button
            onClick={onSettingsOpen}
            className="text-muted-foreground hover:text-primary transition-colors"
            title="Settings"
            type="button"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            className={cn(
              "text-muted-foreground transition-colors",
              isLoading || !canShare
                ? "opacity-50 cursor-not-allowed"
                : "hover:text-primary"
            )}
            disabled={isLoading || !canShare}
            onClick={onShare}
            title="Share forecast"
            type="button"
          >
            <Share className="h-5 w-5" />
          </button>
          <Button
            className="rounded-full px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Forecasting..." : "Forecast"}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
      Research demo of superhuman forecasting AI. Probabilities are approximate.
      </p>
    </form>
  );
};

export default ChatInput;