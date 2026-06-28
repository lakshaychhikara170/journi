import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const envContent = fs.readFileSync('.env.local', 'utf-8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=')
  if (key && val) env[key.trim()] = val.join('=').trim()
})

const supabase = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
)

async function check() {
  console.log("Checking tables...")
  const tables = ['profiles', 'journals', 'journal_photos', 'friendships', 'comments', 'reactions', 'notifications']
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1)
    if (error) {
      console.log(`Table ${table} error:`, error.message, error.code)
    } else {
      console.log(`Table ${table} EXISTS.`)
    }
  }
}
check()
