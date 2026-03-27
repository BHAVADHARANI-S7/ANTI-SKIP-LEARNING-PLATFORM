import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
} from "lucide-react";

interface VideoPlayerProps {
  src: string;
  title: string;
  onComplete: () => void;
}

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const VideoPlayer = ({ src, title, onComplete }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [maxWatched, setMaxWatched] = useState(0);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimerRef.current);
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (!isSeeking) setCurrentTime(video.currentTime);
      setMaxWatched(prev => Math.max(prev, video.currentTime));
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onLoaded = () => setDuration(video.duration);
    const onEnded = () => { setIsPlaying(false); setShowControls(true); onComplete(); };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => { setIsPlaying(false); setShowControls(true); };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("ended", onEnded);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [onComplete, isSeeking]);

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      switch (e.key) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "ArrowLeft": e.preventDefault(); video.currentTime = Math.max(0, video.currentTime - 10); break;
        case "ArrowRight": e.preventDefault(); video.currentTime = Math.min(maxWatched, video.currentTime + 10); break;
        case "ArrowUp": e.preventDefault(); changeVolume(Math.min(1, volume + 0.1)); break;
        case "ArrowDown": e.preventDefault(); changeVolume(Math.max(0, volume - 0.1)); break;
        case "m": toggleMute(); break;
        case "f": toggleFullscreen(); break;
      }
      showControlsTemporarily();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isPlaying, volume, duration, showControlsTemporarily]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const changeVolume = (val: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = val;
    setVolume(val);
    if (val > 0 && isMuted) { video.muted = false; setIsMuted(false); }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTo = ratio * duration;
    // Only allow seeking up to max watched time
    const clampedTime = Math.min(seekTo, maxWatched);
    video.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  };

  const changeSpeed = (s: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = s;
    setSpeed(s);
    setShowSpeedMenu(false);
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const target = video.currentTime + seconds;
    // Forward skip limited to maxWatched, backward is free
    video.currentTime = Math.max(0, seconds > 0 ? Math.min(maxWatched, target) : Math.min(duration, target));
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    document.fullscreenElement ? document.exitFullscreen() : container.requestFullscreen();
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0;
  const maxWatchedPercent = duration ? (maxWatched / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl overflow-hidden bg-black group select-none"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        className="w-full aspect-video cursor-pointer"
        onClick={togglePlay}
        onContextMenu={(e) => e.preventDefault()}
        playsInline
      />

      {/* Center Play/Pause overlay */}
      <AnimatePresence>
        {!isPlaying && showControls && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg backdrop-blur-sm">
              <Play className="w-7 h-7 text-primary-foreground ml-1" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Title bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent"
          >
            <p className="text-white text-sm font-medium truncate">{title}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 px-4 pb-3"
          >
            {/* Progress bar */}
            <div
              className="w-full h-1.5 bg-white/20 rounded-full mb-3 cursor-pointer group/progress relative hover:h-2.5 transition-all"
              onClick={handleSeek}
              onMouseDown={() => setIsSeeking(true)}
              onMouseUp={() => setIsSeeking(false)}
            >
              {/* Watched limit indicator */}
              <div
                className="absolute top-0 left-0 h-full bg-white/25 rounded-full"
                style={{ width: `${maxWatchedPercent}%` }}
              />
              {/* Buffered (only within watched range) */}
              <div
                className="absolute top-0 left-0 h-full bg-white/15 rounded-full"
                style={{ width: `${Math.min(bufferedPercent, maxWatchedPercent)}%` }}
              />
              {/* Progress */}
              <div
                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-[width] duration-100"
                style={{ width: `${progress}%` }}
              />
              {/* Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-primary rounded-full shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity"
                style={{ left: `calc(${progress}% - 7px)` }}
              />
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button onClick={togglePlay} className="p-1.5 text-white hover:text-primary transition-colors">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>

                <button onClick={() => skip(-10)} className="p-1.5 text-white/70 hover:text-white transition-colors">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button onClick={() => skip(10)} className="p-1.5 text-white/70 hover:text-white transition-colors">
                  <SkipForward className="w-4 h-4" />
                </button>

                {/* Volume */}
                <button onClick={toggleMute} className="p-1.5 text-white/70 hover:text-white transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  className="w-16 h-1 accent-primary cursor-pointer"
                />

                {/* Time */}
                <span className="text-xs text-white/80 ml-2 tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Speed */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="px-2 py-1 text-xs text-white/70 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    {speed}x
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-card/95 backdrop-blur-md border border-border rounded-lg p-1 shadow-xl min-w-[80px]">
                      {SPEEDS.map((s) => (
                        <button
                          key={s}
                          onClick={() => changeSpeed(s)}
                          className={`w-full text-left px-3 py-1.5 text-xs rounded transition-colors ${
                            s === speed ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen */}
                <button onClick={toggleFullscreen} className="p-1.5 text-white/70 hover:text-white transition-colors">
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoPlayer;
