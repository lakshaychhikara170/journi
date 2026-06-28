import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  // 1. Get user session
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // 2. Fetch all journals for this user
  const { data: journals, error: journalsError } = await supabase
    .from('journals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (journalsError) {
    console.error('Failed to export journals:', journalsError)
    return new NextResponse('Internal Server Error', { status: 500 })
  }

  // 3. Prepare JSON payload
  const exportData = {
    exportDate: new Date().toISOString(),
    user: user.id,
    totalEntries: journals.length,
    entries: journals
  }

  // 4. Return as a downloadable file
  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="journal-export-${new Date().toISOString().split('T')[0]}.json"`
    }
  })
}
