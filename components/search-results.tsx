"use client";

import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function SearchResults({ query }: { query: string }) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // query = query.split(" ", )
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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <div
          key={result.id.videoId}
          className="flex items-start space-x-4 p-4 border-2 shadow rounded-lg cursor-pointer "
          onClick={() => router.push(`/player/${result.id.videoId}`)}
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
  );
}
