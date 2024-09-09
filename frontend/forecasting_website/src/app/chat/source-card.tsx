import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import type { Source } from "../types";
import SourceSlider from "./source-slider";
import { parse } from 'tldts';
import XLoadingIndicator from "@/components/x-loading";

const LoadingIndicator = () => (
  <div className="absolute bottom-2 right-2 w-4 h-4">
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div>
  </div>
);

const SourceCard = ({ sources }: { readonly sources: Source[] }) => {
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [maxCards, setMaxCards] = useState(7);

  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setMaxCards(mobile ? 6 : 7);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const getDomain = (url: string): string => {
    const parsedUrl = parse(url);
    return parsedUrl.domain || '';
  };

  const truncateDomain = (domain: string) => {
    return domain.length > 15 ? domain.slice(0, 12) + '...' : domain;
  };

  const visibleSources = sources.slice(0, maxCards - 1);
  const hasMoreSources = sources.length > maxCards - 1;
  const hasUnsummarizedSources = sources.some(source => source.summarized_content === null);

  return (
    <>
      <div className={`grid gap-2 ${isMobile ? 'grid-cols-3' : 'grid-cols-4'}`}>
        {visibleSources.map((source, i) => {
          const url = source.id ?? (source.link ?? "");
          const domain = url ? getDomain(url) : "";
          const truncatedDomain = truncateDomain(domain);
          return (
            <HoverCard closeDelay={100} key={i} openDelay={0}>
              <HoverCardTrigger>
                <Link
                  className="flex h-20 w-full flex-col justify-between rounded-xl border p-2 shadow transition-all duration-300 hover:bg-muted relative
                             bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  href={url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <p className="line-clamp-2 overflow-hidden text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {source.title ?? truncatedDomain}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    {source.favicon && (
                      <Image
                        alt="favicon"
                        height={16}
                        src={source.favicon}
                        width={16}
                      />
                    )}
                    <span className="truncate">{truncatedDomain}</span>
                  </p>
                  {source.summarized_content === null && 
                  <div className="absolute bottom-1 right-1 w-4 h-4">
                  <XLoadingIndicator />
                  </div>
                  }
                </Link>
              </HoverCardTrigger>
              <HoverCardContent className="space-y-1 p-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <p className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  {source.favicon && (
                    <Image
                      alt="favicon"
                      height={16}
                      src={source.favicon}
                      width={16}
                    />
                  )}
                  {domain}
                </p>
                <Link
                  className="block text-sm font-semibold leading-4 hover:underline text-gray-800 dark:text-gray-200"
                  href={url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {source.title ?? source.id}
                </Link>
                {source.snippet && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {source.snippet}
                  </p>
                )}
                {source.summarized_content === null && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    Summarizating...
                  </p>
                )}
              </HoverCardContent>
            </HoverCard>
          );
        })}

        <Button
          className="flex h-20 w-full items-center justify-center rounded-xl border shadow
                     bg-gray-100 dark:bg-gray-800 
                     text-gray-800 dark:text-gray-200 
                     hover:bg-gray-200 dark:hover:bg-gray-700 
                     transition-colors duration-200
                     border-gray-200 dark:border-gray-700
                     relative"
          onClick={() => setIsSliderOpen(true)}
        >
          {hasMoreSources 
            ? `View ${sources.length - visibleSources.length} More`
            : "More Details"}
          {hasUnsummarizedSources && 
            <div className="absolute bottom-1 right-1 w-4 h-4">
              <XLoadingIndicator />
            </div>
          }
        </Button>
      </div>

      <SourceSlider
        isOpen={isSliderOpen}
        onClose={() => setIsSliderOpen(false)}
        sources={sources}
      />
    </>
  );
};

export default SourceCard;