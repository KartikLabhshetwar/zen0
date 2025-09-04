"use client";

import React from 'react';
import { Search, ExternalLink, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning';
import { Sources, SourcesTrigger, SourcesContent, Source } from '@/components/ai-elements/sources';
import { Response } from '@/components/ai-elements/response';
import { Markdown } from '@/components/ui/markdown';

interface WebSearchMessageProps {
  message: {
    role: "user" | "assistant" | "system";
    content: string | Array<{
      type: "text" | "image_url";
      text?: string;
      image_url?: { url: string };
    }>;
    created_at?: string;
    metadata?: Record<string, any>;
    reasoning?: string;
  };
  sources?: string[];
  toolCalls?: any[];
  className?: string;
}

export function WebSearchMessage({ 
  message,
  sources = [],
  toolCalls = [],
  className 
}: WebSearchMessageProps) {
  const content = typeof message.content === 'string' ? message.content : 'Web search response';
  const hasReasoning = message.reasoning || toolCalls.length > 0;
  const hasSources = sources.length > 0;

  // Helper function to get domain from URL
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  // Helper function to get site info dynamically
  const getSiteInfo = (url: string) => {
    const domain = getDomain(url);
    return { 
      name: domain, 
      color: 'text-gray-600' 
    };
  };

  return (
    <div className={cn("w-full max-w-full", className)}>
      <div className="max-w-[75%] sm:max-w-[60%] md:max-w-[55%] text-foreground bg-background/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 overflow-hidden break-words">
        {/* Web Search Header */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">Web Search Result</span>
        </div>

        {/* Reasoning Section - Show at the top */}
        {hasReasoning && (
          <div className="mb-4">
            <Reasoning>
              <ReasoningTrigger />
              <ReasoningContent>
                {message.reasoning || `Tools Used: ${toolCalls.map(tc => tc.tool || tc.name).join(', ')}`}
              </ReasoningContent>
            </Reasoning>
          </div>
        )}

        {/* Main Content */}
        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:mb-3 last:prose-p:mb-0">
          <Markdown>{content}</Markdown>
        </div>

        {/* Sources Section - Enhanced display */}
        {hasSources && (
          <div className="mt-4">
            <Sources>
              <SourcesTrigger count={sources.length} />
              <SourcesContent>
                <div className="grid gap-3">
                  {sources.map((source, index) => {
                    const siteInfo = getSiteInfo(source);
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("text-sm font-medium", siteInfo.color)}>
                              {siteInfo.name}
                            </span>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </div>
                          <a
                            href={source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 break-all"
                          >
                            {source}
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SourcesContent>
            </Sources>
          </div>
        )}
      </div>
    </div>
  );
}