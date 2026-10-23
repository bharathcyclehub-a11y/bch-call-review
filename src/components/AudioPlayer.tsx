"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, FastForward } from "lucide-react";

interface AudioPlayerProps {
  url: string;
  durationSeconds: number;
  callId: string;
}

export default function AudioPlayer({ url, durationSeconds, callId }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Global listener: when another player plays, pause this one
  useEffect(() => {
    const handleOtherPlay = (e: CustomEvent) => {
      if (e.detail !== callId && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener("bch-audio-play" as any, handleOtherPlay as any);
    return () => {
      window.removeEventListener("bch-audio-play" as any, handleOtherPlay as any);
    };
  }, [callId]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      // Notify other players to pause
      window.dispatchEvent(new CustomEvent("bch-audio-play", { detail: callId }));
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Audio playback error:", err);
          setIsLoading(false);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const skipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const effectiveDuration = durationSeconds || (audioRef.current?.duration ? audioRef.current.duration : 0);

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
      <audio
        ref={audioRef}
        src={url}
        preload="none"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setIsLoading(false);
          setIsPlaying(false);
        }}
      />

      <div className="flex items-center justify-between gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          type="button"
          disabled={isLoading}
          className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md ${
            isPlaying
              ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
              : "bg-emerald-600 text-white hover:bg-emerald-500"
          }`}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        {/* Scrubber slider & timestamps */}
        <div className="flex-1 flex flex-col gap-1">
          <input
            type="range"
            min={0}
            max={effectiveDuration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(effectiveDuration)}</span>
          </div>
        </div>

        {/* Controls: Skip back 10s & Speed cycle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={skipBack}
            type="button"
            title="Rewind 10 seconds"
            className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs active:scale-90"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={cyclePlaybackRate}
            type="button"
            title="Playback Speed"
            className="h-8 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs flex items-center justify-center active:scale-90 border border-slate-700"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}
