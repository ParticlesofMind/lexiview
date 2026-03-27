import { Client } from 'appwrite'

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '')
}

export function getAppwriteEndpoint() {
  return trimTrailingSlash(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
}

export function getAppwriteProjectId() {
  return import.meta.env.VITE_APPWRITE_PROJECT_ID || ''
}

export function getAppwriteProjectName() {
  return import.meta.env.VITE_APPWRITE_PROJECT_NAME || 'LexiView'
}

export function createAppwriteClient() {
  const endpoint = getAppwriteEndpoint()
  const projectId = getAppwriteProjectId()

  const client = new Client()
    .setEndpoint(endpoint)

  if (projectId) {
    client.setProject(projectId)
  }

  return client
}

export async function pingAppwrite() {
  const endpoint = getAppwriteEndpoint()
  const projectId = getAppwriteProjectId()

  if (!projectId) {
    throw new Error('Missing VITE_APPWRITE_PROJECT_ID in .env')
  }

  const response = await fetch(`${endpoint}/health/version`, {
    method: 'GET',
    headers: {
      'x-appwrite-project': projectId,
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Appwrite ping failed (${response.status}): ${errorBody}`)
  }

  const payload = (await response.json()) as { version?: string }

  return {
    endpoint,
    projectId,
    version: payload.version || 'unknown',
  }
}
