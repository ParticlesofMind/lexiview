/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OLLAMA_BASE_URL?: string
  readonly VITE_OLLAMA_MODEL?: string
  readonly VITE_OLLAMA_API_KEY?: string
  readonly VITE_APPWRITE_PROJECT_ID?: string
  readonly VITE_APPWRITE_PROJECT_NAME?: string
  readonly VITE_APPWRITE_ENDPOINT?: string
  readonly VITE_APPWRITE_DATABASE_ID?: string
  readonly VITE_APPWRITE_QUIZZES_COLLECTION_ID?: string
  readonly VITE_APPWRITE_SESSIONS_COLLECTION_ID?: string
  readonly VITE_APPWRITE_PARTICIPANTS_COLLECTION_ID?: string
  readonly VITE_APPWRITE_ANSWERS_COLLECTION_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
