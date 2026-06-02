# Word Spy AI

Word Spy AI is a single-player, AI-powered word association game inspired by Codenames. The player tries to find all hidden target words on a 5×5 board while avoiding neutral words and one danger word.

## Live Demo

```text
https://word-spy-ai.vercel.app
```

## Requirements

Before running the project locally, make sure you have:

- Node.js installed
- npm installed
- an OpenAI API key

## Running the Project Locally

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/word-spy-ai.git
cd word-spy-ai
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

Start the development server:

```bash
npm run dev
```

Then open the app in your browser:

```text
http://localhost:3000
```

## Project Structure

```text
app/page.tsx
Main game page and client-side game state.

app/api/generate-clue/route.ts
Backend API route for generating AI clues.

data/words.ts
Local word corpus used to generate the game board.

lib/game.ts
Shared game types and board generation logic.
```