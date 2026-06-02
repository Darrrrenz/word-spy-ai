import { WORDS } from "@/data/words";

export type CardRole = "target" | "neutral" | "danger";

export type Card = {
  id: number;
  word: string;
  role: CardRole;
  revealed: boolean;
};

export type Clue = {
  clue: string;
  count: number;
  intendedWords: string[];
  reasoningSummary: string;
};

export type Difficulty = "easy" | "normal" | "hard";

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export function createBoard(): Card[] {
    const uniqueWords = Array.from(new Set(WORDS));
    const selectedWords = shuffle(uniqueWords).slice(0, 25);

  const roles: CardRole[] = [
    ...Array(8).fill("target"),
    ...Array(16).fill("neutral"),
    "danger",
  ];

  const shuffledRoles = shuffle(roles);

  return selectedWords.map((word, index) => ({
    id: index,
    word,
    role: shuffledRoles[index],
    revealed: false,
  }));
}

export function getRemainingTargets(board: Card[]): number {
  return board.filter((card) => card.role === "target" && !card.revealed)
    .length;
}

export function getDifficulty(score: number, mistakes: number): Difficulty {
  if (mistakes >= 2) return "easy";
  if (score >= 500) return "hard";
  return "normal";
}