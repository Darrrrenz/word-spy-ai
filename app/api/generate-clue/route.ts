import OpenAI from "openai";
import { NextResponse } from "next/server";
import { Card } from "@/lib/game";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ClueHistoryItem = {
  clueLabel: string;
  guesses: {
    word: string;
    result: "target" | "neutral" | "danger";
  }[];
};

type RequestBody = {
  board: Card[];
  score: number;
  mistakes: number;
  cluesUsed?: number;
  clueCost?: number;
  correctStreak?: number;
  clueHistory?: ClueHistoryItem[];
};

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();

    const targetWords = body.board
      .filter((card) => card.role === "target" && !card.revealed)
      .map((card) => card.word);

    const neutralWords = body.board
      .filter((card) => card.role === "neutral" && !card.revealed)
      .map((card) => card.word);

    const dangerWord =
      body.board.find((card) => card.role === "danger" && !card.revealed)
        ?.word ?? "";

    if (targetWords.length === 0) {
      return NextResponse.json({
        clue: "Complete",
        count: 1,
        intendedWords: [],
        reasoningSummary: "No target words remain.",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        makeFallbackClue(targetWords, body.clueCost, body.clueHistory)
      );
    }

    const prompt = buildPrompt({
      targetWords,
      neutralWords,
      dangerWord,
      score: body.score,
      mistakes: body.mistakes,
      cluesUsed: body.cluesUsed ?? 1,
      clueCost: body.clueCost ?? 50,
      correctStreak: body.correctStreak ?? 0,
      clueHistory: body.clueHistory ?? [],
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [
        {
          role: "system",
          content:
            "You are a careful but useful game AI. Return only valid JSON. Never reveal hidden roles to the player.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.85,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        makeFallbackClue(targetWords, body.clueCost, body.clueHistory)
      );
    }

    const parsed = JSON.parse(content);

    const allBoardWords = [...targetWords, ...neutralWords, dangerWord].filter(
      Boolean
    );

    const cleanClue = sanitizeClue(
      String(parsed.clue ?? "Connection"),
      allBoardWords,
      body.clueHistory ?? []
    );

    const rawCount = Number(parsed.count ?? 1);
    const cleanCount = clampCount(rawCount, targetWords.length);

    const intendedWords = sanitizeIntendedWords(
      parsed.intendedWords,
      targetWords,
      cleanCount
    );

    const finalCount = Math.max(1, intendedWords.length || cleanCount);

    return NextResponse.json({
      clue: cleanClue,
      count: finalCount,
      intendedWords,
      reasoningSummary: String(
        parsed.reasoningSummary ??
          "The clue was generated from the current board, game state, and clue history."
      ),
    });
  } catch {
    return NextResponse.json(
      {
        clue: "Connection",
        count: 1,
        intendedWords: [],
        reasoningSummary:
          "Fallback clue used because the AI response could not be parsed.",
      },
      { status: 200 }
    );
  }
}

function buildPrompt(input: {
  targetWords: string[];
  neutralWords: string[];
  dangerWord: string;
  score: number;
  mistakes: number;
  cluesUsed: number;
  clueCost: number;
  correctStreak: number;
  clueHistory: ClueHistoryItem[];
}) {
  return `
You are the spymaster in a single-player word association game.

The player sees a 5x5 board of words, but does not know the hidden roles.

Hidden roles:
- target: words the player should guess
- neutral: words the player should avoid
- danger: if guessed, the player loses immediately

Game state:
- Current score after paying for this clue: ${input.score}
- This is AI clue number: ${input.cluesUsed}
- Cost of this clue: ${input.clueCost}
- Current correct streak before this clue: ${input.correctStreak}
- Neutral hits so far: ${input.mistakes}
- Remaining target words: ${input.targetWords.length}

Scoring context:
- The player starts with 500 points.
- AI clues become more expensive over time.
- Correct target guesses increase the player's score.
- Consecutive correct guesses create a streak bonus.
- Neutral words cost points and reset the streak.
- The danger word instantly loses the game.

Previous AI clues and guesses:
${formatClueHistory(input.clueHistory)}

Your goal:
Generate a clue that is safe, useful, and appropriate for the current game state.
You should decide whether to be conservative or ambitious based on the board, current score, clue cost, neutral hits, current streak, and previous clue history.

Decision guidance:
- You may choose any count from 1 up to the number of intended target words.
- Choose a lower count when safety is more important.
- Choose a higher count only when the clue clearly and safely connects multiple target words.
- If the clue is expensive, a more informative clue may be valuable, but safety still matters.
- If the player has many neutral hits, consider giving a safer clue.
- If the player has a strong correct streak, a more ambitious clue may be useful.
- Do not force a high count just because the clue is expensive.
- Do not force a low count if there is a clearly safe multi-word clue.

Anti-repetition rules:
- DO NOT REPEAT any previous AI clue exactly.
- Avoid near-duplicates of previous clues.
- If a previous clue got no guesses, assume it may not have been helpful and provide a different angle.
- If a previous clue led to neutral or danger guesses, avoid that association direction.
- If a previous clue worked well, you may build on its theme, but use a different word or more specific direction.

Rules:
1. The clue should be a single word or very short phrase.
2. The clue should strongly connect to the intended target words.
3. The clue must avoid pointing to neutral words.
4. The clue must especially avoid pointing to the danger word.
5. Do not use any board word as the clue.
6. Do not use a direct plural, spelling variant, or substring of any board word.
7. Do not reveal hidden roles.
8. Return only valid JSON.

TARGET WORDS:
${input.targetWords.join(", ")}

NEUTRAL WORDS:
${input.neutralWords.join(", ")}

DANGER WORD:
${input.dangerWord}

Return JSON in this exact shape:
{
  "clue": "one word or short phrase",
  "count": 1,
  "intendedWords": ["target word"],
  "reasoningSummary": "brief explanation without revealing hidden roles"
}

Important:
- count must match the number of intendedWords.
- intendedWords must only contain words from TARGET WORDS.
- Do not mention target, neutral, or danger roles in reasoningSummary.
- Do not include the hidden role names in reasoningSummary.
`;
}

function formatClueHistory(history: ClueHistoryItem[]) {
  if (history.length === 0) {
    return "No previous AI clues.";
  }

  return history
    .map((entry, index) => {
      const guesses =
        entry.guesses.length === 0
          ? "no guesses after this clue"
          : entry.guesses
              .map((guess) => `${guess.word} (${guess.result})`)
              .join(", ");

      return `${index + 1}. ${entry.clueLabel} -> ${guesses}`;
    })
    .join("\n");
}

function makeFallbackClue(
  targetWords: string[],
  clueCost?: number,
  clueHistory?: ClueHistoryItem[]
) {
  const shouldTryPair = (clueCost ?? 50) >= 150 && targetWords.length >= 2;

  const previousClues = new Set(
    (clueHistory ?? []).map((entry) =>
      entry.clueLabel.split(",")[0].trim().toLowerCase()
    )
  );

  const candidates = shouldTryPair
    ? ["Pair", "Link", "Group", "Shared"]
    : ["Connection", "Focus", "Hint", "Guide"];

  const clue =
    candidates.find((candidate) => !previousClues.has(candidate.toLowerCase())) ??
    "Direction";

  const count = shouldTryPair ? 2 : 1;

  return {
    clue,
    count,
    intendedWords: targetWords.slice(0, count),
    reasoningSummary:
      "Fallback clue generated locally because the AI model was unavailable.",
  };
}

function clampCount(count: number, remainingTargets: number) {
  if (!Number.isFinite(count)) return 1;

  return Math.max(1, Math.min(Math.floor(count), remainingTargets));
}

function sanitizeClue(
  clue: string,
  boardWords: string[],
  clueHistory: ClueHistoryItem[]
) {
  const normalizedClue = clue.trim();

  if (normalizedClue.length === 0) {
    return "Connection";
  }

  const clueLower = normalizedClue.toLowerCase();

  const usesBoardWord = boardWords.some((word) => {
    if (!word) return false;

    const wordLower = word.toLowerCase();

    return (
      clueLower === wordLower ||
      clueLower.includes(wordLower) ||
      wordLower.includes(clueLower)
    );
  });

  const repeatsPreviousClue = clueHistory.some((entry) => {
    const previousClue = entry.clueLabel.split(",")[0].trim().toLowerCase();
    return previousClue === clueLower;
  });

  if (usesBoardWord || repeatsPreviousClue) {
    return "Direction";
  }

  return normalizedClue;
}

function sanitizeIntendedWords(
  rawIntendedWords: unknown,
  targetWords: string[],
  count: number
) {
  if (!Array.isArray(rawIntendedWords)) {
    return targetWords.slice(0, count);
  }

  const targetSet = new Set(targetWords.map((word) => word.toLowerCase()));

  const cleaned = rawIntendedWords
    .map(String)
    .filter((word) => targetSet.has(word.toLowerCase()));

  const uniqueCleaned = Array.from(new Set(cleaned));

  if (uniqueCleaned.length === 0) {
    return targetWords.slice(0, count);
  }

  return uniqueCleaned.slice(0, count);
}