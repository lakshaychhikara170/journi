import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { type } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Determine the mock email body based on type
    let subject = ''
    let body = ''

    if (type === 'summary') {
      subject = 'Your Journi Weekly Summary 📖'
      body = `
        Hi there!
        
        You wrote 5 entries this week and earned a 3-day streak!
        Keep up the amazing journaling habit!
        
        - The Journi Team
      `
    } else if (type === 'friend_activity') {
      subject = 'New Friend Activity on Journi 🔔'
      body = `
        Hey!
        
        Your friend just posted a new entry and reacted to your journal.
        Check it out on the app now!
        
        - The Journi Team
      `
    } else {
      subject = 'Journi Notification'
      body = 'You have a new notification.'
    }

    // ---------------------------------------------------------------------------------
    // 🔥 MOCK EMAIL DISPATCHER
    // In production, you would use Resend, SendGrid, or AWS SES here.
    // e.g. await resend.emails.send({ from: '...', to: user.email, subject, text: body })
    // ---------------------------------------------------------------------------------
    
    console.log('\n=============================================')
    console.log('📧 MOCK EMAIL DISPATCHED TO: ', user.email)
    console.log('📬 SUBJECT: ', subject)
    console.log('📝 BODY:\n', body)
    console.log('=============================================\n')

    return NextResponse.json({ success: true, dispatched: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to dispatch email' }, { status: 500 })
  }
}
