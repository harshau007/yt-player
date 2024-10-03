"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

export default function Search() {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (query.length > 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(query);
      }, 300);
    } else {
      setSuggestions([]);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const fetchSuggestions = async (input: string) => {
    try {
      const response = await axios.get(
        `https://invidious.jing.rocks/api/v1/search/suggestions?q=${encodeURIComponent(
          input
        )}`
      );
      setSuggestions(response.data.suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 3) return;
    setIsLoading(true);
    setError(null);
    setShowSuggestions(false);
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          params: {
            part: "snippet",
            q: searchQuery.replace(/\s+/g, "-"),
            key: YOUTUBE_API_KEY,
            type: "video",
            maxResults: 20,
          },
        }
      );
      router.push(
        `/results?q=${encodeURIComponent(searchQuery.replace(/\s+/g, "-"))}`
      );
    } catch (err) {
      console.error("Search error:", err);
      setError("An error occurred while searching. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="relative">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Search for music..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch(query)}
            className="flex-grow"
          />
          <Button onClick={() => handleSearch(query)} disabled={isLoading}>
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-background border border-input rounded-md shadow-lg">
            <Command className="rounded-lg border shadow-md">
              {/* <CommandInput placeholder="Type a command or search..." /> */}
              <CommandList className="max-h-[300px] overflow-y-auto">
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                  {suggestions.map((suggestion, index) => (
                    <CommandItem
                      key={index}
                      onSelect={() => {
                        setQuery(suggestion);
                        handleSearch(suggestion);
                      }}
                    >
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        )}
      </div>
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
