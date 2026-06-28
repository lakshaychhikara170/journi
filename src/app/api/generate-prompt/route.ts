import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function GET() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { prompt: 'What are you most grateful for today?' },
        { status: 200 } // Fallback prompt if no API key
      )
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const promptText = `
      You are an insightful and empathetic journaling assistant.
      Provide a single, creative, and thought-provoking journaling prompt for the user.
      It should be concise (1-2 sentences max).
      Do not include any intro, outro, or quotes. Just the prompt itself.
      Make it unique and reflective.
    `

    const result = await model.generateContent(promptText)
    const text = result.response.text().trim()

    return NextResponse.json({ prompt: text }, { status: 200 })
  } catch (error) {
    console.error('Error generating prompt:', error)
    return NextResponse.json(
      { prompt: 'Describe a small moment from today that made you smile.' },
      { status: 200 } // Fallback prompt on error
    )
  }
}
