"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "./ui/skeleton";

interface PlayerProps {
  initialVideoId: string;
  onSeek: (time: number) => void;
  onPlayPause: (isPlaying: boolean) => void;
  isAdmin: boolean;
  roomId: string;
  initialIsPlaying: boolean;
  initialCurrentTime: number;
}

const CLOCK_DRIFT_THRESHOLD = 0.5; // 500ms threshold for clock drift
const MAX_PLAYBACK_RATE = 1.1;
const MIN_PLAYBACK_RATE = 0.9;

export default function Player({
  initialVideoId,
  onSeek,
  onPlayPause,
  isAdmin,
  roomId,
  initialIsPlaying,
  initialCurrentTime,
}: PlayerProps) {
  const [videoId, setVideoId] = useState(initialVideoId);
  const [isPlaying, setIsPlaying] = useState(initialIsPlaying);
  const [currentTime, setCurrentTime] = useState(initialCurrentTime);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { socket, sendMessage, latency, sendPing } = useWebSocket();
  const syncIntervalRef = useRef<NodeJS.Timeout>();

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
      } catch (error) {
        console.error("Error fetching media data:", error);
        setError("Failed to load audio. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (videoId) {
      fetchMediaData();
    }
  }, [videoId]);

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "seek" && !isAdmin) {
          handleRemoteSeek(data.time);
        } else if (data.type === "play_pause" && !isAdmin) {
          handleRemotePlayPause(data.isPlaying);
        } else if (data.type === "sync_response" && !isAdmin) {
          handleSyncResponse(data);
        } else if (data.type === "video_change") {
          handleVideoChange(data.videoId);
        } else if (data.type === "autoplay_change" && !isAdmin) {
          setAutoplay(data.autoplay);
        }
      };
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [socket, isAdmin, sendMessage, roomId, isPlaying, videoId]);

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

    // Set up sync interval for admin
    if (isAdmin && isPlaying) {
      syncIntervalRef.current = setInterval(sendSyncResponse, 1000);
    } else if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isPlaying, isAdmin]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = initialCurrentTime;
    }
  }, [initialCurrentTime]);

  useEffect(() => {
    if (autoplay && audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(console.error);
    }
  }, [autoplay]);

  // Periodic latency measurement
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (!isAdmin) {
        sendPing();
      }
    }, 5000);

    return () => clearInterval(pingInterval);
  }, [isAdmin, sendPing]);

  const togglePlayPause = () => {
    if (isAdmin) {
      const newIsPlaying = !isPlaying;
      setIsPlaying(newIsPlaying);
      onPlayPause(newIsPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (isAdmin && audioRef.current) {
      const newTime = value[0];
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      onSeek(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const handleRemoteSeek = (time: number) => {
    if (audioRef.current) {
      const adjustedTime = time + latency / 1000;
      audioRef.current.currentTime = adjustedTime;
    }
  };

  const handleRemotePlayPause = (shouldPlay: boolean) => {
    setIsPlaying(shouldPlay);
    if (audioRef.current) {
      if (shouldPlay) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  };

  const sendSyncResponse = () => {
    if (audioRef.current) {
      sendMessage({
        type: "sync_response",
        roomId,
        time: audioRef.current.currentTime,
        isPlaying,
        videoId,
        autoplay,
      });
    }
  };

  const handleSyncResponse = (data: any) => {
    if (audioRef.current) {
      const localTime = audioRef.current.currentTime;
      const serverTime = data.time + latency / 1000; // Adjust for latency
      const timeDiff = serverTime - localTime;

      if (Math.abs(timeDiff) > CLOCK_DRIFT_THRESHOLD) {
        // Large difference, adjust immediately
        audioRef.current.currentTime = serverTime;
      } else {
        // Small difference, adjust gradually
        const adjustment = timeDiff / 2; // Adjust over 2 seconds
        const newRate = 1 + adjustment;
        audioRef.current.playbackRate = Math.max(
          MIN_PLAYBACK_RATE,
          Math.min(MAX_PLAYBACK_RATE, newRate)
        );

        // Reset playback rate after adjustment
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.playbackRate = 1;
          }
        }, 2000);
      }

      setIsPlaying(data.isPlaying);
      setAutoplay(data.autoplay);
    }
  };

  const handleVideoChange = (newVideoId: string) => {
    setVideoId(newVideoId);
    setCurrentTime(0);
  };

  const handleAutoplayChange = (newAutoplay: boolean) => {
    if (isAdmin) {
      setAutoplay(newAutoplay);
      sendMessage({
        type: "autoplay_change",
        roomId,
        autoplay: newAutoplay,
      });
    }
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
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-10 rounded-full" />
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
      <h2 className="text-2xl font-bold mb-4 truncate">{title}</h2>
      {thumbnailUrl && (
        <div className="mb-4">
          <Image
            src={thumbnailUrl}
            alt="Audio thumbnail"
            width={360}
            height={80}
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
        />
      )}
      <div className="flex items-center justify-between mb-4">
        <Button
          onClick={togglePlayPause}
          size="icon"
          aria-label={isPlaying ? "Pause" : "Play"}
          disabled={!isAdmin}
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
        disabled={!isAdmin}
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      {isAdmin && (
        <div className="flex items-center space-x-2 mt-4">
          <Switch
            id="autoplay"
            checked={autoplay}
            onCheckedChange={handleAutoplayChange}
          />
          <Label htmlFor="autoplay">Autoplay</Label>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
