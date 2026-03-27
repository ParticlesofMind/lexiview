import type {
  GeneratedQuiz,
  QuizBuilderConfig,
  QuizOption,
  QuizQuestion,
} from '../types/dictionary'

type OllamaGenerateResponse = {
  response?: string
  error?: string
}

const SYSTEM_PROMPT =
  'You are an expert language teacher and quiz designer. You generate quiz questions for language learners. You will be given a configuration and must return ONLY valid JSON - no preamble, no markdown, no explanation.'

function getExpectedLabels(count: number): Array<'A' | 'B' | 'C' | 'D'> {
  if (count === 2) return ['A', 'B']
  if (count === 3) return ['A', 'B', 'C']
  return ['A', 'B', 'C', 'D']
}

function buildPrompt(config: QuizBuilderConfig, extraInstruction?: string): string {
  return `Generate a quiz with the following configuration:

- Language: ${config.language}
- CEFR Level: ${config.languageLevel}
- Topic: ${config.topic}
- Number of questions: ${config.questionCount}
- Options per question: ${config.optionsPerQuestion}
- Quiz type: ${config.quizType}

${extraInstruction ? `Extra instruction:
- ${extraInstruction}
` : ''}

CEFR Level Guidelines:
- A1: Extremely simple vocabulary, present tense only, concrete everyday topics, max 6 words per prompt
- A2: Simple past/future allowed, familiar topics, max 10 words per prompt
- B1: Moderate complexity, common idioms, compound sentences, varied tenses
- B2: Complex grammar, abstract topics, nuanced vocabulary, longer sentences
- C1: Near-native complexity, idiomatic language, sophisticated structures
- C2: Full native complexity, rare vocabulary, ambiguous constructions welcome

Quiz Type Instructions:
- "vocabulary": Each prompt is a word or phrase in ${config.language}; options are definitions or translations.
- "grammar": Each prompt is a sentence with a gap; options are grammatical completions.
- "comprehension": Each prompt is a short sentence or paragraph; options test understanding.
- "translation": Each prompt is a sentence in the student's L1; options are translations into ${config.language}.
- "error_detection": Each prompt is a sentence; one option corrects an error, others are wrong.
- "fill_in_the_blank": Each prompt contains ___; options fill the blank correctly.

Return ONLY this JSON structure, nothing else:

{
  "title": "string - catchy title for this quiz",
  "questions": [
    {
      "position": 1,
      "prompt": "string - the question or sentence",
      "options": [
        { "label": "A", "text": "string" },
        { "label": "B", "text": "string" },
        { "label": "C", "text": "string" },
        { "label": "D", "text": "string" }
      ],
      "correct_answer": "A" | "B" | "C" | "D",
      "explanation": "string - one sentence explaining why the answer is correct, at level-appropriate complexity"
    }
  ]
}

Rules:
- Only one correct answer per question.
- Distractors must be plausible, not obviously wrong.
- All language in prompts and options must be strictly at the ${config.languageLevel} CEFR level.
- The correct answer must be distributed roughly evenly across A/B/C/D positions.
- Never repeat the same correct answer more than 3 times in a row.
- The topic "${config.topic}" must be consistently reflected in all questions.`
}

function extractJsonBlock(raw: string): string {
  const trimmed = raw.trim()

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim()
  }

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1).trim()
  }

  throw new Error('No JSON object found in model response.')
}

function isLabel(value: string): value is 'A' | 'B' | 'C' | 'D' {
  return value === 'A' || value === 'B' || value === 'C' || value === 'D'
}

function normalizeQuestion(
  question: unknown,
  index: number,
  expectedLabels: Array<'A' | 'B' | 'C' | 'D'>
): QuizQuestion {
  if (typeof question !== 'object' || question === null) {
    throw new Error(`Question ${index + 1} is invalid.`)
  }

  const q = question as Record<string, unknown>
  const prompt = typeof q.prompt === 'string' ? q.prompt.trim() : ''
  const explanation = typeof q.explanation === 'string' ? q.explanation.trim() : ''
  const answer = typeof q.correct_answer === 'string' ? q.correct_answer : ''

  if (!prompt) {
    throw new Error(`Question ${index + 1} prompt is missing.`)
  }
  if (!explanation) {
    throw new Error(`Question ${index + 1} explanation is missing.`)
  }
  if (!isLabel(answer)) {
    throw new Error(`Question ${index + 1} has invalid correct_answer.`)
  }

  if (!Array.isArray(q.options)) {
    throw new Error(`Question ${index + 1} options must be an array.`)
  }

  const options = q.options.map((entry, optionIndex) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(`Question ${index + 1} option ${optionIndex + 1} is invalid.`)
    }

    const option = entry as Record<string, unknown>
    const label = typeof option.label === 'string' ? option.label : ''
    const text = typeof option.text === 'string' ? option.text.trim() : ''

    if (!isLabel(label)) {
      throw new Error(`Question ${index + 1} has invalid option label.`)
    }

    if (!text) {
      throw new Error(`Question ${index + 1} option ${label} text is missing.`)
    }

    return { label, text } as QuizOption
  })

  const mapped = expectedLabels
    .map((label) => options.find((opt) => opt.label === label))
    .filter((opt): opt is QuizOption => Boolean(opt))

  if (mapped.length !== expectedLabels.length) {
    throw new Error(`Question ${index + 1} must contain labels ${expectedLabels.join(', ')}.`)
  }

  if (!expectedLabels.includes(answer)) {
    throw new Error(`Question ${index + 1} correct_answer must match options-per-question.`)
  }

  return {
    position: index + 1,
    prompt,
    options: mapped,
    correct_answer: answer,
    explanation,
  }
}

function validateQuizPayload(payload: unknown, config: QuizBuilderConfig): GeneratedQuiz {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Model returned invalid JSON structure.')
  }

  const root = payload as Record<string, unknown>
  const titleCandidate = typeof root.title === 'string' ? root.title.trim() : ''
  const title = titleCandidate || `AI Quiz: ${config.topic}`

  if (!Array.isArray(root.questions)) {
    throw new Error('Model returned invalid questions array.')
  }

  if (root.questions.length === 0) {
    throw new Error('Model returned no questions.')
  }

  const expectedLabels = getExpectedLabels(config.optionsPerQuestion)
  const normalized = root.questions
    .slice(0, config.questionCount)
    .map((question, index) => normalizeQuestion(question, index, expectedLabels))

  if (normalized.length < 1) {
    throw new Error('No valid questions after validation.')
  }

  return {
    title,
    questions: normalized,
  }
}

export function getOllamaBaseUrl() {
  return (import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '')
}

export function getOllamaModel() {
  return import.meta.env.VITE_OLLAMA_MODEL || 'llama3.1:8b'
}

export async function testOllamaConnection(): Promise<{ baseUrl: string; model: string; modelAvailable: boolean }> {
  const baseUrl = getOllamaBaseUrl()
  const model = getOllamaModel()
  const apiKey = import.meta.env.VITE_OLLAMA_API_KEY as string | undefined

  const response = await fetch(`${baseUrl}/api/tags`, {
    method: 'GET',
    headers: {
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Could not reach Ollama at ${baseUrl} (${response.status}): ${errorBody}`)
  }

  const payload = (await response.json()) as {
    models?: Array<{ name?: string; model?: string }>
  }

  const modelAvailable =
    payload.models?.some((entry) => entry.name === model || entry.model === model) ?? false

  return { baseUrl, model, modelAvailable }
}

async function requestOllama(config: QuizBuilderConfig, extraInstruction?: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OLLAMA_API_KEY as string | undefined
  const response = await fetch(`${getOllamaBaseUrl()}/api/generate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: getOllamaModel(),
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(config, extraInstruction),
      format: 'json',
      stream: false,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Ollama request failed (${response.status}): ${errorBody}`)
  }

  const payload = (await response.json()) as OllamaGenerateResponse

  if (payload.error) {
    throw new Error(`Ollama returned an error: ${payload.error}`)
  }

  if (!payload.response) {
    throw new Error('Ollama response did not include generated text.')
  }

  return payload.response
}

function parseGeneratedQuiz(rawResponse: string, config: QuizBuilderConfig): GeneratedQuiz {
  const jsonBlock = extractJsonBlock(rawResponse)
  const parsed = JSON.parse(jsonBlock) as unknown
  return validateQuizPayload(parsed, config)
}

export async function generateQuiz(config: QuizBuilderConfig): Promise<GeneratedQuiz> {
  const firstRaw = await requestOllama(config)

  try {
    return parseGeneratedQuiz(firstRaw, config)
  } catch (firstParseError) {
    const secondRaw = await requestOllama(config)

    try {
      return parseGeneratedQuiz(secondRaw, config)
    } catch {
      const message = firstParseError instanceof Error ? firstParseError.message : 'Invalid quiz JSON.'
      throw new Error(`Could not parse quiz JSON after retry. ${message}`)
    }
  }
}

export async function regenerateQuestion(
  config: QuizBuilderConfig,
  currentQuestion: QuizQuestion
): Promise<QuizQuestion> {
  const singleQuestionConfig: QuizBuilderConfig = {
    ...config,
    questionCount: 1,
  }

  const extraInstruction = `Replace this existing question with a fresh one on the same topic and level, but do not reuse its wording: ${currentQuestion.prompt}`
  const firstRaw = await requestOllama(singleQuestionConfig, extraInstruction)

  let quiz: GeneratedQuiz

  try {
    quiz = parseGeneratedQuiz(firstRaw, singleQuestionConfig)
  } catch (firstParseError) {
    const secondRaw = await requestOllama(singleQuestionConfig, extraInstruction)

    try {
      quiz = parseGeneratedQuiz(secondRaw, singleQuestionConfig)
    } catch {
      const message = firstParseError instanceof Error ? firstParseError.message : 'Invalid quiz JSON.'
      throw new Error(`Could not parse replacement question after retry. ${message}`)
    }
  }

  const [question] = quiz.questions

  if (!question) {
    throw new Error('Model did not return a replacement question.')
  }

  return {
    ...question,
    position: currentQuestion.position,
  }
}
