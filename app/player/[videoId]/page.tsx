"use client";

import Player from "@/components/player";
import RelatedVideos from "@/components/related-videos";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";

interface RelatedVideo {
  id: string;
  title: string;
  thumbnails: { url: string; width: number; height: number }[];
  author: { name: string };
  published: string;
}

export default function PlayerPage({
  params,
}: {
  params: { videoId: string };
}) {
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedVideos = async () => {
      try {
        const response = await fetch(`/api/audio?videoId=${params.videoId}`);
        const data = await response.json();
        setRelatedVideos(data.related);
      } catch (error) {
        console.error("Error fetching related videos:", error);
        setError("Failed to load related videos. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedVideos();
  }, [params.videoId]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-2/3">
          <Player videoId={params.videoId} />
        </div>
        <div className="w-full lg:w-1/3 mt-4 lg:mt-0">
          <RelatedVideos videos={relatedVideos} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
