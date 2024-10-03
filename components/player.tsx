"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Pause, Play, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Player({ videoId }: { videoId: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoplay, setAutoplay] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("autoplay") === "true";
    }
    return false;
  });
  const [isVideoMode, setIsVideoMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("isVideoMode") === "true";
    }
    return false;
  });
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMediaData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/audio?videoId=${videoId}`);
        const data = await response.json();
        setAudioUrl(data.audio.url);
        setVideoUrl(data.video.url);
        setThumbnailUrl(data.thumbnail);
        if (autoplay) {
          setIsPlaying(true);
        }
      } catch (error) {
        console.error("Error fetching media data:", error);
        setError("Failed to load media. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMediaData();
  }, [videoId, autoplay]);

  useEffect(() => {
    const mediaElement = isVideoMode ? videoRef.current : audioRef.current;
    if (mediaElement) {
      if (isPlaying) {
        mediaElement.play().catch((error) => {
          console.error("Playback was prevented:", error);
          setIsPlaying(false);
        });
      } else {
        mediaElement.pause();
      }
    }
  }, [isPlaying, isVideoMode, audioUrl, videoUrl]);

  useEffect(() => {
    const mediaElement = isVideoMode ? videoRef.current : audioRef.current;
    if (mediaElement) {
      mediaElement.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, isVideoMode]);

  useEffect(() => {
    localStorage.setItem("autoplay", autoplay.toString());
  }, [autoplay]);

  useEffect(() => {
    localStorage.setItem("isVideoMode", isVideoMode.toString());
  }, [isVideoMode]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const mediaElement = isVideoMode ? videoRef.current : audioRef.current;
    if (mediaElement) {
      setCurrentTime(mediaElement.currentTime);
      setDuration(mediaElement.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    const mediaElement = isVideoMode ? videoRef.current : audioRef.current;
    if (mediaElement) {
      mediaElement.currentTime = value[0];
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

  if (isLoading) {
    return <div className="text-center">Loading media...</div>;
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
        <h2 className="text-2xl font-bold ml-2">Now Playing</h2>
      </div>
      {isVideoMode
        ? videoUrl && (
            <video
              ref={videoRef}
              src={videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              autoPlay={autoplay}
              className="w-full rounded-lg"
              controls={false}
            />
          )
        : thumbnailUrl && (
            <div className="mb-4">
              <Image
                src={thumbnailUrl}
                alt="Video thumbnail"
                width={640}
                height={360}
                className="rounded-lg w-full"
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
      <div className="flex items-center justify-between mb-4">
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
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="autoplay"
            checked={autoplay}
            onCheckedChange={setAutoplay}
          />
          <Label htmlFor="autoplay">Autoplay</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="videoMode"
            checked={isVideoMode}
            onCheckedChange={setIsVideoMode}
          />
          <Label htmlFor="videoMode">Video Mode</Label>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
