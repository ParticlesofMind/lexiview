import type {
  GeneratedQuiz,
  QuizBuilderConfig,
  QuizOption,
  QuizQuestion,
} from '../types/dictionary'

type AnthropicContentBlock = {
  type: string
  text?: string
}

type AnthropicMessageResponse = {
  content?: AnthropicContentBlock[]
}

const SYSTEM_PROMPT =
  'You are an expert language teacher and quiz designer. You generate quiz questions for language learners. You will be given a configuration and must return ONLY valid JSON - no preamble, no markdown, no explanation.'

function getExpectedLabels(count: number): Array<'A' | 'B' | 'C' | 'D'> {
  if (count === 2) return ['A', 'B']
  if (count === 3) return ['A', 'B', 'C']
  return ['A', 'B', 'C', 'D']
}

function buildPrompt(config: QuizBuilderConfig): string {
  return `Generate a quiz with the following configuration:

- Language: ${config.language}
- CEFR Level: ${config.languageLevel}
- Topic: ${config.topic}
- Number of questions: ${config.questionCount}
- Options per question: ${config.optionsPerQuestion}
- Quiz type: ${config.quizType}

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

async function requestAnthropic(config: QuizBuilderConfig, apiKey: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildPrompt(config),
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Anthropic request failed (${response.status}): ${errorBody}`)
  }

  const payload = (await response.json()) as AnthropicMessageResponse
  const textBlock = payload.content?.find((block) => block.type === 'text' && typeof block.text === 'string')

  if (!textBlock?.text) {
    throw new Error('Anthropic response did not include text content.')
  }

  return textBlock.text
}

function parseGeneratedQuiz(rawResponse: string, config: QuizBuilderConfig): GeneratedQuiz {
  const jsonBlock = extractJsonBlock(rawResponse)
  const parsed = JSON.parse(jsonBlock) as unknown
  return validateQuizPayload(parsed, config)
}

export async function generateQuiz(config: QuizBuilderConfig): Promise<GeneratedQuiz> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error('Missing VITE_ANTHROPIC_API_KEY. Add it to your .env file and restart Vite.')
  }

  const firstRaw = await requestAnthropic(config, apiKey)

  try {
    return parseGeneratedQuiz(firstRaw, config)
  } catch (firstParseError) {
    const secondRaw = await requestAnthropic(config, apiKey)

    try {
      return parseGeneratedQuiz(secondRaw, config)
    } catch {
      const message = firstParseError instanceof Error ? firstParseError.message : 'Invalid quiz JSON.'
      throw new Error(`Could not parse quiz JSON after retry. ${message}`)
    }
  }
}
