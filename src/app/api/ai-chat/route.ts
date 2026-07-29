import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: 'AI Assistant is currently offline. Please contact support.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Formatting history for Gemini (roles: 'user' or 'model')
    const formattedHistory = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const systemInstruction = `You are the Vyoma OTT AI Sales Assistant. You help users understand the platform. We offer Free, Gold, and Platinum subscriptions. If the user expresses hesitation about price, you should offer them a 10% discount using code "VYOMA10". Keep your answers extremely concise, friendly, and persuasive. Use emojis.`;

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    // We can't pass history directly into create() in the same way with the newest SDK easily,
    // so we'll just append it to the current message for this simple implementation.
    let fullContext = '';
    if (formattedHistory.length > 0) {
      fullContext += "Previous Conversation:\n" + formattedHistory.map((h:any) => `${h.role}: ${h.parts[0].text}`).join("\n") + "\n\n";
    }
    fullContext += `Current User Message: ${message}`;

    const response = await chat.sendMessage({ message: fullContext });

    return NextResponse.json({ reply: response.text });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ reply: 'I encountered an error. Please try again.' });
  }
}
