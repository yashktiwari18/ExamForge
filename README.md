# ExamForge

AI-powered competitive-exam MCQ and mock-test generator.

## Stack
- React + Vite
- JavaScript/JSX
- Lucide React
- Claude Messages API
- Browser localStorage for test history

## Run locally

1. Install Node.js (LTS).
2. Open this folder in VS Code.
3. Run:

```bash
npm install
```

4. Copy `.env.example` to `.env`.
5. Put your Claude API key in `.env`:

```env
VITE_ANTHROPIC_API_KEY=your_key_here
```

6. Start:

```bash
npm run dev
```

Open the local URL shown by Vite.

## Important security note

This version calls the Claude API directly from the browser because the project intentionally has no backend. That means the API key is exposed to the browser and this setup is for local development/testing only. Do NOT publish a real API key in a public GitHub repository or production frontend.

For production, use a small server/serverless function as a secure proxy between the frontend and Claude API.
