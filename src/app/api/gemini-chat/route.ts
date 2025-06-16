import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { prompt, parse } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    if (parse) {
      try {
        return NextResponse.json(JSON.parse(response));
      } catch (err) {
        if (response.startsWith('```json')) {
          const jsonStr = response.slice(7, -3).trim();
          return NextResponse.json(JSON.parse(jsonStr));
        }
        console.error('Failed to parse response:', err);
        return NextResponse.json({ error: 'Failed to parse Gemini response', raw: response }, { status: 500 });
      }
    }

    return new NextResponse(response);
  } catch (err) {
    console.error('Gemini API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}