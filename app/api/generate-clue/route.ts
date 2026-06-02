import OpenAI from "openai";
import { NextResponse } from "next/server";
import { Card, Difficulty } from "@/lib/game";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type RequestBody = {
  board: Card[];
  difficulty: Difficulty;
  score: number;
  mistakes: number;
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
      return NextResponse.json(makeFallbackClue(targetWords, body.difficulty));
    }

    const prompt = buildPrompt({
      targetWords,
      neutralWords,
      dangerWord,
      difficulty: body.difficulty,
      score: body.score,
      mistakes: body.mistakes,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a careful game AI. Return only valid JSON and never reveal hidden roles to the player.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(makeFallbackClue(targetWords, body.difficulty));
    }

    const parsed = JSON.parse(content);

    return NextResponse.json({
      clue: String(parsed.clue ?? "Think"),
      count: clampCount(Number(parsed.count ?? 1), targetWords.length),
      intendedWords: Array.isArray(parsed.intendedWords)
        ? parsed.intendedWords.map(String)
        : [targetWords[0]],
      reasoningSummary: String(
        parsed.reasoningSummary ??
          "The clue was generated based on the hidden board state."
      ),
    });
  } catch {
    return NextResponse.json(
      {
        clue: "Think",
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
  difficulty: Difficulty;
  score: number;
  mistakes: number;
}) {
  return `
You are the spymaster in a word association board game.

The player sees a 5x5 board of words, but does not know the hidden roles.

Hidden roles:
- target: words the player should guess
- neutral: words the player should avoid
- danger: if guessed, the player loses immediately

Generate one clue and a number.

Rules:
1. The clue should be a single word or short phrase.
2. The clue should strongly connect to one or more target words.
3. The clue must avoid pointing to neutral words.
4. The clue must especially avoid pointing to the danger word.
5. Do not use any board word as the clue.
6. Do not reveal any hidden roles.
7. Return only valid JSON.

Difficulty:
- easy: safer and more direct, usually count 1
- normal: count 1 or 2
- hard: more abstract, count 1 to 3, but still fair

Current difficulty: ${input.difficulty}
Player score: ${input.score}
Player mistakes: ${input.mistakes}

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
`;
}

function makeFallbackClue(targetWords: string[], difficulty: Difficulty) {
  const word = targetWords[0];

  return {
    clue:
      difficulty === "easy"
        ? `Related`
        : difficulty === "hard"
        ? "Connection"
        : "Think",
    count: 1,
    intendedWords: [word],
    reasoningSummary:
      "Fallback clue generated locally because the AI model was unavailable.",
  };
}

function clampCount(count: number, remainingTargets: number) {
  if (!Number.isFinite(count)) return 1;
  return Math.max(1, Math.min(Math.floor(count), remainingTargets, 3));
}