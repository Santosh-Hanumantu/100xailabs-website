"use client";

import { useEffect, useRef, useState } from "react";

type ControlMode = "hidden" | "play" | "replay";

// How often to resample the video's average color (ms). Paired with a short
// CSS transition (see globals.css) so the background tracks fast scene
// changes closely instead of visibly lagging behind them.
const AMBIENT_SAMPLE_INTERVAL_MS = 100;
// Downscaled sampling size — only the average matters, not detail, so this
// stays tiny on purpose for performance.
const AMBIENT_SAMPLE_WIDTH = 32;
const AMBIENT_SAMPLE_HEIGHT = 18;

// REQ-022: six versions of the same intro were cut for six different screen
// shapes (not just one landscape video cropped to fit) — so a tall phone
// screen gets a video actually composed for tall/portrait viewing instead of
// object-fit:cover cropping the sides off a landscape source. Each entry's
// `ratio` is that file's width / height.
const ASPECT_SOURCES: { name: string; ratio: number }[] = [
  { name: "hero-phone-9x16", ratio: 9 / 16 }, // phones held upright
  { name: "hero-tablet-3x4", ratio: 3 / 4 }, // tablets upright
  { name: "hero-square-1x1", ratio: 1 }, // small/squarish windows
  { name: "hero-tablet-4x3", ratio: 4 / 3 }, // tablets sideways
  { name: "hero-desktop-16x9", ratio: 16 / 9 }, // laptops, desktops, phones sideways
  { name: "hero-ultrawide-21x9", ratio: 21 / 9 }, // ultra-wide monitors
];

/** Which ASPECT_SOURCES entry is the closest shape match for `ratio`. */
function pickAspectSource(ratio: number) {
  let best = ASPECT_SOURCES[0];
  let bestDiff = Infinity;
  for (const candidate of ASPECT_SOURCES) {
    // Comparing the logs (rather than the raw ratios) means a screen twice
    // as wide as it is tall and a screen twice as tall as it is wide are
    // equally "far" from a 1:1 square source — the ratio scale is naturally
    // multiplicative, not additive.
    const diff = Math.abs(Math.log(ratio / candidate.ratio));
    if (diff < bestDiff) {
      bestDiff = diff;
      best = candidate;
    }
  }
  return best;
}

/**
 * Phase 1 homepage video (Section 7 of the project spec doc).
 *
 * - Attempts muted autoplay on mount; if the browser blocks it, or the
 *   visitor's OS has "reduce motion" on, falls back to a Play button
 *   (REQ-006/accessibility).
 * - Shows a Replay button once the video finishes (REQ-009).
 * - The control is conditionally RENDERED, not just visually hidden, so
 *   there's no CSS-specificity trap like the one the static build had
 *   (a `display` rule on the button class beating the `hidden` attribute).
 */
export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<ControlMode>("hidden");
  // Browsers only ever allow autoplay when muted — there's no way around
  // that, so the video always starts silent. This lets a visitor turn
  // sound on afterward with a real click, which browsers do allow.
  const [isMuted, setIsMuted] = useState(true);

  // Ambient background: continuously sample the video's average color while
  // it's playing and push it onto the page as a CSS variable, so the
  // background tracks the video instead of staying a fixed white/gray.
  // Sampling naturally pauses (and the color freezes) when the video is
  // paused or has ended, since we skip the read in that case.
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let rafId: number;
    let lastSampleTime = 0;

    function sampleAmbientColor(timestamp: number) {
      rafId = requestAnimationFrame(sampleAmbientColor);

      // TypeScript can't carry the `if (!video) return` narrowing above into
      // this nested function (it can't prove `video` wasn't reassigned by
      // the time this runs asynchronously via requestAnimationFrame), so it
      // needs its own explicit null check even though we know it's set.
      if (!video) return;
      if (video.paused || video.ended || video.readyState < 2) return;
      if (timestamp - lastSampleTime < AMBIENT_SAMPLE_INTERVAL_MS) return;
      lastSampleTime = timestamp;

      try {
        ctx.drawImage(video, 0, 0, AMBIENT_SAMPLE_WIDTH, AMBIENT_SAMPLE_HEIGHT);
        const { data } = ctx.getImageData(
          0,
          0,
          AMBIENT_SAMPLE_WIDTH,
          AMBIENT_SAMPLE_HEIGHT
        );

        let r = 0;
        let g = 0;
        let b = 0;
        const pixelCount = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        r = Math.round(r / pixelCount);
        g = Math.round(g / pixelCount);
        b = Math.round(b / pixelCount);

        document.documentElement.style.setProperty(
          "--ambient-color",
          `rgb(${r}, ${g}, ${b})`
        );
      } catch {
        // A future cross-origin video source would taint the canvas and
        // throw here — fail quietly and just keep the last known color
        // rather than breaking playback over a background effect.
      }
    }

    rafId = requestAnimationFrame(sampleAmbientColor);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // REQ-022: picks the best-matching of the six aspect-ratio video files for
  // the current window shape (not just its width), and re-picks on resize
  // or phone rotation. The source is assigned imperatively via video.src
  // rather than a static <source> child, mirroring how the video vendor's
  // own reference snippet does it, since React's declarative <source> can't
  // easily be swapped on the fly without also fighting for control of
  // playback position.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let currentSourceName = "";

    function loadBestSource() {
      if (!video) return;
      const ratio = window.innerWidth / window.innerHeight;
      const best = pickAspectSource(ratio);
      if (best.name === currentSourceName) return;

      // Preserve playback position/state across the swap so a phone
      // rotation mid-play doesn't restart the video from the beginning.
      const resumeTime = video.currentTime || 0;
      const wasPlaying = !video.paused && !video.ended;

      currentSourceName = best.name;
      video.poster = `/images/${best.name}.jpg`;
      video.src = `/videos/${best.name}.mp4`;

      const handleLoadedMetadata = () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        if (resumeTime > 0 && resumeTime < video.duration - 0.2) {
          video.currentTime = resumeTime;
        }
        if (wasPlaying) {
          video.play().catch(() => setMode("play"));
        }
      };
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
    }

    const handlePlay = () => setMode("hidden");
    const handleEnded = () => setMode("replay");

    video.addEventListener("play", handlePlay);
    video.addEventListener("ended", handleEnded);

    // Pick the right file for this screen before the very first play.
    loadBestSource();

    if (prefersReducedMotion) {
      setMode("play");
    } else {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => setMode("play"));
      }
    }

    // Covers both a browser window being resized and a phone being rotated
    // (some mobile browsers only fire one of the two reliably).
    window.addEventListener("resize", loadBestSource);
    window.addEventListener("orientationchange", loadBestSource);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("ended", handleEnded);
      window.removeEventListener("resize", loadBestSource);
      window.removeEventListener("orientationchange", loadBestSource);
    };
  }, []);

  function handleControlClick() {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setMode("hidden");
    video.play();
  }

  function handleToggleMute() {
    setIsMuted((muted) => !muted);
  }

  const isReplay = mode === "replay";
  const showButton = mode !== "hidden";

  return (
    <div className="hero-video-wrap" id="heroVideoWrap">
      <video
        ref={videoRef}
        className="hero-video"
        // A sensible default so something shows before the aspect-picking
        // effect runs (or if JS is ever unavailable) — replaced within a
        // frame or two by the poster/src that actually match the screen.
        poster="/images/hero-desktop-16x9.jpg"
        muted={isMuted}
        // playsInline is the one that matters most for iOS Safari — without
        // it, iPhones ignore autoplay entirely and blow the video up into
        // fullscreen the moment it starts. No static <source> here — the
        // effect above assigns video.src once it knows the screen's shape,
        // so we're not fetching a source guess only to immediately discard
        // it in favor of the right one.
        playsInline
        disablePictureInPicture
        preload="auto"
        aria-label="100x AI Labs introduction video"
      >
        Your browser does not support embedded video.
      </video>

      {/* Off-screen sampling canvas for the ambient background effect —
          never shown, just read from. */}
      <canvas
        ref={canvasRef}
        width={AMBIENT_SAMPLE_WIDTH}
        height={AMBIENT_SAMPLE_HEIGHT}
        aria-hidden="true"
        style={{ display: "none" }}
      />

      {showButton && (
        <button
          type="button"
          className="video-control-btn"
          aria-label={isReplay ? "Replay video" : "Play video"}
          onClick={handleControlClick}
        >
          {isReplay ? <ReplayIcon /> : <PlayIcon />}
          <span>{isReplay ? "Replay" : "Play"}</span>
        </button>
      )}

      {/* Always available, independent of Play/Replay — autoplay is muted
          by browser policy, so this is the only way sound ever turns on. */}
      <button
        type="button"
        className="mute-toggle-btn"
        aria-label={isMuted ? "Unmute video" : "Mute video"}
        onClick={handleToggleMute}
      >
        {isMuted ? <MutedIcon /> : <UnmutedIcon />}
      </button>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg className="btn-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  );
}

function ReplayIcon() {
  return (
    <svg className="btn-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"
        fill="currentColor"
      />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg className="btn-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M16.5 12A4.5 4.5 0 0 0 14 8v2.18l2.45 2.45c.03-.2.05-.42.05-.63zM19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.9 8.9 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"
        fill="currentColor"
      />
    </svg>
  );
}

function UnmutedIcon() {
  return (
    <svg className="btn-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
        fill="currentColor"
      />
    </svg>
  );
}
