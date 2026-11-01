const GENERATION_ENDPOINT = 'http://localhost:5000/api/generate'

export async function generateImageFromPrompt(prompt) {
  let response

  try {
    response = await fetch(GENERATION_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
  } catch {
    throw new Error('Could not reach the FaceForge backend. Check that it is running on port 5000.')
  }

  if (!response.ok) {
    let errorBody = {}
    try {
      errorBody = await response.json()
    } catch {
      errorBody = {}
    }

    const serverMessage = errorBody.message ?? errorBody.detail
    if (response.status === 422) {
      throw new Error(serverMessage ?? 'The prompt contains unsupported or conflicting attributes.')
    }
    if (response.status === 504) {
      throw new Error('Image generation timed out. Please try again.')
    }
    if (response.status >= 502) {
      throw new Error('The model service is unavailable. Make sure it is running and try again.')
    }

    throw new Error(serverMessage ?? `Image generation failed (HTTP ${response.status}).`)
  }

  const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
  if (contentType !== 'image/png') {
    throw new Error('The generation service returned an unexpected response instead of a PNG image.')
  }

  const imageBlob = await response.blob()
  if (imageBlob.size === 0) {
    throw new Error('The generation service returned an empty image.')
  }

  return imageBlob
}