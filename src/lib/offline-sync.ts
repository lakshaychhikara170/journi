import { createClient } from '@/lib/supabase/client'
import type { Journal } from '@/types'
import { v4 as uuidv4 } from 'uuid'

const DB_NAME = 'journi-offline-db'
const STORE_NAME = 'offline-journals'

// Initialize IndexedDB
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result)
    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error)
  })
}

export interface OfflineJournal {
  id: string
  user_id: string
  title: string
  content: string
  mood: string | null
  location?: any
  photos?: string[]
  visibility: string | null
  audioBlob?: Blob | null // Store the raw blob for later upload
  created_at: number
}

export async function saveOfflineJournal(journal: Omit<OfflineJournal, 'id' | 'created_at'>): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    const record: OfflineJournal = {
      ...journal,
      id: uuidv4(),
      created_at: Date.now()
    }

    const request = store.add(record)
    request.onsuccess = () => resolve()
    request.onerror = (e) => reject(e)
  })
}

export async function getOfflineJournals(): Promise<OfflineJournal[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = (e) => reject(e)
  })
}

export async function clearOfflineJournal(id: string): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = (e) => reject(e)
  })
}

// Background Sync function
export async function syncOfflineJournals(): Promise<void> {
  if (!navigator.onLine) return

  const journals = await getOfflineJournals()
  if (journals.length === 0) return

  const supabase = createClient()
  console.log(`Syncing ${journals.length} offline journals to Supabase...`)

  for (const journal of journals) {
    try {
      let audioUrl = null

      // If there is an offline audio blob, upload it now
      if (journal.audioBlob) {
        const fileExt = 'webm'
        const fileName = `${journal.user_id}/${uuidv4()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('audio')
          .upload(fileName, journal.audioBlob, { contentType: 'audio/webm' })

        if (!uploadError) {
          const { data } = supabase.storage.from('audio').getPublicUrl(fileName)
          audioUrl = data.publicUrl
        }
      }

      // Insert the journal entry to Supabase
      const { error: journalError } = await supabase
        .from('journals')
        .insert({
          user_id: journal.user_id,
          title: journal.title,
          content: journal.content,
          mood: journal.mood,
          location: journal.location,
          photos: journal.photos || [],
          visibility: journal.visibility,
          audio_url: audioUrl as any,
        })

      if (journalError) {
        console.error('Failed to sync journal:', journalError)
      } else {
        // Success! Remove from IndexedDB
        await clearOfflineJournal(journal.id)
        console.log(`Successfully synced offline journal: ${journal.title}`)
      }
    } catch (e) {
      console.error('Error during offline sync iteration:', e)
    }
  }
}
