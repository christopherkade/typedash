"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { calculateWPM, calculateAccuracy, formatTime } from "@/lib/scoring";
import {
  getAttemptsToday,
  incrementAttempt,
  hasAttemptsRemaining,
  hasViewedLeaderboardToday,
  MAX_ATTEMPTS,
} from "@/lib/attempts";
import ResultsModal from "./ResultsModal";
import LeaderboardModal from "./LeaderboardModal";
import AttemptCounter from "./AttemptCounter";

type GameState = "idle" | "playing" | "rewinding" | "finished" | "exhausted";

const REWIND_TOTAL_MS = 1500; // total duration of the rewind animation (ms)
const easeInOutSine = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

type Spark = {
  id: number;
  side: "top" | "bottom";
  x0: number;
  x1: number;
  dy: number;
};

export type GameResults = {
  time: string;
  wpm: number;
  accuracy: number;
  attemptNumber: number;
};

interface Props {
  sentence: string;
}

export default function TypingGame({ sentence }: Props) {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [results, setResults] = useState<GameResults | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isError, setIsError] = useState(false);
  const [sparks, setSparks] = useState<Spark[]>([]);

  // Framer Motion values for the spring-animated translation
  const rawX = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 380, damping: 38, mass: 0.6 });

  const startTimeRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sparkIdRef = useRef(0);
  const rewindVisualIndexRef = useRef(sentence.length);
  const [rewindVisualIndex, setRewindVisualIndex] = useState(sentence.length);

  // Read attempts from localStorage on mount (one-time external store sync)
  useEffect(() => {
    const current = getAttemptsToday();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAttempts(current);
    if (current >= MAX_ATTEMPTS || hasViewedLeaderboardToday()) {
      setGameState("exhausted");
    }
    if (hasViewedLeaderboardToday()) {
      setShowLeaderboard(true);
    }
  }, []);

  // Keep input focused
  useEffect(() => {
    if (
      gameState !== "exhausted" &&
      gameState !== "finished" &&
      gameState !== "rewinding"
    ) {
      inputRef.current?.focus();
    }
  }, [gameState]);

  // Measure typed character widths and drive the spring motion value
  useEffect(() => {
    let offset = 0;
    for (let i = 0; i < currentIndex; i++) {
      const el = charRefs.current[i];
      if (el) {
        offset += el.getBoundingClientRect().width;
      }
    }
    rawX.set(-offset);
  }, [currentIndex, rawX]);

  const triggerError = useCallback(() => {
    setIsError(true);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setIsError(false), 180);
  }, []);

  const emitSparks = useCallback(() => {
    const newSparks: Spark[] = [];
    for (let i = 0; i < 3; i++) {
      newSparks.push({
        id: sparkIdRef.current++,
        side: "top",
        x0: (Math.random() - 0.5) * 6,
        x1: (Math.random() - 0.5) * 24,
        dy: -(16 + Math.random() * 28),
      });
      newSparks.push({
        id: sparkIdRef.current++,
        side: "bottom",
        x0: (Math.random() - 0.5) * 6,
        x1: (Math.random() - 0.5) * 24,
        dy: 16 + Math.random() * 28,
      });
    }
    setSparks((prev) => [...prev.slice(-60), ...newSparks]);
  }, []);

  // Rewind animation: 1 s pause then ease-in-out sweep back to start
  useEffect(() => {
    if (gameState !== "rewinding") return;

    // Reset ref so the rAF comparison starts from the correct baseline
    rewindVisualIndexRef.current = sentence.length;

    // Cache left-edge positions of every character once (avoids per-frame layout)
    const cumulative: number[] = [0];
    for (const el of charRefs.current) {
      const prev = cumulative[cumulative.length - 1];
      cumulative.push(prev + (el ? el.getBoundingClientRect().width : 0));
    }
    const totalWidth = cumulative[cumulative.length - 1];

    let rafId: number | null = null;
    let startTime: number | null = null;

    const step = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;
      const rawProgress = Math.min(elapsed / REWIND_TOTAL_MS, 1);
      const easedProgress = easeInOutSine(rawProgress);

      // Drive the spring target directly — no React renders for position
      rawX.set(-(totalWidth * (1 - easedProgress)));

      // Derive color index from the spring's actual visual position
      const caretOffset = -springX.get();
      let newColorIdx = sentence.length;
      if (caretOffset < totalWidth) {
        newColorIdx = 0;
        for (let i = 0; i < sentence.length; i++) {
          if (cumulative[i] <= caretOffset) {
            newColorIdx = i;
          } else {
            break;
          }
        }
      }

      if (newColorIdx !== rewindVisualIndexRef.current) {
        if (newColorIdx < rewindVisualIndexRef.current) emitSparks();
        rewindVisualIndexRef.current = newColorIdx;
        setRewindVisualIndex(newColorIdx);
      }

      if (rawProgress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        // Animation done: dim all chars, then show modal after 1 s
        rewindVisualIndexRef.current = -1;
        setRewindVisualIndex(-1);
        rawX.set(0);
        setCurrentIndex(0);
        delayTimer2 = setTimeout(() => setGameState("finished"), 1000);
      }
    };

    let delayTimer2: ReturnType<typeof setTimeout> | null = null;
    const delayTimer = setTimeout(() => {
      rafId = requestAnimationFrame(step);
    }, 1000);

    return () => {
      clearTimeout(delayTimer);
      if (delayTimer2 !== null) clearTimeout(delayTimer2);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [gameState, sentence.length, emitSparks, rawX, springX]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        gameState === "finished" ||
        gameState === "exhausted" ||
        gameState === "rewinding"
      )
        return;
      // Only handle printable single characters
      if (e.key.length !== 1) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      e.preventDefault();

      const expectedChar = sentence[currentIndex];

      // Start timer on first keystroke
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
        setGameState("playing");
      }

      const newTotal = totalKeystrokes + 1;
      setTotalKeystrokes(newTotal);

      if (e.key === expectedChar) {
        const newCorrect = correctKeystrokes + 1;
        setCorrectKeystrokes(newCorrect);
        setIsError(false);
        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);

        if (newIndex === sentence.length) {
          const elapsed = Date.now() - startTimeRef.current!;
          incrementAttempt();
          const newAttempts = getAttemptsToday();
          setAttempts(newAttempts);
          setResults({
            time: formatTime(elapsed),
            wpm: calculateWPM(sentence.length, elapsed),
            accuracy: calculateAccuracy(newCorrect, newTotal),
            attemptNumber: newAttempts,
          });
          setGameState("rewinding");
        }
      } else {
        triggerError();
      }
    },
    [
      gameState,
      currentIndex,
      sentence,
      totalKeystrokes,
      correctKeystrokes,
      triggerError,
    ],
  );

  const handleReset = useCallback(() => {
    if (!hasAttemptsRemaining()) {
      setGameState("exhausted");
      return;
    }
    startTimeRef.current = null;
    setCurrentIndex(0);
    setTotalKeystrokes(0);
    setCorrectKeystrokes(0);
    setIsError(false);
    setResults(null);
    setSparks([]);
    setRewindVisualIndex(sentence.length);
    setAttempts(getAttemptsToday());
    setShowLeaderboard(false);
    setGameState("idle");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [sentence.length]);

  // Attempt number to display: during play = upcoming attempt, after finish = just completed
  const displayAttempt =
    gameState === "finished" ? attempts : Math.min(attempts + 1, MAX_ATTEMPTS);

  const characters = sentence.split("");

  const FONT_SIZE = 48; // px — keep in sync with inline style below

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen w-full"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Attempt counter */}
      {gameState !== "exhausted" && (
        <AttemptCounter current={displayAttempt} max={MAX_ATTEMPTS} />
      )}

      {/* Fixed center cursor line + sparks */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <motion.div
          className="w-0.5 bg-white/70 rounded-full"
          style={{ height: FONT_SIZE * 1.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Spark particles anchored to the caret */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 overflow-visible"
        style={{ width: 0, height: FONT_SIZE * 1.5 }}
      >
        {sparks.map((spark) => (
          <motion.div
            key={spark.id}
            className="absolute rounded-full bg-white"
            style={{
              width: 3,
              height: 3,
              top: spark.side === "top" ? 0 : FONT_SIZE * 1.5,
            }}
            initial={{ opacity: 0.9, x: spark.x0, y: 0 }}
            animate={{ opacity: 0, x: spark.x1, y: spark.dy }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onAnimationComplete={() =>
              setSparks((prev) => prev.filter((s) => s.id !== spark.id))
            }
          />
        ))}
      </div>

      {/* Typing area */}
      {gameState !== "exhausted" ? (
        <motion.div
          className="relative w-full overflow-hidden"
          style={{ height: FONT_SIZE * 2.5 }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Sentence — translated so active char sits at viewport center */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 left-1/2 flex whitespace-pre select-none"
            style={{
              x: springX,
              fontFamily: "var(--font-geist-sans)",
              fontSize: FONT_SIZE,
              fontWeight: 300,
              lineHeight: 1,
            }}
          >
            {characters.map((char, i) => {
              const displayIdx =
                gameState === "rewinding" ? rewindVisualIndex : currentIndex;
              const typed = i < displayIdx;
              const active = i === displayIdx;

              let color: string;

              if (typed) {
                color = "rgba(255,255,255,1)";
              } else if (active) {
                color =
                  isError && gameState !== "rewinding"
                    ? "rgba(252,129,74,1)"
                    : "rgba(255,255,255,0.18)";
                // underline removed; caret provides position indicator
              } else {
                color = "rgba(255,255,255,0.18)";
              }

              return (
                <span
                  key={i}
                  ref={(el) => {
                    charRefs.current[i] = el;
                  }}
                  style={{ color }}
                >
                  {char}
                </span>
              );
            })}
          </motion.div>
        </motion.div>
      ) : (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white/30 text-xs tracking-[0.4em] uppercase font-mono"
        >
          No attempts remaining — come back tomorrow
        </motion.p>
      )}

      {/* Start hint */}
      <AnimatePresence>
        {gameState === "idle" && (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="absolute bottom-12 text-white/18 text-[10px] tracking-[0.5em] uppercase font-mono pointer-events-none"
          >
            Start typing
          </motion.p>
        )}
      </AnimatePresence>

      {/* Hidden capture input */}
      <input
        ref={inputRef}
        className="sr-only"
        onKeyDown={handleKeyDown}
        readOnly
        tabIndex={0}
        aria-label="Type the sentence"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {/* Results modal */}
      <AnimatePresence>
        {results && gameState === "finished" && !showLeaderboard && (
          <ResultsModal
            key="results"
            results={results}
            onReset={handleReset}
            hasAttemptsLeft={hasAttemptsRemaining()}
            onShowLeaderboard={() => setShowLeaderboard(true)}
          />
        )}
      </AnimatePresence>

      {showLeaderboard && <LeaderboardModal />}
    </div>
  );
}
