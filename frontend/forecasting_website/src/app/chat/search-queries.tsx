// SearchQueries.tsx
import React, { useState } from 'react';
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";

interface SearchQueriesProps {
  queries: string[];
}

const SearchQueries: React.FC<SearchQueriesProps> = ({ queries }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const displayedQueries = isExpanded ? queries : queries.slice(0, 3);

  return (
    <div className="mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
      <p className="flex items-center text-sm font-semibold mb-2">
        <MagnifyingGlassIcon className="mr-2 size-4" /> Search Queries
      </p>
      <ul className="list-disc pl-5 mb-2">
        {displayedQueries.map((query, index) => (
          <li key={index} className="text-xs mb-1 text-gray-700 dark:text-gray-300">
            {query}
          </li>
        ))}
      </ul>
      {queries.length > 3 && (
        <div className="flex justify-start items-center text-xs">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary hover:underline focus:outline-none"
          >
            {isExpanded ? (
              <span className="flex items-center">
                Show less <ChevronUpIcon className="ml-1 size-3" />
              </span>
            ) : (
              <span className="flex items-center">
                Show {queries.length - 3} more <ChevronDownIcon className="ml-1 size-3" />
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchQueries;