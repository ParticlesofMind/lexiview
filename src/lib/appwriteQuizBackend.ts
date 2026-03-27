import {
  Account,
  Databases,
  ID,
  Permission,
  Query,
  Role,
  type Models,
  type RealtimeResponseEvent,
} from 'appwrite'
import { createAppwriteClient } from './appwrite'
import type { GeneratedQuiz, QuizBuilderConfig, QuizQuestion, QuizSessionStatus } from '../types/dictionary'

const DEVICE_TOKEN_KEY = 'lexiview-device-token'

type AppwriteConfig = {
  databaseId: string
  quizzesCollectionId: string
  sessionsCollectionId: string
  participantsCollectionId: string
  answersCollectionId: string
}

type QuizDocument = Models.Document & {
  title: string
  topic: string
  language: string
  languageLevel: string
  quizType: string
  questionCount: number
  optionsPerQuestion: number
  timePerQuestion: number
  questionsJson: string
  hostUserId: string
  hostName: string
  createdAt: string
}

type SessionDocument = Models.Document & {
  quizId: string
  quizTitle: string
  hostUserId: string
  hostName: string
  joinCode: string
  joinUrl: string
  status: QuizSessionStatus
  currentQuestionIndex: number
  currentQuestionJson: string
  revealJson: string
  timePerQuestion: number
  questionStartedAt: string
  endedAt: string
  createdAt: string
}

type ParticipantDocument = Models.Document & {
  sessionId: string
  userId: string
  nickname: string
  deviceToken: string
  score: number
  joinedAt: string
}

type AnswerDocument = Models.Document & {
  sessionId: string
  questionIndex: number
  participantId: string
  participantUserId: string
  choice: string
  isCorrect: boolean
  responseTimeMs: number
  pointsAwarded: number
  submittedAt: string
}

export type PublicQuestionPayload = {
  position: number
  prompt: string
  options: QuizQuestion['options']
}

export type RevealPayload = {
  correctAnswer: QuizQuestion['correct_answer']
  explanation: string
  distribution: Record<'A' | 'B' | 'C' | 'D', number>
}

export type QuizRecord = {
  id: string
  title: string
  topic: string
  language: string
  languageLevel: string
  quizType: string
  questionCount: number
  optionsPerQuestion: number
  timePerQuestion: number
  questions: QuizQuestion[]
  hostUserId: string
  hostName: string
}

export type SessionRecord = {
  id: string
  quizId: string
  quizTitle: string
  hostUserId: string
  hostName: string
  joinCode: string
  joinUrl: string
  status: QuizSessionStatus
  currentQuestionIndex: number
  currentQuestion: PublicQuestionPayload | null
  reveal: RevealPayload | null
  timePerQuestion: number
  questionStartedAt: string | null
  endedAt: string | null
}

export type ParticipantRecord = {
  id: string
  sessionId: string
  userId: string
  nickname: string
  deviceToken: string
  score: number
  joinedAt: string
}

export type AnswerRecord = {
  id: string
  sessionId: string
  questionIndex: number
  participantId: string
  participantUserId: string
  choice: string
  isCorrect: boolean
  responseTimeMs: number
  pointsAwarded: number
  submittedAt: string
}

function getConfig(): AppwriteConfig {
  const config = {
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || '',
    quizzesCollectionId: import.meta.env.VITE_APPWRITE_QUIZZES_COLLECTION_ID || '',
    sessionsCollectionId: import.meta.env.VITE_APPWRITE_SESSIONS_COLLECTION_ID || '',
    participantsCollectionId: import.meta.env.VITE_APPWRITE_PARTICIPANTS_COLLECTION_ID || '',
    answersCollectionId: import.meta.env.VITE_APPWRITE_ANSWERS_COLLECTION_ID || '',
  }

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing Appwrite config: ${missing.join(', ')}`)
  }

  return config
}

function getDatabases() {
  return new Databases(createAppwriteClient())
}

function getAccount() {
  return new Account(createAppwriteClient())
}

function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function getDeviceToken() {
  if (typeof window === 'undefined') return 'server-device'

  const existing = window.localStorage.getItem(DEVICE_TOKEN_KEY)
  if (existing) return existing

  const next = crypto.randomUUID()
  window.localStorage.setItem(DEVICE_TOKEN_KEY, next)
  return next
}

function createJoinCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function createAnswerDocumentId(sessionId: string, questionIndex: number, participantId: string) {
  return `${sessionId}-${questionIndex}-${participantId}`.replace(/[^a-zA-Z0-9._-]/g, '-')
}

function getPublicQuestion(question: QuizQuestion): PublicQuestionPayload {
  return {
    position: question.position,
    prompt: question.prompt,
    options: question.options,
  }
}

function mapQuizDocument(document: QuizDocument): QuizRecord {
  return {
    id: document.$id,
    title: document.title,
    topic: document.topic,
    language: document.language,
    languageLevel: document.languageLevel,
    quizType: document.quizType,
    questionCount: document.questionCount,
    optionsPerQuestion: document.optionsPerQuestion,
    timePerQuestion: document.timePerQuestion,
    questions: safeJsonParse<QuizQuestion[]>(document.questionsJson, []),
    hostUserId: document.hostUserId,
    hostName: document.hostName,
  }
}

function mapSessionDocument(document: SessionDocument): SessionRecord {
  return {
    id: document.$id,
    quizId: document.quizId,
    quizTitle: document.quizTitle,
    hostUserId: document.hostUserId,
    hostName: document.hostName,
    joinCode: document.joinCode,
    joinUrl: document.joinUrl,
    status: document.status,
    currentQuestionIndex: document.currentQuestionIndex,
    currentQuestion: safeJsonParse<PublicQuestionPayload | null>(document.currentQuestionJson, null),
    reveal: safeJsonParse<RevealPayload | null>(document.revealJson, null),
    timePerQuestion: document.timePerQuestion,
    questionStartedAt: document.questionStartedAt || null,
    endedAt: document.endedAt || null,
  }
}

function mapParticipantDocument(document: ParticipantDocument): ParticipantRecord {
  return {
    id: document.$id,
    sessionId: document.sessionId,
    userId: document.userId,
    nickname: document.nickname,
    deviceToken: document.deviceToken,
    score: document.score,
    joinedAt: document.joinedAt,
  }
}

function mapAnswerDocument(document: AnswerDocument): AnswerRecord {
  return {
    id: document.$id,
    sessionId: document.sessionId,
    questionIndex: document.questionIndex,
    participantId: document.participantId,
    participantUserId: document.participantUserId,
    choice: document.choice,
    isCorrect: document.isCorrect,
    responseTimeMs: document.responseTimeMs,
    pointsAwarded: document.pointsAwarded,
    submittedAt: document.submittedAt,
  }
}

export async function ensureAppwriteUser() {
  const account = getAccount()

  try {
    return await account.get()
  } catch {
    await account.createAnonymousSession()
    return account.get()
  }
}

export function buildSessionJoinUrl(sessionId: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
  const basePath = import.meta.env.BASE_URL || '/'
  const normalizedBasePath = basePath === '/' ? '' : basePath.replace(/\/$/, '')
  return `${origin}${normalizedBasePath}#/join/${sessionId}`
}

export function buildSessionHostUrl(sessionId: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
  const basePath = import.meta.env.BASE_URL || '/'
  const normalizedBasePath = basePath === '/' ? '' : basePath.replace(/\/$/, '')
  return `${origin}${normalizedBasePath}#/session/${sessionId}`
}

export async function createQuizAndSession(input: {
  generatedQuiz: GeneratedQuiz
  config: QuizBuilderConfig
  hostName: string
}) {
  const user = await ensureAppwriteUser()
  const databases = getDatabases()
  const config = getConfig()

  const quizDocument = await databases.createDocument<QuizDocument>(
    config.databaseId,
    config.quizzesCollectionId,
    ID.unique(),
    {
      title: input.generatedQuiz.title,
      topic: input.config.topic,
      language: input.config.language,
      languageLevel: input.config.languageLevel,
      quizType: input.config.quizType,
      questionCount: input.generatedQuiz.questions.length,
      optionsPerQuestion: input.config.optionsPerQuestion,
      timePerQuestion: input.config.timePerQuestion,
      questionsJson: JSON.stringify(input.generatedQuiz.questions),
      hostUserId: user.$id,
      hostName: input.hostName,
      createdAt: new Date().toISOString(),
    },
    [
      Permission.read(Role.user(user.$id)),
      Permission.update(Role.user(user.$id)),
      Permission.delete(Role.user(user.$id)),
    ]
  )

  const joinCode = createJoinCode()

  const sessionDocument = await databases.createDocument<SessionDocument>(
    config.databaseId,
    config.sessionsCollectionId,
    ID.unique(),
    {
      quizId: quizDocument.$id,
      quizTitle: input.generatedQuiz.title,
      hostUserId: user.$id,
      hostName: input.hostName,
      joinCode,
      joinUrl: '',
      status: 'lobby',
      currentQuestionIndex: 0,
      currentQuestionJson: '',
      revealJson: '',
      timePerQuestion: input.config.timePerQuestion,
      questionStartedAt: '',
      endedAt: '',
      createdAt: new Date().toISOString(),
    },
    [
      Permission.read(Role.any()),
      Permission.update(Role.user(user.$id)),
      Permission.delete(Role.user(user.$id)),
    ]
  )

  const finalJoinUrl = buildSessionJoinUrl(sessionDocument.$id)
  const updatedSession = await databases.updateDocument<SessionDocument>(
    config.databaseId,
    config.sessionsCollectionId,
    sessionDocument.$id,
    {
      joinUrl: finalJoinUrl,
    }
  )

  return {
    quiz: mapQuizDocument(quizDocument),
    session: mapSessionDocument(updatedSession),
  }
}

export async function getQuiz(quizId: string) {
  const databases = getDatabases()
  const config = getConfig()
  const document = await databases.getDocument<QuizDocument>(
    config.databaseId,
    config.quizzesCollectionId,
    quizId
  )
  return mapQuizDocument(document)
}

export async function getSession(sessionId: string) {
  const databases = getDatabases()
  const config = getConfig()
  const document = await databases.getDocument<SessionDocument>(
    config.databaseId,
    config.sessionsCollectionId,
    sessionId
  )
  return mapSessionDocument(document)
}

export async function listParticipants(sessionId: string) {
  const databases = getDatabases()
  const config = getConfig()
  const response = await databases.listDocuments<ParticipantDocument>(
    config.databaseId,
    config.participantsCollectionId,
    [Query.equal('sessionId', sessionId), Query.limit(500)]
  )
  return response.documents.map(mapParticipantDocument).sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))
}

export async function listAnswers(sessionId: string, questionIndex?: number) {
  const databases = getDatabases()
  const config = getConfig()
  const queries = [Query.equal('sessionId', sessionId), Query.limit(500)]

  if (typeof questionIndex === 'number') {
    queries.push(Query.equal('questionIndex', questionIndex))
  }

  const response = await databases.listDocuments<AnswerDocument>(
    config.databaseId,
    config.answersCollectionId,
    queries
  )

  return response.documents.map(mapAnswerDocument)
}

export async function joinSession(sessionId: string, nickname: string) {
  const user = await ensureAppwriteUser()
  const databases = getDatabases()
  const config = getConfig()
  const session = await getSession(sessionId)
  const deviceToken = getDeviceToken()

  const existing = await databases.listDocuments<ParticipantDocument>(
    config.databaseId,
    config.participantsCollectionId,
    [
      Query.equal('sessionId', sessionId),
      Query.equal('deviceToken', deviceToken),
      Query.limit(1),
    ]
  )

  if (existing.documents[0]) {
    return mapParticipantDocument(existing.documents[0])
  }

  const document = await databases.createDocument<ParticipantDocument>(
    config.databaseId,
    config.participantsCollectionId,
    ID.unique(),
    {
      sessionId,
      userId: user.$id,
      nickname: nickname.trim(),
      deviceToken,
      score: 0,
      joinedAt: new Date().toISOString(),
    },
    [
      Permission.read(Role.any()),
      Permission.update(Role.user(user.$id)),
      Permission.update(Role.user(session.hostUserId)),
      Permission.delete(Role.user(user.$id)),
      Permission.delete(Role.user(session.hostUserId)),
    ]
  )

  return mapParticipantDocument(document)
}

export async function getParticipantByDevice(sessionId: string) {
  const databases = getDatabases()
  const config = getConfig()
  const deviceToken = getDeviceToken()
  const response = await databases.listDocuments<ParticipantDocument>(
    config.databaseId,
    config.participantsCollectionId,
    [Query.equal('sessionId', sessionId), Query.equal('deviceToken', deviceToken), Query.limit(1)]
  )
  return response.documents[0] ? mapParticipantDocument(response.documents[0]) : null
}

export async function submitAnswer(input: {
  sessionId: string
  participant: ParticipantRecord
  choice: string
}) {
  const databases = getDatabases()
  const config = getConfig()
  const session = await getSession(input.sessionId)
  const answerId = createAnswerDocumentId(input.sessionId, session.currentQuestionIndex, input.participant.id)
  const responseTimeMs = session.questionStartedAt
    ? Math.max(0, Date.now() - new Date(session.questionStartedAt).getTime())
    : 0

  const payload = {
    sessionId: input.sessionId,
    questionIndex: session.currentQuestionIndex,
    participantId: input.participant.id,
    participantUserId: input.participant.userId,
    choice: input.choice,
    isCorrect: false,
    responseTimeMs,
    pointsAwarded: 0,
    submittedAt: new Date().toISOString(),
  }

  try {
    const created = await databases.createDocument<AnswerDocument>(
      config.databaseId,
      config.answersCollectionId,
      answerId,
      payload,
      [
        Permission.read(Role.any()),
        Permission.update(Role.user(input.participant.userId)),
        Permission.update(Role.user(session.hostUserId)),
        Permission.delete(Role.user(input.participant.userId)),
        Permission.delete(Role.user(session.hostUserId)),
      ]
    )

    return mapAnswerDocument(created)
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (!message.includes('409')) {
      throw error
    }

    const updated = await databases.updateDocument<AnswerDocument>(
      config.databaseId,
      config.answersCollectionId,
      answerId,
      payload
    )

    return mapAnswerDocument(updated)
  }
}

export async function getAnswer(sessionId: string, questionIndex: number, participantId: string) {
  const databases = getDatabases()
  const config = getConfig()
  const documentId = createAnswerDocumentId(sessionId, questionIndex, participantId)

  try {
    const document = await databases.getDocument<AnswerDocument>(
      config.databaseId,
      config.answersCollectionId,
      documentId
    )
    return mapAnswerDocument(document)
  } catch {
    return null
  }
}

export async function startSessionQuestion(sessionId: string, questionIndex: number) {
  const databases = getDatabases()
  const config = getConfig()
  const session = await getSession(sessionId)
  const quiz = await getQuiz(session.quizId)
  const question = quiz.questions[questionIndex]

  if (!question) {
    throw new Error('Question not found for this session.')
  }

  const updated = await databases.updateDocument<SessionDocument>(
    config.databaseId,
    config.sessionsCollectionId,
    sessionId,
    {
      status: 'question',
      currentQuestionIndex: questionIndex,
      currentQuestionJson: JSON.stringify(getPublicQuestion(question)),
      revealJson: '',
      questionStartedAt: new Date().toISOString(),
      endedAt: '',
    }
  )

  return mapSessionDocument(updated)
}

export async function revealSessionQuestion(sessionId: string) {
  const databases = getDatabases()
  const config = getConfig()
  const session = await getSession(sessionId)
  const quiz = await getQuiz(session.quizId)
  const question = quiz.questions[session.currentQuestionIndex]

  if (!question) {
    throw new Error('Question not found for reveal.')
  }

  const participants = await listParticipants(sessionId)
  const answers = await listAnswers(sessionId, session.currentQuestionIndex)
  const distribution: Record<'A' | 'B' | 'C' | 'D', number> = { A: 0, B: 0, C: 0, D: 0 }
  const participantScoreMap = new Map(participants.map((participant) => [participant.id, participant.score]))

  for (const answer of answers) {
    const choice = answer.choice as 'A' | 'B' | 'C' | 'D'
    if (distribution[choice] !== undefined) {
      distribution[choice] += 1
    }

    const isCorrect = answer.choice === question.correct_answer
    const ratio = 1 - answer.responseTimeMs / (session.timePerQuestion * 1000)
    const rawPoints = Math.round(1000 * ratio)
    const pointsAwarded = isCorrect ? Math.max(100, rawPoints) : 0
    const previousScore = participantScoreMap.get(answer.participantId) ?? 0
    const alreadyAwarded = answer.pointsAwarded > 0
    const scoreWithThisRound = alreadyAwarded ? previousScore : previousScore + pointsAwarded

    participantScoreMap.set(answer.participantId, scoreWithThisRound)

    await databases.updateDocument<AnswerDocument>(
      config.databaseId,
      config.answersCollectionId,
      answer.id,
      {
        isCorrect,
        pointsAwarded,
      }
    )
  }

  await Promise.all(
    participants.map((participant) =>
      databases.updateDocument<ParticipantDocument>(
        config.databaseId,
        config.participantsCollectionId,
        participant.id,
        {
          score: participantScoreMap.get(participant.id) ?? participant.score,
        }
      )
    )
  )

  const revealPayload: RevealPayload = {
    correctAnswer: question.correct_answer,
    explanation: question.explanation,
    distribution,
  }

  const updated = await databases.updateDocument<SessionDocument>(
    config.databaseId,
    config.sessionsCollectionId,
    sessionId,
    {
      status: 'reveal',
      revealJson: JSON.stringify(revealPayload),
    }
  )

  return mapSessionDocument(updated)
}

export async function setSessionLeaderboard(sessionId: string) {
  const databases = getDatabases()
  const config = getConfig()
  const updated = await databases.updateDocument<SessionDocument>(
    config.databaseId,
    config.sessionsCollectionId,
    sessionId,
    {
      status: 'leaderboard',
    }
  )
  return mapSessionDocument(updated)
}

export async function finishSession(sessionId: string) {
  const databases = getDatabases()
  const config = getConfig()
  const updated = await databases.updateDocument<SessionDocument>(
    config.databaseId,
    config.sessionsCollectionId,
    sessionId,
    {
      status: 'finished',
      endedAt: new Date().toISOString(),
    }
  )
  return mapSessionDocument(updated)
}

export function subscribeToSessionChanges(
  sessionId: string,
  onChange: (event: RealtimeResponseEvent<unknown>) => void
) {
  const config = getConfig()
  const client = createAppwriteClient()
  const unsubscribe = client.subscribe(
    [
      `databases.${config.databaseId}.collections.${config.sessionsCollectionId}.documents.${sessionId}`,
      `databases.${config.databaseId}.collections.${config.participantsCollectionId}.documents`,
      `databases.${config.databaseId}.collections.${config.answersCollectionId}.documents`,
    ],
    (event) => {
      const payload = event.payload as Record<string, unknown>
      if (payload.$id === sessionId || payload.sessionId === sessionId) {
        onChange(event)
      }
    }
  )

  return unsubscribe
}