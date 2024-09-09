import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import XLoadingIndicator from "@/components/x-loading";

interface ReportRendererProps {
  readonly className?: string;
  readonly content: string;
}

const ProbabilityCircle: React.FC<{
  probability: number;
  className?: string;
}> = ({ probability, className }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const fillPercentage = probability * 100;
  const strokeDasharray = `${
    (fillPercentage / 100) * circumference
  } ${circumference}`;

  return (
    <svg
      className={`inline-block ${className}`}
      width="44"
      height="44"
      viewBox="0 0 44 44"
    >
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        opacity="0.2"
      />
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeDasharray={strokeDasharray}
        transform="rotate(-90 22 22)"
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        fontSize="12"
        fill="currentColor"
      >
        {(probability * 100).toFixed(0)}%
      </text>
    </svg>
  );
};

const StrengthIndicator: React.FC<{ strength: number }> = ({ strength }) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full"
          style={{ width: `${strength * 10}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">
        Strength {strength}/10
      </span>
    </div>
  );
};

const formatText = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const FactCard: React.FC<{ index: number; content: string }> = ({
  index,
  content,
}) => {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mt-1">
          {index + 1}
        </div>
        <p className="text-sm">{formatText(content)}</p>
      </div>
    </Card>
  );
};

const ReportRenderer: React.FC<ReportRendererProps> = ({
  className,
  content,
}) => {
  const [showAllFacts, setShowAllFacts] = useState(false);
  const [isFactsLoading, setIsFactsLoading] = useState(true);

  useEffect(() => {
    if (content.includes("<facts>")) {
      if (content.includes("</facts>")) {
        setIsFactsLoading(false);
      } else {
        setIsFactsLoading(true);
      }
    } else {
      setIsFactsLoading(false);
    }
  }, [content]);

  const parseFacts = (content: string): string[] => {
    const lines = content.split("\n");
    return lines
      .map((line) => line.replace(/^(-|\d+\.)\s*/, "").trim())
      .filter((line) => line !== "");
  };

  const extractProbability = (content: string): number => {
    const regex = /\*?(\d*\.\d+|\d+\.?\d*)\*?/;
    const match = content.match(regex);
    if (match) {
      const extracted = parseFloat(match[1]);
      return extracted > 1
        ? Math.min(extracted / 100, 1)
        : Math.min(Math.max(extracted, 0), 1);
    }
    return 0;
  };

  const parsePoint = (
    point: string
  ): { text: string; strength: number | null } => {
    // This regex now looks for the strength indicator at the end of the string with or without parentheses
    const regex =
      /^(\*{0,2}\s*\d*\.?\s*)?(.+?)(?:\s*(?:\()?Strength:?\s*(\d+(?:\.\d+)?)\s*(?:\/\s*10)?(?:\))?)?\s*$/i;
    const match = point.match(regex);

    if (match) {
      const [, prefix, text, strengthStr] = match;
      let strength: number | null = null;
      let cleanText = text.trim();

      if (strengthStr) {
        strength = parseFloat(strengthStr);
        // Remove the strength indicator from the end of the text if it's there
        cleanText = cleanText
          .replace(
            /\s*(?:\()?Strength:?\s*\d+(?:\.\d+)?\s*(?:\/\s*10)?(?:\))?\s*$/i,
            ""
          )
          .trim();
      } else {
        // If strength is not found at the end, look for it within the text
        const strengthMatch = cleanText.match(
          /\s*(?:\()?Strength:?\s*(\d+(?:\.\d+)?)\s*(?:\/\s*10)?(?:\))?\s*/i
        );
        if (strengthMatch) {
          strength = parseFloat(strengthMatch[1]);
          // Remove the strength indicator from within the text
          cleanText = cleanText
            .replace(
              /\s*(?:\()?Strength:?\s*\d+(?:\.\d+)?\s*(?:\/\s*10)?(?:\))?\s*/i,
              ""
            )
            .trim();
        }
      }

      // Remove trailing colon if present
      cleanText = cleanText.replace(/:\s*$/, "");

      return { text: cleanText, strength };
    }

    return { text: point.trim(), strength: null };
  };

  const renderSection = (tag: string, content: string) => {
    if (!content.trim()) {
      return null;
    }

    const probability = extractProbability(content);

    switch (tag.toLowerCase()) {
      case "tentative":
      case "answer":
        const bgColor =
          tag.toLowerCase() === "tentative" ? "bg-secondary" : "bg-primary";
        const textColor =
          tag.toLowerCase() === "tentative"
            ? "text-secondary-foreground"
            : "text-primary-foreground";
        return (
          <section key={tag} className={`mb-4 p-4 ${bgColor} rounded-lg`}>
            <div className="flex flex-col items-center mb-2">
              <h2 className={`text-lg font-semibold ${textColor} mb-2`}>
                {formatText(tag.charAt(0).toUpperCase() + tag.slice(1))}
              </h2>
              <ProbabilityCircle
                probability={probability}
                className={`${textColor}`}
              />
            </div>
          </section>
        );
      case "yes":
      case "no":
        const points = content.split("\n").filter((line) => line.trim() !== "");
        return (
          <>
            <h2 className="text-xl font-semibold mb-4">
              {formatText("Possibilities")}
            </h2>
            <section key={tag} className="mb-4 p-4 bg-muted rounded-lg">
              <h2 className="text-xl font-semibold mb-4">
                {formatText(tag.charAt(0).toUpperCase() + tag.slice(1))}
              </h2>
              <ul className="space-y-4">
                {points.map((point, index) => {
                  const { text, strength } = parsePoint(point);
                  return (
                    <li key={index} className="space-y-2">
                      <p className="text-sm">{formatText(text)}</p>
                      {strength !== null && (
                        <StrengthIndicator strength={strength} />
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        );
      case "facts":
        const facts = parseFacts(content);
        const factsToShow = showAllFacts ? facts : facts.slice(0, 4);
        return (
          <section key={tag} className="mb-4">
            <h2 className="text-xl font-semibold mb-4">
              {formatText("Facts")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {factsToShow.map((fact, index) => (
                <FactCard key={index} index={index} content={fact} />
              ))}
            </div>
            {facts.length > 4 && (
              <div className="mt-4 text-center">
                <Button
                  onClick={() => setShowAllFacts(!showAllFacts)}
                  variant="outline"
                >
                  {showAllFacts ? "Show Less" : "Show More"}
                </Button>
              </div>
            )}
          </section>
        );
      default:
        return (
          <section key={tag} className="mb-4">
            <h2 className="text-xl font-semibold mb-2">
              {formatText(tag.charAt(0).toUpperCase() + tag.slice(1))}
            </h2>
            <div className="whitespace-pre-wrap">{formatText(content)}</div>
          </section>
        );
    }
  };

  const sections = content.match(/<(\w+)>([\s\S]*?)<\/\1>/g) || [];

  return (
    <div className={className}>
      {isFactsLoading && (
        <div className="flex flex-col justify-center items-center h-32">
          <div className="w-8 h-8 mb-2">
            <XLoadingIndicator />
          </div>
          <div className="text-sm text-muted-foreground">Drafting Report...</div>
        </div>
      )}
      {sections
        .map((section) => {
          const [, tag, sectionContent] =
            section.match(/<(\w+)>([\s\S]*?)<\/\1>/) || [];
          return renderSection(tag, sectionContent.trim());
        })
        .filter(Boolean)}
    </div>
  );
};

export default ReportRenderer;
