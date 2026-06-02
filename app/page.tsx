"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Clue,
  createBoard,
  getRemainingTargets,
} from "@/lib/game";

type GameStatus = "playing" | "won" | "lost";

type GuessRecord = {
  word: string;
  result: "target" | "neutral" | "danger";
  points: number;
};

type HistoryEntry = {
  id: string;
  clueLabel: string;
  cost: number;
  guesses: GuessRecord[];
};

const STARTING_SCORE = 500;
const BASE_CLUE_COST = 50;
const NEUTRAL_PENALTY = 100;
const BASE_TARGET_POINTS = 100;
const STREAK_BONUS = 50;

export default function Home() {
  const [board, setBoard] = useState<Card[]>([]);
  const [clue, setClue] = useState<Clue | null>(null);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [score, setScore] = useState(STARTING_SCORE);
  const [neutralHits, setNeutralHits] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [cluesUsed, setCluesUsed] = useState(0);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [message, setMessage] = useState("Click New Game to start.");
  const [loadingClue, setLoadingClue] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    startNewGame();
  }, []);

  function startNewGame() {
    const newBoard = createBoard();

    setBoard(newBoard);
    setClue(null);
    setCurrentHistoryId(null);
    setHistory([]);

    setScore(STARTING_SCORE);
    setNeutralHits(0);
    setCorrectStreak(0);
    setCluesUsed(0);
    setStatus("playing");
    setMessage(
      "New game started. You may guess directly or ask the AI for a clue."
    );
  }

  function getClueCost(nextClueNumber: number) {
    return BASE_CLUE_COST * nextClueNumber;
  }

  async function generateClue() {
    if (status !== "playing") return;

    const nextClueNumber = cluesUsed + 1;
    const currentClueCost = getClueCost(nextClueNumber);
    const nextScore = score - currentClueCost;

    setCluesUsed(nextClueNumber);
    setScore(nextScore);

    if (nextScore < 0) {
      setStatus("lost");
      setMessage(
        `AI clue #${nextClueNumber} cost -${currentClueCost}. Your score dropped below 0. Game over. All word roles are now revealed.`
      );
      return;
    }

    setLoadingClue(true);
    setMessage(
      `AI clue #${nextClueNumber} cost -${currentClueCost}. AI spymaster is thinking...`
    );

    try {
      const res = await fetch("/api/generate-clue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          board,
          score: nextScore,
          mistakes: neutralHits,
          cluesUsed: nextClueNumber,
          clueCost: currentClueCost,
          correctStreak,
          clueHistory: history
            .filter((entry) => entry.cost > 0)
            .slice(0, 6)
            .map((entry) => ({
              clueLabel: entry.clueLabel,
              guesses: entry.guesses.map((guess) => ({
                word: guess.word,
                result: guess.result,
              })),
            })),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate clue");
      }

      const data: Clue = await res.json();

      const historyId = crypto.randomUUID();
      const clueLabel = `${data.clue}, ${data.count}`;

      setClue(data);
      setCurrentHistoryId(historyId);
      setHistory((prev) => [
        {
          id: historyId,
          clueLabel,
          cost: currentClueCost,
          guesses: [],
        },
        ...prev,
      ]);

      setMessage(
        `AI clue #${nextClueNumber}: ${clueLabel}. Cost: -${currentClueCost}. You can still guess any unrevealed word.`
      );
    } catch {
      const unrevealedTargets = board.filter(
        (card) => card.role === "target" && !card.revealed
      );

      const shouldTryPair = currentClueCost >= 100;
      const fallbackCount =
        shouldTryPair && unrevealedTargets.length >= 2 ? 2 : 1;

      const fallbackClue: Clue = {
        clue: shouldTryPair ? "Pair" : "Connection",
        count: fallbackCount,
        intendedWords: unrevealedTargets
          .slice(0, fallbackCount)
          .map((card) => card.word),
        reasoningSummary: "Fallback clue used because AI was unavailable.",
      };

      const historyId = crypto.randomUUID();

      setClue(fallbackClue);
      setCurrentHistoryId(historyId);
      setHistory((prev) => [
        {
          id: historyId,
          clueLabel: `${fallbackClue.clue}, ${fallbackClue.count}`,
          cost: currentClueCost,
          guesses: [],
        },
        ...prev,
      ]);

      setMessage(
        `Fallback clue #${nextClueNumber} generated. Cost: -${currentClueCost}. You can still guess any unrevealed word.`
      );
    } finally {
      setLoadingClue(false);
    }
  }

  function appendGuessToHistory(record: GuessRecord) {
    if (currentHistoryId) {
      setHistory((prev) =>
        prev.map((entry) =>
          entry.id === currentHistoryId
            ? { ...entry, guesses: [...entry.guesses, record] }
            : entry
        )
      );
      return;
    }

    const blindGuessEntry = history.find(
      (entry) => entry.clueLabel === "No clue"
    );

    if (blindGuessEntry) {
      setHistory((prev) =>
        prev.map((entry) =>
          entry.id === blindGuessEntry.id
            ? { ...entry, guesses: [...entry.guesses, record] }
            : entry
        )
      );
      setCurrentHistoryId(blindGuessEntry.id);
      return;
    }

    const newId = crypto.randomUUID();

    setHistory((prev) => [
      {
        id: newId,
        clueLabel: "No clue",
        cost: 0,
        guesses: [record],
      },
      ...prev,
    ]);

    setCurrentHistoryId(newId);
  }

  function handleGuess(cardId: number) {
    if (status !== "playing") return;

    const card = board.find((c) => c.id === cardId);

    if (!card || card.revealed) return;

    const newBoard = board.map((c) =>
      c.id === cardId ? { ...c, revealed: true } : c
    );

    setBoard(newBoard);

    if (card.role === "target") {
      const points = BASE_TARGET_POINTS + correctStreak * STREAK_BONUS;
      const newScore = score + points;
      const newStreak = correctStreak + 1;

      setScore(newScore);
      setCorrectStreak(newStreak);

      appendGuessToHistory({
        word: card.word,
        result: "target",
        points,
      });

      const remaining = getRemainingTargets(newBoard);

      if (remaining === 0) {
        setStatus("won");
        setMessage(
          `${card.word.toUpperCase()} was correct. +${points}. You found all target words. Victory! Final score: ${newScore}. All word roles are now revealed.`
        );
        return;
      }

      setMessage(
        `${card.word.toUpperCase()} was correct. +${points}. Current streak: ${newStreak}.`
      );

      return;
    }

    if (card.role === "neutral") {
      const newScore = score - NEUTRAL_PENALTY;
      const newNeutralHits = neutralHits + 1;

      setScore(newScore);
      setNeutralHits(newNeutralHits);
      setCorrectStreak(0);

      appendGuessToHistory({
        word: card.word,
        result: "neutral",
        points: -NEUTRAL_PENALTY,
      });

      if (newScore < 0) {
        setStatus("lost");
        setMessage(
          `${card.word.toUpperCase()} was neutral. -${NEUTRAL_PENALTY}. Your score dropped below 0. Game over. All word roles are now revealed.`
        );
      } else {
        setMessage(
          `${card.word.toUpperCase()} was neutral. -${NEUTRAL_PENALTY}. Correct streak reset.`
        );
      }

      return;
    }

    appendGuessToHistory({
      word: card.word,
      result: "danger",
      points: 0,
    });

    setCorrectStreak(0);
    setStatus("lost");
    setMessage(
      `${card.word.toUpperCase()} was the danger word. Game over. All word roles are now revealed.`
    );
  }

  function getCardClass(card: Card) {
    const shouldRevealRole = card.revealed || status !== "playing";

    if (!shouldRevealRole) {
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

  function getRoleLabel(role: Card["role"]) {
    if (role === "target") return "Target";
    if (role === "neutral") return "Neutral";
    return "Danger";
  }

  function getGuessClass(result: GuessRecord["result"]) {
    if (result === "target") return "text-blue-300";
    if (result === "neutral") return "text-slate-300";
    return "text-red-300";
  }

  const remainingTargets = getRemainingTargets(board);
  const nextCorrectPoints = BASE_TARGET_POINTS + correctStreak * STREAK_BONUS;
  const nextClueCost = getClueCost(cluesUsed + 1);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        {showRules && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-slate-900 p-6 shadow-2xl">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    How to Play
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Guess hidden target words, use AI clues when needed, and
                    protect your score.
                  </p>
                </div>

                <button
                  onClick={() => setShowRules(false)}
                  className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Close
                </button>
              </div>

              <div className="space-y-5 text-slate-300">
                <section>
                  <h3 className="mb-2 text-lg font-bold text-white">Goal</h3>
                  <p>
                    Find all 8 hidden target words on the 5×5 board. You lose
                    if your score drops below 0 or if you reveal the danger
                    word.
                  </p>
                </section>

                <section>
                  <h3 className="mb-2 text-lg font-bold text-white">
                    AI Clues
                  </h3>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>You can guess words even without an AI clue.</li>
                    <li>
                      Each AI clue costs more than the last: the first clue
                      costs 50, the second costs 100, the third costs 150, and
                      so on.
                    </li>
                    <li>
                      The AI receives the current score, clue cost, clue number,
                      remaining targets, neutral hits, and streak, then decides
                      whether to give a count 1, 2, or 3 clue.
                    </li>
                    <li>
                      The AI clue suggests a word association and a number, such
                      as{" "}
                      <span className="font-semibold text-white">
                        Technology, 2
                      </span>
                      .
                    </li>
                    <li>
                      All AI clues and the guesses made after them are recorded
                      in the game history.
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="mb-2 text-lg font-bold text-white">
                    Scoring
                  </h3>

                  <div className="overflow-hidden rounded-xl border border-slate-700">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-800 text-white">
                        <tr>
                          <th className="px-4 py-3">Action</th>
                          <th className="px-4 py-3">Result</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-700">
                        <tr>
                          <td className="px-4 py-3">Starting score</td>
                          <td className="px-4 py-3">+{STARTING_SCORE}</td>
                        </tr>

                        <tr>
                          <td className="px-4 py-3">Ask AI for clue</td>
                          <td className="px-4 py-3">-50 × clue number</td>
                        </tr>

                        <tr>
                          <td className="px-4 py-3">
                            1st consecutive correct target
                          </td>
                          <td className="px-4 py-3">+100</td>
                        </tr>

                        <tr>
                          <td className="px-4 py-3">
                            Each additional consecutive target
                          </td>
                          <td className="px-4 py-3">Previous reward +50</td>
                        </tr>

                        <tr>
                          <td className="px-4 py-3">Neutral word</td>
                          <td className="px-4 py-3">
                            -{NEUTRAL_PENALTY} and correct streak resets
                          </td>
                        </tr>

                        <tr>
                          <td className="px-4 py-3">Danger word</td>
                          <td className="px-4 py-3">Instant game over</td>
                        </tr>

                        <tr>
                          <td className="px-4 py-3">Score below 0</td>
                          <td className="px-4 py-3">Game over</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 text-lg font-bold text-white">
                    Strategy
                  </h3>
                  <p>
                    You can play aggressively by guessing without clues to build
                    a higher streak, or spend points on AI clues when the board
                    becomes uncertain. AI clues become more expensive over time,
                    so relying on them too often can be risky.
                  </p>
                </section>
              </div>
            </div>
          </div>
        )}

        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Word Spy AI</h1>
            <p className="mt-2 max-w-2xl text-slate-300">
              Find all 8 hidden target words. You can guess directly or spend
              points on AI clues. Consecutive correct guesses build a bigger
              reward, while each new clue becomes more expensive.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowRules(true)}
              className="rounded-xl bg-slate-800 px-5 py-3 font-semibold text-white hover:bg-slate-700"
            >
              Rules
            </button>

            <button
              onClick={startNewGame}
              className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 hover:bg-slate-200"
            >
              New Game
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Score</p>
            <p className="text-3xl font-bold">{score}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Remaining Targets</p>
            <p className="text-3xl font-bold">{remainingTargets}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Correct Streak</p>
            <p className="text-3xl font-bold">{correctStreak}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Next Correct</p>
            <p className="text-3xl font-bold">+{nextCorrectPoints}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Next Clue Cost</p>
            <p className="text-3xl font-bold">-{nextClueCost}</p>
          </div>
        </section>

        <section className="mb-6 rounded-2xl bg-slate-900 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-400">Current AI Clue</p>

              {clue ? (
                <div>
                  <p className="text-3xl font-bold">
                    {clue.clue}, {clue.count}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Guesses after this clue are recorded in the history panel.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl font-semibold text-slate-300">
                    No active clue
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    You can still guess directly, or spend {nextClueCost} points
                    for an AI clue.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={generateClue}
              disabled={loadingClue || status !== "playing"}
              className="rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {loadingClue
                ? "Thinking..."
                : `Ask AI for Clue (-${nextClueCost})`}
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

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {board.map((card) => {
              const shouldRevealRole = card.revealed || status !== "playing";

              return (
                <button
                  key={card.id}
                  onClick={() => handleGuess(card.id)}
                  disabled={card.revealed || status !== "playing"}
                  className={`min-h-24 rounded-2xl border-2 p-4 text-center shadow-sm transition ${getCardClass(
                    card
                  )}`}
                >
                  <div className="text-lg font-bold uppercase">
                    {card.word}
                  </div>

                  {shouldRevealRole && (
                    <div className="mt-2 text-xs font-semibold uppercase tracking-wide opacity-80">
                      {getRoleLabel(card.role)}
                    </div>
                  )}
                </button>
              );
            })}
          </section>

          <aside className="rounded-2xl bg-slate-900 p-5">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Clue & Guess History</h2>
              <p className="mt-1 text-sm text-slate-400">
                AI clues and guesses made after each clue.
              </p>
            </div>

            {history.length === 0 ? (
              <p className="text-sm text-slate-500">
                No guesses yet. Ask for a clue or start guessing directly.
              </p>
            ) : (
              <div className="max-h-[520px] space-y-4 overflow-y-auto pr-1">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-slate-700 bg-slate-950 p-4"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-white">
                          {entry.clueLabel}
                        </p>
                        <p className="text-xs text-slate-500">
                          {entry.cost > 0
                            ? `AI clue cost: -${entry.cost}`
                            : "Blind guesses"}
                        </p>
                      </div>
                    </div>

                    {entry.guesses.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No guesses after this clue yet.
                      </p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {entry.guesses.map((guess, index) => (
                          <li
                            key={`${entry.id}-${guess.word}-${index}`}
                            className="flex items-center justify-between gap-3"
                          >
                            <span className={getGuessClass(guess.result)}>
                              {guess.word.toUpperCase()} · {guess.result}
                            </span>
                            <span
                              className={
                                guess.points > 0
                                  ? "text-blue-300"
                                  : guess.points < 0
                                  ? "text-red-300"
                                  : "text-slate-400"
                              }
                            >
                              {guess.points > 0
                                ? `+${guess.points}`
                                : guess.points}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}