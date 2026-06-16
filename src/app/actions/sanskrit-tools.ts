'use server';

import prisma from "@/lib/prisma";

export async function analyzeSanskritGrammar(text: string) {
  try {
    if (!text || !text.trim()) {
      throw new Error("Sanskrit text is required.");
    }

    let apiKey = '';
    
    // 1. Check for specific Sanskrit Hub key in DB
    const sanskritSetting = await prisma.systemSetting.findUnique({
      where: { key: 'SANSKRIT_GEMINI_KEY' }
    });
    if (sanskritSetting?.value) {
      apiKey = sanskritSetting.value;
    }

    // 2. Fall back to global chatbot key in DB
    if (!apiKey) {
      const globalSetting = await prisma.systemSetting.findUnique({
        where: { key: 'GEMINI_API_KEY' }
      });
      if (globalSetting?.value) {
        apiKey = globalSetting.value;
      }
    }

    // 3. Fall back to environment variable
    if (!apiKey) {
      apiKey = process.env.GEMINI_API_KEY || '';
    }

    if (!apiKey) {
      return getSimulatedGrammarAnalysis(text);
    }

    const prompt = `Analyze the following Sanskrit text: "${text}".
Provide the response strictly as a JSON object with the following fields:
1. "translation": Full English translation.
2. "sandhiSplit": Array of objects showing Sandhi split (compound words). Each object should contain:
   - "word": The original compound word.
   - "split": Array of individual words (components).
   - "rule": The Sandhi rule applied (in simple English/Sanskrit terms).
3. "wordsBreakdown": Array of objects for each Sanskrit word in the sentence. Each object should contain:
   - "word": The word as it appears in the sentence.
   - "root": The dictionary base form (Pratipadika for nouns, Dhatu for verbs).
   - "pos": Part of Speech (Noun, Verb, Indeclinable, Pronoun, Adjective).
   - "analysis": Grammatical analysis (e.g., Vibhakti (Case), Linga (Gender), Vachana (Number) for nouns; Lakara (Tense), Purusha (Person), Vachana for verbs).

Make sure the JSON is valid and only return the JSON, no markdown formatting.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error (Status: ${response.status})`);
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!replyText) {
      throw new Error("Empty response received from Gemini.");
    }

    return JSON.parse(replyText);
  } catch (error: any) {
    console.error("Grammar Analyzer Error:", error);
    throw new Error(error.message || "Failed to analyze grammar.");
  }
}

function getSimulatedGrammarAnalysis(text: string) {
  const clean = text.trim();
  if (clean.includes("नमामि") || clean.includes("संस्कृत")) {
    return {
      translation: "I salute Sanskrit daily.",
      sandhiSplit: [
        { word: "संस्कृतंनित्यम्", split: ["संस्कृतम्", "नित्यम्"], rule: "Anusvara Sandhi" }
      ],
      wordsBreakdown: [
        { word: "नमामि", root: "नम् (nam)", pos: "Verb", analysis: "Lat Lakara (Present Tense), Uttama Purusha (1st Person), Eka Vachana (Singular)" },
        { word: "संस्कृतम्", root: "संस्कृत (samskrta)", pos: "Noun", analysis: "Dvitiya Vibhakti (2nd Case / Accusative), Napumsakalinga (Neuter), Eka Vachana" },
        { word: "नित्यम्", root: "नित्य (nitya)", pos: "Indeclinable", analysis: "Adverbial usage, meaning 'always' or 'daily'" }
      ]
    };
  }

  return {
    translation: `Translation of "${text}" (Simulated Standby Mode)`,
    sandhiSplit: [],
    wordsBreakdown: clean.split(/\s+/).map(word => ({
      word,
      root: word,
      pos: "Noun / Verb",
      analysis: "Prathama Vibhakti, Eka Vachana (Configure GEMINI_API_KEY in Settings for full case breakdowns)"
    }))
  };
}
