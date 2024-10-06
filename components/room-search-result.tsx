"use client";

import axios from "axios";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

interface SearchResult {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: { default: { url: string } };
    channelTitle: string;
  };
}

interface SearchResultsProps {
  query: string;
  onVideoSelect: (videoId: string, videoTitle: string) => void;
}

export default function SearchResults({
  query,
  onVideoSelect,
}: SearchResultsProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      setIsLoading(true);
      setError(null);
      try {
        const newQuery = query.toLowerCase().replace(/\s+/g, "-");
        const response = await axios.get(
          `https://www.googleapis.com/youtube/v3/search`,
          {
            params: {
              part: "snippet",
              q: newQuery,
              key: YOUTUBE_API_KEY,
              type: "video",
              maxResults: 20,
            },
          }
        );
        setResults(response.data.items);
      } catch (err) {
        console.error("Search error:", err);
        setError("An error occurred while fetching results. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const renderSkeletonItem = () => (
    <div className="flex items-start space-x-4 mb-4 mr-4 p-2 rounded-lg border">
      <Skeleton className="w-[90px] h-[68px] rounded-md" />
      <div className="flex-1">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-3 w-2/3 mb-1" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="bg-background shadow-lg rounded-lg p-2 h-full">
        <ScrollArea className="h-full">
          {[...Array(6)].map((_, index) => (
            <React.Fragment key={index}>{renderSkeletonItem()}</React.Fragment>
          ))}
        </ScrollArea>
      </div>
    );
  }

  if (error) return <div>{error}</div>;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4">
        {results.map((result) => (
          <div
            key={result.id.videoId}
            className="flex items-start space-x-4 p-4 border-2 shadow rounded-lg cursor-pointer hover:bg-muted"
            onClick={() =>
              onVideoSelect(result.id.videoId, result.snippet.title)
            }
          >
            <Image
              src={result.snippet.thumbnails.default.url}
              alt={result.snippet.title}
              width={120}
              height={90}
              className="rounded"
            />
            <div>
              <h3 className="font-semibold">{result.snippet.title}</h3>
              <p className="text-sm text-gray-500">
                {result.snippet.channelTitle}
              </p>
              <p className="text-sm mt-2">{result.snippet.description}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
