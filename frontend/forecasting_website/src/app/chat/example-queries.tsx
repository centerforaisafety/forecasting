import React from 'react';
import { Button } from "@/components/ui/button";

const exampleQueries = [
  { query: "Will Trump win the 2024 US presidential election?", icon: "🗳️", topic: "Politics" },
  // { query: "Will Elon Musk's xAI have the most intelligent AI system at the end of 2025?", icon: "🧠", topic: "AI", background: "xAI has just released Grok 2" },
  { query: "What's the probability that COVID-19 was a lab leak?", icon: "🦠", topic: "Pandemic" },
  { query: "Will SB 1047 (California AI bill) be signed into law?", icon: "🧑‍⚖️", topic: "Law" },
  { query: "What is the probability that Grok 3 will be the most performant publicly available AI model in the world at the time of its release?", icon: "🧠", topic: "AI"},
  { query: "What's the probability that, by 2030, a human will use an AI to launch a successful cyberattack on critical infrastructure?", icon: "💻", topic: "Cybersecurity" },
  { query: "What's the probability that, by 2030, a human will use an AI to successfully release a bioweapon?", icon: "🧪", topic: "Biosecurity" }
];

interface QueryItem {
  query: string;
  icon: string;
  topic: string;
  background?: string;
}

interface ExampleQueriesProps {
  onExampleClick: (formattedQuery: string) => void;
  queries?: QueryItem[];
}

const ExampleQueries: React.FC<ExampleQueriesProps> = ({ onExampleClick, queries = exampleQueries }) => {
  const handleClick = (query: QueryItem) => {
    let formattedQuery = query.query;
    if (query.background) {
      formattedQuery += `\n\nBackground text: ${query.background}`;
    }
    onExampleClick(formattedQuery);
  };

  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      {queries.map((query, index) => (
        <Button
          key={index}
          className="flex flex-col items-start h-auto py-2 px-4 text-left w-full"
          variant="outline"
          onClick={() => handleClick(query)}
        >
          <span className="text-xs text-gray-500 mb-1 w-full">{query.icon} {query.topic}</span>
          <div className="flex w-full">
            <span className="inline-block whitespace-normal text-xs break-words">{query.query}</span>
          </div>
        </Button>
      ))}
    </div>
  );
};

export default ExampleQueries;