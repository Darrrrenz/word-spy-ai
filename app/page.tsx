"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Clue,
  createBoard,
  getDifficulty,
  getRemainingTargets,
} from "@/lib/game";

type GameStatus = "playing" | "won" | "lost";

export default function Home() {
  const [board, setBoard] = useState<Card[]>([]);
  const [clue, setClue] = useState<Clue | null>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [guessesThisTurn, setGuessesThisTurn] = useState(0);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [message, setMessage] = useState("Click New Game to start.");
  const [loadingClue, setLoadingClue] = useState(false);

  useEffect(() => {
    startNewGame();
  }, []);

  function startNewGame() {
    const newBoard = createBoard();
    setBoard(newBoard);
    setClue(null);
    setScore(0);
    setMistakes(0);
    setGuessesThisTurn(0);
    setStatus("playing");
    setMessage("New game started. Ask the AI spymaster for a clue.");
  }

  async function generateClue() {
    if (status !== "playing") return;

    setLoadingClue(true);
    setMessage("AI spymaster is thinking...");

    try {
      const difficulty = getDifficulty(score, mistakes);

      const res = await fetch("/api/generate-clue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          board,
          difficulty,
          score,
          mistakes,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate clue");
      }

      const data: Clue = await res.json();

      setClue(data);
      setGuessesThisTurn(0);
      setMessage(`Clue generated: ${data.clue}, ${data.count}`);
    } catch {
      const fallbackTarget = board.find(
        (card) => card.role === "target" && !card.revealed
      );

      const fallbackClue: Clue = {
        clue: "Focus",
        count: 1,
        intendedWords: fallbackTarget ? [fallbackTarget.word] : [],
        reasoningSummary: "Fallback clue used because AI was unavailable.",
      };

      setClue(fallbackClue);
      setGuessesThisTurn(0);
      setMessage("Fallback clue generated.");
    } finally {
      setLoadingClue(false);
    }
  }

  function handleGuess(cardId: number) {
    if (status !== "playing") return;

    if (!clue) {
      setMessage("Please generate a clue first.");
      return;
    }

    const card = board.find((c) => c.id === cardId);
    if (!card || card.revealed) return;

    const newBoard = board.map((c) =>
      c.id === cardId ? { ...c, revealed: true } : c
    );

    setBoard(newBoard);

    if (card.role === "target") {
      const newScore = score + 100;
      setScore(newScore);

      const remaining = getRemainingTargets(newBoard);

      if (remaining === 0) {
        setStatus("won");
        setMessage("You found all target words. You win!");
        return;
      }

      const newGuesses = guessesThisTurn + 1;
      setGuessesThisTurn(newGuesses);

      if (newGuesses >= clue.count) {
        setMessage(`${card.word.toUpperCase()} was correct. Turn complete.`);
        setClue(null);
        setGuessesThisTurn(0);
      } else {
        setMessage(`${card.word.toUpperCase()} was correct. Keep guessing.`);
      }
    } else if (card.role === "neutral") {
      setScore(score - 50);
      setMistakes(mistakes + 1);
      setMessage(`${card.word.toUpperCase()} was neutral. Turn ended.`);
      setClue(null);
      setGuessesThisTurn(0);
    } else {
      setStatus("lost");
      setMessage(`${card.word.toUpperCase()} was the danger word. Game over.`);
    }
  }

  function getCardClass(card: Card) {
    if (!card.revealed) {
      return "bg-white hover:bg-slate-100 border-slate-300 text-slate-900";
    }

    if (card.role === "target") {
      return "bg-blue-600 border-blue-700 text-white";
    }

    if (card.role === "neutral") {
      return "bg-slate-400 border-slate-500 text-white";
    }

    return "bg-red-700 border-red-800 text-white";
  }

  const remainingTargets = getRemainingTargets(board);
  const difficulty = getDifficulty(score, mistakes);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Word Spy AI</h1>
            <p className="mt-2 max-w-2xl text-slate-300">
              An AI-powered word association game. Use the AI spymaster&apos;s
              clue to find all target words, but avoid the danger word.
            </p>
          </div>

          <button
            onClick={startNewGame}
            className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 hover:bg-slate-200"
          >
            New Game
          </button>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Score</p>
            <p className="text-3xl font-bold">{score}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Remaining Targets</p>
            <p className="text-3xl font-bold">{remainingTargets}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Mistakes</p>
            <p className="text-3xl font-bold">{mistakes}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Difficulty</p>
            <p className="text-3xl font-bold capitalize">{difficulty}</p>
          </div>
        </section>

        <section className="mb-6 rounded-2xl bg-slate-900 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-400">AI Clue</p>
              {clue ? (
                <p className="text-3xl font-bold">
                  {clue.clue}, {clue.count}
                </p>
              ) : (
                <p className="text-2xl font-semibold text-slate-300">
                  No active clue
                </p>
              )}
            </div>

            <button
              onClick={generateClue}
              disabled={loadingClue || status !== "playing"}
              className="rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {loadingClue ? "Thinking..." : "Ask AI for Clue"}
            </button>
          </div>

          <p className="mt-4 text-slate-300">{message}</p>

          {status !== "playing" && clue?.reasoningSummary && (
            <p className="mt-2 text-sm text-slate-500">
              AI note: {clue.reasoningSummary}
            </p>
          )}

          {status !== "playing" && (
            <p className="mt-4 text-xl font-bold">
              {status === "won" ? "Victory!" : "Game Over"}
            </p>
          )}
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {board.map((card) => (
            <button
              key={card.id}
              onClick={() => handleGuess(card.id)}
              disabled={card.revealed || status !== "playing"}
              className={`min-h-24 rounded-2xl border-2 p-4 text-center text-lg font-bold uppercase shadow-sm transition ${getCardClass(
                card
              )}`}
            >
              {card.word}
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}