"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { Progress } from "@/components/ui/progress";

interface HlsPlayerProps {
  lessonId: string;
  onProgress?: (seconds: number, completed: boolean) => void;
  initialPosition?: number;
}

export function HlsPlayer({
  lessonId,
  onProgress,
  initialPosition = 0,
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buffered, setBuffered] = useState(0);
  const [watermark, setWatermark] = useState("");

  const saveProgress = useCallback(
    async (watchedSeconds: number, completed: boolean) => {
      onProgress?.(watchedSeconds, completed);
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, watchedSeconds, completed }),
      });
    },
    [lessonId, onProgress]
  );

  useEffect(() => {
    let hls: Hls | null = null;

    async function init() {
      try {
        const res = await fetch("/api/video/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to load video");
        }

        const { manifestUrl, watermark: wm } = await res.json();
        setWatermark(wm ?? "");

        const video = videoRef.current;
        if (!video) return;

        if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            xhrSetup: (xhr) => {
              xhr.withCredentials = true;
            },
          });
          hlsRef.current = hls;
          hls.loadSource(manifestUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (initialPosition > 0) {
              video.currentTime = initialPosition;
            }
            setLoading(false);
          });
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) setError("Playback error");
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = manifestUrl;
          video.addEventListener("loadedmetadata", () => {
            if (initialPosition > 0) video.currentTime = initialPosition;
            setLoading(false);
          });
        } else {
          setError("HLS not supported in this browser");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
        setLoading(false);
      }
    }

    init();

    return () => {
      hls?.destroy();
    };
  }, [lessonId, initialPosition]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const interval = setInterval(() => {
      if (video.duration) {
        setBuffered((video.currentTime / video.duration) * 100);
      }
    }, 500);

    const onEnded = () => {
      saveProgress(Math.floor(video.duration), true);
    };

    const onPause = () => {
      saveProgress(Math.floor(video.currentTime), false);
    };

    video.addEventListener("ended", onEnded);
    video.addEventListener("pause", onPause);

    return () => {
      clearInterval(interval);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("pause", onPause);
    };
  }, [saveProgress]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950 text-red-400">
          {error}
        </div>
      )}
      <video
        ref={videoRef}
        className="h-full w-full"
        controls
        playsInline
        controlsList="nodownload"
      />
      {watermark && (
        <div className="pointer-events-none absolute bottom-16 right-4 text-xs text-white/30 select-none">
          {watermark}
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-2">
        <Progress value={buffered} className="h-0.5" />
      </div>
    </div>
  );
}
