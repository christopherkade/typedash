"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getTodayTopTen,
  getUtcDateLabel,
  type LeaderboardEntry,
} from "@/lib/leaderboard";
import { markLeaderboardViewed } from "@/lib/attempts";

export default function LeaderboardModal() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEntries = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await getTodayTopTen();
      setEntries(data);
    } catch {
      // silently fail on refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    markLeaderboardViewed();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEntries();
  }, [fetchEntries]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative flex flex-col gap-8 rounded-2xl border border-white/8 bg-white/4 backdrop-blur-md"
        style={{ padding: "3.5rem 4rem", minWidth: "32rem" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-white/30 text-[10px] tracking-[0.4em] uppercase font-mono">
              {getUtcDateLabel()}
            </span>
            <span className="text-white/70 text-xs tracking-[0.25em] uppercase font-mono">
              Leaderboard
            </span>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => fetchEntries(true)}
            disabled={refreshing}
            title="Refresh leaderboard"
            className="text-white/25 hover:text-white/60 transition-colors cursor-pointer disabled:cursor-default mt-1"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={refreshing ? "animate-spin" : ""}
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>

        {/* Entries */}
        {loading ? (
          <span className="text-white/20 text-[10px] tracking-[0.4em] uppercase font-mono">
            —
          </span>
        ) : entries.length === 0 ? (
          <p className="text-white/25 text-xs font-mono tracking-widest">
            No scores yet today.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className="flex items-center gap-6 font-mono text-xs"
              >
                <span className="text-white/20 w-4 text-right tabular-nums">
                  {i + 1}
                </span>
                <span className="text-white/70 flex-1 truncate">
                  {entry.username}
                </span>
                <span className="text-white tabular-nums">{entry.wpm} wpm</span>
                <span className="text-white/30 tabular-nums">
                  {entry.time_seconds}s
                </span>
                <span className="text-white/30 tabular-nums">
                  {entry.accuracy}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="text-white/20 text-[10px] tracking-[0.4em] uppercase font-mono">
          Come back tomorrow for a new sentence
        </p>
      </div>
    </div>
  );
}
