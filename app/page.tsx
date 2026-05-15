import { getDailySentence } from "@/lib/get-daily-sentence";
import TypingGame from "@/components/TypingGame";

const TEST_SENTENCE = "The quick brown fox jumps over the lazy dog.";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ test?: string }>;
}) {
  const { test } = await searchParams;
  const isTest = process.env.NODE_ENV !== "production" && test === "true";

  const sentence = isTest ? TEST_SENTENCE : getDailySentence().content;

  return <TypingGame sentence={sentence} />;
}
