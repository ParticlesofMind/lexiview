# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## AI Quiz Generator Setup

The Quiz Builder now calls Ollama directly.

1. Create a `.env` file in the project root.
2. Add the configuration below:

```bash
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_OLLAMA_MODEL=llama3.1:8b
# Optional for hosted Ollama endpoints that require auth
VITE_OLLAMA_API_KEY=your_ollama_key_here
```

There is also a starter template in `.env.example`.

3. Restart the dev server.

Notes:

- If you are using local Ollama, the API key is usually not needed.
- If you use a hosted Ollama endpoint, any `VITE_` key is exposed to the browser, so this is acceptable for local/dev use but should move server-side before production.
- If the base URL, model, or auth is wrong, the generator shows a clear error message in the UI.
- For the GitHub Pages deployment, build-time env values are not enough if you want each browser to target a different Ollama host. Use the in-app Ollama settings panel in Quiz Builder to override the URL/model/key at runtime in that browser.

### CORS for hosted frontend

If the frontend runs from `https://particlesofmind.github.io/lexiview/`, your Ollama host must allow that origin.

Example:

```bash
OLLAMA_HOST=0.0.0.0:11434
OLLAMA_ORIGINS=https://particlesofmind.github.io
ollama serve
```

If you expose Ollama on a different machine, do not use `http://localhost:11434` in the hosted app unless Ollama is running on the same machine as the browser. Use the actual reachable host URL instead.

If the frontend is `https://` and your Ollama server is plain `http://` on a non-localhost host, some browsers will block it as mixed content. In that case, put Ollama behind HTTPS or a reverse proxy.

### HTTPS proxy with Caddy (recommended)

Use this when your frontend is hosted on GitHub Pages and you want a stable HTTPS Ollama endpoint.

1. Point a domain/subdomain (example: `ollama.yourdomain.com`) to your Ollama server.
2. Install Caddy on that server.
3. Save this Caddy config:

```caddy
ollama.yourdomain.com {
  encode gzip

  # CORS for your hosted frontend
  @cors_preflight {
    method OPTIONS
    path /api/*
  }
  header {
    Access-Control-Allow-Origin "https://particlesofmind.github.io"
    Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Access-Control-Allow-Headers "Content-Type, Authorization"
    Access-Control-Max-Age "86400"
    Vary "Origin"
  }
  respond @cors_preflight 204

  reverse_proxy 127.0.0.1:11434
}
```

4. Start Ollama locally on the same server:

```bash
OLLAMA_HOST=127.0.0.1:11434 ollama serve
```

5. Reload Caddy:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

6. In Quiz Builder -> Ollama settings, set:

```text
Base URL: https://ollama.yourdomain.com
Model: llama3.1:8b
API key: (optional, if your proxy enforces one)
```

7. Click `Save Ollama Settings`, then `Test Ollama Connection`.

Quick verification from your laptop:

```bash
curl https://ollama.yourdomain.com/api/tags
```

## Appwrite Setup (Web)

This project is Vite + React, so configure Appwrite as a React web platform.

1. Copy `.env.example` to `.env` if you have not already.
2. Ensure these values exist in `.env`:

```bash
VITE_APPWRITE_PROJECT_ID=69c67581001d745c197c
VITE_APPWRITE_PROJECT_NAME=LexiView
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_DATABASE_ID=lexiview
VITE_APPWRITE_QUIZZES_COLLECTION_ID=quizzes
VITE_APPWRITE_SESSIONS_COLLECTION_ID=sessions
VITE_APPWRITE_PARTICIPANTS_COLLECTION_ID=participants
VITE_APPWRITE_ANSWERS_COLLECTION_ID=answers
```

3. Install dependencies (already done if you ran `npm install`):

```bash
npm install
```

4. Start the app:

```bash
npm run dev
```

5. Open Quiz Builder and click `Send Appwrite Ping`.

If ping succeeds, the UI prints Appwrite version, endpoint, and project id.

### Appwrite database schema used by the live quiz flow

Create one database with ID `lexiview` and these collections.

`quizzes`

- `title`: string
- `topic`: string
- `language`: string
- `languageLevel`: string
- `quizType`: string
- `questionCount`: integer
- `optionsPerQuestion`: integer
- `timePerQuestion`: integer
- `questionsJson`: string
- `hostUserId`: string
- `hostName`: string
- `createdAt`: string

`sessions`

- `quizId`: string
- `quizTitle`: string
- `hostUserId`: string
- `hostName`: string
- `joinCode`: string
- `joinUrl`: string
- `status`: string
- `currentQuestionIndex`: integer
- `currentQuestionJson`: string
- `revealJson`: string
- `timePerQuestion`: integer
- `questionStartedAt`: string
- `endedAt`: string
- `createdAt`: string

`participants`

- `sessionId`: string
- `userId`: string
- `nickname`: string
- `deviceToken`: string
- `score`: integer
- `joinedAt`: string

`answers`

- `sessionId`: string
- `questionIndex`: integer
- `participantId`: string
- `participantUserId`: string
- `choice`: string
- `isCorrect`: boolean
- `responseTimeMs`: integer
- `pointsAwarded`: integer
- `submittedAt`: string

Recommended indexes:

- `participants.sessionId`
- `participants.deviceToken`
- `answers.sessionId`
- `answers.questionIndex`

Collection settings:

- Enable document security.
- The app assigns per-document permissions when creating quizzes, sessions, participants, and answers.
- Guests must be allowed to create anonymous sessions in Appwrite Auth, because phone players join without accounts.

### What is live now

- Quiz generation still uses Ollama.
- Launch Session now writes quiz/session records to Appwrite.
- `#/join/:sessionId` creates a participant in Appwrite.
- `#/play/:sessionId` reads live session state and submits answers to Appwrite.
- `#/session/:sessionId` is now host presenter view backed by Appwrite realtime and document updates.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
