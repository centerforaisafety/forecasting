"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ForecastCard } from "./forecast-card";
import { exampleQueries, allTopics } from "./data";

const Discover: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState("Politics");
  const [visibleTopicsCount, setVisibleTopicsCount] = useState(8);
  const [unlockedForecasts, setUnlockedForecasts] = useState<number[]>([]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisibleTopicsCount(2);
      } else {
        setVisibleTopicsCount(8);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const reorderedTopics = [
    allTopics.find(topic => topic.name === "Politics")!,
    ...allTopics.filter(topic => topic.name !== "Politics" && topic.name !== "All"),
    allTopics.find(topic => topic.name === "All")!
  ];

  const visibleTopics = reorderedTopics.slice(0, visibleTopicsCount);
  const moreTopics = reorderedTopics.slice(visibleTopicsCount);

  const forecasts = exampleQueries.map((query, index) => {
    const gpt4oPrediction = query.modelPredictions.find(pred => pred.model === 'gpt-4o');
    return {
      id: index + 1,
      title: query.query,
      prediction: Number(gpt4oPrediction?.prediction) || 0,
      errorMargin: Number(gpt4oPrediction?.errorMargin) || 0,
      topic: query.topic,
    };
  });

  const handleRevealAll = () => {
    setUnlockedForecasts(forecasts.map(f => f.id));
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Discover</h1>
        <p className="text-sm text-muted-foreground">Updated: 2024-09-04</p>
      </div>

      <Tabs value={selectedTopic} onValueChange={setSelectedTopic}>
        <div className="flex justify-between items-center mb-8">
          <Button onClick={handleRevealAll} disabled={unlockedForecasts.length === forecasts.length}>
            Reveal All
          </Button>
          <TabsList className="flex flex-wrap gap-x-6 gap-y-2 border-b border-muted bg-transparent">
            {visibleTopics.map((topic) => (
              <TabsTrigger
                key={topic.name}
                value={topic.name}
                className="pb-2 text-muted-foreground transition-all duration-300 data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <span className="mr-2">{topic.icon}</span>
                {topic.name}
              </TabsTrigger>
            ))}
            {moreTopics.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger className="pb-2 text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {moreTopics.map((topic) => (
                    <DropdownMenuItem
                      key={topic.name}
                      onSelect={() => setSelectedTopic(topic.name)}
                    >
                      <span className="mr-2">{topic.icon}</span>
                      {topic.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </TabsList>
        </div>

        <TabsContent value={selectedTopic}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {(selectedTopic === "All"
              ? forecasts
              : forecasts.filter((forecast) => forecast.topic === selectedTopic)
            ).map((forecast) => (
              <ForecastCard
                key={forecast.id}
                forecast={forecast}
                isUnlocked={unlockedForecasts.includes(forecast.id)}
                onUnlock={() => setUnlockedForecasts(prev => [...prev, forecast.id])}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Discover;