import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { Skeleton } from "./ui/skeleton";

interface RelatedVideo {
  id: string;
  title: string;
  thumbnails: { url: string; width: number; height: number }[];
  author: { name: string };
  published: string;
}

interface RelatedVideosProps {
  videos: RelatedVideo[];
  isLoading?: boolean;
}

export default function RelatedVideos({
  videos,
  isLoading = false,
}: RelatedVideosProps) {
  const router = useRouter();

  const handleRelatedVideoClick = (id: string) => {
    if (id && /^[a-zA-Z0-9-_]{11}$/.test(id)) {
      router.push(`/player/${id}`);
    } else {
      console.error(`Invalid video ID: ${id}`);
    }
  };

  const renderSkeletonItem = () => (
    <div className="flex items-start space-x-4 mb-4 mr-4 p-2 rounded-lg">
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
      <div className="bg-background border shadow-lg rounded-lg p-4 h-full">
        <Skeleton className="h-8 w-40 mb-4" />
        <ScrollArea className="h-[calc(100vh-200px)]">
          {[...Array(5)].map((_, index) => (
            <React.Fragment key={index}>{renderSkeletonItem()}</React.Fragment>
          ))}
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="bg-background border shadow-lg rounded-lg p-4 h-full">
      <h3 className="text-xl font-semibold mb-4">Related Videos</h3>
      <ScrollArea className="h-[calc(100vh-200px)]">
        {videos.map((video) => (
          <div
            key={video.id}
            className="flex items-start space-x-4 mb-4 mr-4 p-2 rounded-lg cursor-pointer hover:bg-muted"
            onClick={() => handleRelatedVideoClick(video.id)}
          >
            <Image
              src={video.thumbnails[0]?.url || "/placeholder.svg"}
              alt={video.title}
              width={90}
              height={68}
              className="rounded-md pt-2"
            />
            <div>
              <h4 className="font-medium line-clamp-2">{video.title}</h4>
              <p className="text-sm text-muted-foreground">
                {video.author.name}
              </p>
              <p className="text-sm text-muted-foreground">{video.published}</p>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
