import { NextResponse } from "next/server";
import { Card, Difficulty } from "@/lib/game";

type RequestBody = {
  board: Card[];
  difficulty: Difficulty;
  score: number;
  mistakes: number;
};

export async function POST(req: Request) {
  const body: RequestBody = await req.json();

  const unrevealedTargets = body.board.filter(
    (card) => card.role === "target" && !card.revealed
  );

  const firstTarget = unrevealedTargets[0];

  if (!firstTarget) {
    return NextResponse.json({
      clue: "Complete",
      count: 1,
      intendedWords: [],
      reasoningSummary: "No target words remain.",
    });
  }

  return NextResponse.json({
    clue: makeSimpleClue(firstTarget.word, body.difficulty),
    count: 1,
    intendedWords: [firstTarget.word],
    reasoningSummary:
      "Temporary local clue generator. Replace this with an LLM call later.",
  });
}

function makeSimpleClue(word: string, difficulty: Difficulty): string {
  if (difficulty === "easy") return `Related to ${word}`;
  if (difficulty === "hard") return "Association";
  return "Think";
}