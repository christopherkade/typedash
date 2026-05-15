"use client";

import { useEffect, useRef, useState } from "react";
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";
import type { GameResults } from "./TypingGame";
import { checkIsTopTen, submitScore } from "@/lib/leaderboard";

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

type Phase = "checking" | "top-ten" | "submitted" | "default";

interface Props {
  results: GameResults;
  onReset: () => void;
  hasAttemptsLeft: boolean;
  onShowLeaderboard: () => void;
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-col items-center gap-3"
      style={{ padding: "0 2rem", minWidth: "10rem" }}
    >
      <span className="text-white/30 text-[10px] tracking-[0.4em] uppercase font-mono">
        {label}
      </span>
      <span className="text-white text-5xl font-light tabular-nums">
        {value}
      </span>
    </div>
  );
}

export default function ResultsModal({
  results,
  onReset,
  hasAttemptsLeft,
  onShowLeaderboard,
}: Props) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if user qualifies for top 10
  useEffect(() => {
    checkIsTopTen(results.wpm)
      .then((isTop) => setPhase(isTop ? "top-ten" : "default"))
      .catch(() => setPhase("default"));
  }, [results.wpm]);

  // Focus username input when top-ten phase starts
  useEffect(() => {
    if (phase === "top-ten") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [phase]);

  // Auto-show leaderboard after submission
  useEffect(() => {
    if (phase !== "submitted") return;
    const t = setTimeout(onShowLeaderboard, 800);
    return () => clearTimeout(t);
  }, [phase, onShowLeaderboard]);

  // Key handlers for "default" phase
  useEffect(() => {
    if (phase !== "default") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && hasAttemptsLeft) onReset();
      if (e.key === "l" || e.key === "L") onShowLeaderboard();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, hasAttemptsLeft, onReset, onShowLeaderboard]);

  const handleSubmit = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Enter a username.");
      return;
    }
    if (trimmed.length < 2) {
      setError("At least 2 characters.");
      return;
    }
    if (trimmed.length > 25) {
      setError("Max 25 characters.");
      return;
    }
    if (matcher.hasMatch(trimmed)) {
      setError("Please choose a different username.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await submitScore({
        username: trimmed,
        wpm: results.wpm,
        time_seconds: parseInt(results.time, 10),
        accuracy: results.accuracy,
      });
      setPhase("submitted");
    } catch {
      setError("Failed to submit. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-40"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative flex flex-col items-center gap-10 rounded-2xl border border-white/8 bg-white/4 backdrop-blur-md"
        style={{ padding: "3.5rem 4rem" }}
      >
        {/* Stats row */}
        <div className="flex items-start gap-14">
          <StatItem label="Time" value={`${results.time}s`} />
          <div className="w-px self-stretch bg-white/8 mt-8" />
          <StatItem label="WPM" value={String(results.wpm)} />
          <div className="w-px self-stretch bg-white/8 mt-8" />
          <StatItem label="Accuracy" value={`${results.accuracy}%`} />
        </div>

        {/* Action area */}
        <div className="flex flex-col items-center gap-4 min-h-16 justify-center">
          {phase === "checking" && (
            <span className="text-white/20 text-[10px] tracking-[0.4em] uppercase font-mono">
              —
            </span>
          )}

          {phase === "top-ten" && (
            <div className="flex flex-col items-center gap-5">
              <p className="text-white/50 text-[10px] tracking-[0.35em] uppercase font-mono">
                Congrats ! You made the top 10
              </p>
              <div className="flex flex-col items-center gap-2">
                <input
                  ref={inputRef}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  placeholder="username"
                  maxLength={25}
                  disabled={isSubmitting}
                  className="bg-transparent border-b border-white/20 text-white text-xs tracking-widest font-mono text-center outline-none placeholder:text-white/20 pb-1 w-40"
                />
                {error && (
                  <p className="text-[rgba(252,129,74,0.8)] text-[10px] tracking-widest font-mono">
                    {error}
                  </p>
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="text-white text-xs tracking-[0.35em] uppercase font-mono cursor-pointer disabled:opacity-40"
              >
                {isSubmitting ? (
                  "Saving…"
                ) : (
                  <>
                    Submit <span className="text-white/20">[Enter]</span>
                  </>
                )}
              </button>
            </div>
          )}

          {phase === "submitted" && (
            <p className="text-white/40 text-[10px] tracking-[0.4em] uppercase font-mono">
              Score saved
            </p>
          )}

          {phase === "default" && (
            <div className="flex items-center gap-8">
              {hasAttemptsLeft ? (
                <button
                  onClick={onReset}
                  className="text-white text-xs tracking-[0.35em] uppercase font-mono cursor-pointer"
                >
                  Try Again <span className="text-white/30">↵</span>
                </button>
              ) : (
                <p className="text-white/25 text-xs tracking-[0.35em] uppercase font-mono">
                  Come back tomorrow
                </p>
              )}
              <button
                onClick={onShowLeaderboard}
                className="text-white/40 text-xs tracking-[0.35em] uppercase font-mono cursor-pointer hover:text-white/70 transition-colors"
              >
                Leaderboard <span className="text-white/20">[L]</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
