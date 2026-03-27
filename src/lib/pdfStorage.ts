const DB_NAME = 'lexiview-db'
const STORE_NAME = 'files'
const PDF_KEY = 'current-pdf'
const DB_VERSION = 1

interface PersistedPdf {
  name: string
  type: string
  data: ArrayBuffer
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function savePersistedPdf(file: File): Promise<void> {
  const db = await openDatabase()

  try {
    const payload: PersistedPdf = {
      name: file.name,
      type: file.type,
      data: await file.arrayBuffer(),
    }

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)

      tx.objectStore(STORE_NAME).put(payload, PDF_KEY)
    })
  } finally {
    db.close()
  }
}

export async function loadPersistedPdf(): Promise<File | null> {
  const db = await openDatabase()

  try {
    const payload = await new Promise<PersistedPdf | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      tx.onerror = () => reject(tx.error)
      const request = tx.objectStore(STORE_NAME).get(PDF_KEY)
      request.onsuccess = () => resolve(request.result as PersistedPdf | undefined)
      request.onerror = () => reject(request.error)
    })

    if (!payload) return null

    return new File([payload.data], payload.name, {
      type: payload.type || 'application/pdf',
      lastModified: Date.now(),
    })
  } finally {
    db.close()
  }
}

export async function clearPersistedPdf(): Promise<void> {
  const db = await openDatabase()

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)

      tx.objectStore(STORE_NAME).delete(PDF_KEY)
    })
  } finally {
    db.close()
  }
}
