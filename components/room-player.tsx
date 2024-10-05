"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWebSocket } from "@/contexts/WebSocketContext";

interface PlayerProps {
  videoId: string;
  onSeek: (time: number) => void;
  onPlayPause: (isPlaying: boolean) => void;
  isAdmin: boolean;
  roomId: string;
}

export default function Player({
  videoId,
  onSeek,
  onPlayPause,
  isAdmin,
  roomId,
}: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { socket, sendMessage } = useWebSocket();
  const [isSeeking, setIsSeeking] = useState(false);

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

    fetchMediaData();
  }, [videoId]);

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "seek" && !isAdmin && !isSeeking) {
          if (audioRef.current) {
            audioRef.current.currentTime = data.time;
          }
        } else if (data.type === "play_pause" && !isAdmin) {
          setIsPlaying(data.isPlaying);
        } else if (data.type === "sync_request" && isAdmin) {
          sendMessage({
            type: "sync_response",
            roomId,
            time: audioRef.current?.currentTime || 0,
            isPlaying,
            videoId,
          });
        } else if (data.type === "sync_response" && !isAdmin) {
          if (audioRef.current) {
            audioRef.current.currentTime = data.time;
          }
          setIsPlaying(data.isPlaying);
          if (data.videoId !== videoId) {
            // Update videoId in the parent component
            onVideoChange(data.videoId);
          }
        } else if (data.type === "video_change" && !isAdmin) {
          onVideoChange(data.videoId);
        }
      };
    }
  }, [socket, isAdmin, sendMessage, roomId, isPlaying, videoId, isSeeking]);

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
  }, [isPlaying]);

  const togglePlayPause = () => {
    if (isAdmin) {
      const newIsPlaying = !isPlaying;
      setIsPlaying(newIsPlaying);
      onPlayPause(newIsPlaying);
      sendMessage({ type: "play_pause", roomId, isPlaying: newIsPlaying });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isSeeking) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
      if (isAdmin) {
        sendMessage({
          type: "seek",
          roomId,
          time: audioRef.current.currentTime,
        });
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (isAdmin && audioRef.current) {
      setIsSeeking(true);
      const newTime = value[0];
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      onSeek(newTime);
      sendMessage({ type: "seek", roomId, time: newTime });
      setTimeout(() => setIsSeeking(false), 100);
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

  const onVideoChange = (newVideoId: string) => {
    // This function should be passed from the parent component
    // to update the videoId when the admin changes the song
  };

  if (isLoading) {
    return <div className="text-center">Loading audio...</div>;
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
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
