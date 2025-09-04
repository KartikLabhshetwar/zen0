"use client";

import React, { useState } from 'react';
import { WebSearchMessage } from '@/components/web-search';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebSearchIntegrationProps {
  messageId: string;
  onWebSearchComplete?: (result: any) => void;
  className?: string;
}

export function WebSearchIntegration({ 
  messageId, 
  onWebSearchComplete,
  className 
}: WebSearchIntegrationProps) {
  const [isWebSearching, setIsWebSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleWebSearch = (query: string) => {
    setSearchQuery(query);
    setIsWebSearching(true);
  };

  const handleSearchComplete = (result: any) => {
    setIsWebSearching(false);
    onWebSearchComplete?.(result);
  };

  const cancelSearch = () => {
    setIsWebSearching(false);
    setSearchQuery('');
  };

  return (
    <div className={cn("space-y-2", className)}>
      {!isWebSearching ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const query = prompt('Enter your web search query:');
              if (query) {
                handleWebSearch(query);
              }
            }}
            className="text-xs"
          >
            <Search className="h-3 w-3 mr-1" />
            Web Search
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Searching: "{searchQuery}"
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelSearch}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <WebSearchMessage
            query={searchQuery}
            onComplete={handleSearchComplete}
            className="border-l-2 border-blue-500 pl-3"
          />
        </div>
      )}
    </div>
  );
}
