import axios from 'axios'
import { parsePromptAttributes } from '../services/promptParser.js'

const GENERATION_URL = 'http://127.0.0.1:8000/generate'
const GENERATION_TIMEOUT_MS = 120_000

function createHttpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

export async function generateImage(request, response) {
  const prompt = request.body?.prompt

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw createHttpError(422, 'Request body must include a non-empty prompt string.')
  }

  if (prompt.length > 500) {
    throw createHttpError(422, 'Prompt must be 500 characters or fewer.')
  }

  const attributes = parsePromptAttributes(prompt)

  try {
    const upstreamResponse = await axios.post(GENERATION_URL, attributes, {
      timeout: GENERATION_TIMEOUT_MS,
      responseType: 'arraybuffer',
      headers: { 'Content-Type': 'application/json' },
    })

    const contentType = String(upstreamResponse.headers['content-type'] ?? '')
      .split(';')[0]
      .trim()
      .toLowerCase()

    if (contentType !== 'image/png') {
      throw createHttpError(502, 'AI generation service returned an unexpected content type.')
    }

    response.status(200).type('png').send(Buffer.from(upstreamResponse.data))
  } catch (error) {
    console.error('FastAPI generation request failed:', error.message)
    if (error.status === 502) throw error

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw createHttpError(504, 'AI generation service timed out.')
      }

      throw createHttpError(502, 'AI generation service is unavailable or rejected the request.')
    }

    throw error
  }
}