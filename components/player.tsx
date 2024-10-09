"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  ChevronLeft,
  Download,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "./ui/skeleton";

interface PlayerProps {
  videoId: string;
}

export default function Player({ videoId }: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [autoplay, setAutoplay] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("autoplay") === "true";
    }
    return false;
  });
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMediaData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/audio?videoId=${videoId}`);
        const data = await response.json();
        setAudioUrl(data.audio.url);
        setThumbnailUrl(data.thumbnail);
        setTitle(data.title);
        if (autoplay) {
          setIsPlaying(true);
        }
      } catch (error) {
        console.error("Error fetching media data:", error);
        setError("Failed to load audio. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMediaData();
  }, [videoId, autoplay]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error("Playback was prevented:", error);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    localStorage.setItem("autoplay", autoplay.toString());
  }, [autoplay]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleBackClick = () => {
    router.push("/");
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      const response = await fetch(`/api/download?videoId=${videoId}`);
      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      const filename = title.trim()
        ? `${title.toLowerCase().replaceAll(" ", "-")}.mp3`
        : "audio.mp3";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading audio:", error);
      setError("Failed to download audio. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAutoplayChange = (checked: boolean) => {
    setAutoplay(checked);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center mt-10">
        <div className="bg-background shadow-lg rounded-lg p-4 w-full max-w-[650px]">
          <div className="flex items-center mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-48 ml-2" />
          </div>
          <Skeleton className="h-[300px] w-full rounded-lg mb-4" />
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-10" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-6 w-10 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="bg-background shadow-lg rounded-lg p-4">
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBackClick}
          aria-label="Go back to home"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h2 className="text-xl font-bold ml-2 truncate">{title}</h2>
      </div>
      {thumbnailUrl && (
        <div className="flex items-center justify-center mb-2">
          <Image
            src={thumbnailUrl}
            alt="Audio thumbnail"
            width={100}
            height={80}
            quality={100}
            className="rounded-lg w-[100%]"
            unoptimized
            priority
          />
        </div>
      )}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          autoPlay={autoplay}
        />
      )}
      <div className="flex items-center justify-between mb-4 mt-4">
        <Button
          onClick={togglePlayPause}
          size="icon"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </Button>
        <div className="flex items-center space-x-2">
          <Button
            onClick={toggleMute}
            size="icon"
            variant="ghost"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-24"
            aria-label="Volume"
          />
        </div>
      </div>
      <Slider
        value={[currentTime]}
        max={duration}
        step={0.1}
        onValueChange={handleSeek}
        className="mb-2"
        aria-label="Seek"
      />
      <div className="flex justify-between text-sm text-muted-foreground mb-4">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="autoplay"
            checked={autoplay}
            onCheckedChange={handleAutoplayChange}
          />
          <Label htmlFor="autoplay">Autoplay</Label>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading}
          aria-label="Download audio"
        >
          {isDownloading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Downloading...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download MP3
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
