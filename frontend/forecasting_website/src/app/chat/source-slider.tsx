import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Source } from '../types';
import { parse } from 'tldts';

interface SourceSliderProps {
  isOpen: boolean;
  onClose: () => void;
  sources: Source[];
}

const SourceSlider: React.FC<SourceSliderProps> = ({ isOpen, onClose, sources }) => {
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const getDomain = (url: string): string => {
    const parsedUrl = parse(url);
    return parsedUrl.domain || '';
  };

  const toggleExpand = (index: number) => {
    setExpandedSources(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-y-0 right-0 bg-background shadow-lg z-50 overflow-y-auto transition-all duration-300 ${isMobile ? 'w-full' : 'w-[40rem]'}`}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{sources.length} Sources</h2>
          <Button variant="ghost" onClick={onClose}>
            <X size={24} />
          </Button>
        </div>
        <div className="space-y-4">
          {sources.map((source, index) => {
            const url = source.id ?? (source.link ?? "");
            const domain = url ? getDomain(url) : "";
            const isExpanded = expandedSources[index];
            const shouldTruncate = source.summarized_content && source.summarized_content.length > 100;
            const truncatedContent = shouldTruncate
              ? source.summarized_content?.slice(0, 100)
              : source.summarized_content;

            return (
              <div key={index} className="border rounded-lg p-4 space-y-2 bg-card">
                <div className="flex items-center space-x-2">
                  {source.favicon && (
                    <Image alt="favicon" height={15} src={source.favicon} width={15} />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {domain} - Query: {source.query} - Date: {source.date}
                  </span>
                </div>
                <Link
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold hover:underline"
                >
                  {source.title ?? source.id}
                </Link>
                {source.summarized_content && (
                  <p className="text-xs text-muted-foreground">
                    {isExpanded ? source.summarized_content : truncatedContent}
                    {shouldTruncate && !isExpanded && (
                      <>
                        ...{' '}
                        <button
                          onClick={() => toggleExpand(index)}
                          className="text-primary hover:underline focus:outline-none"
                        >
                          View more
                        </button>
                      </>
                    )}
                    {isExpanded && (
                      <button
                        onClick={() => toggleExpand(index)}
                        className="ml-1 text-primary hover:underline focus:outline-none"
                      >
                        View less
                      </button>
                    )}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SourceSlider;