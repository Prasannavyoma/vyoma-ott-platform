'use server';

import prisma from "@/lib/prisma";

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

/**
 * Server action to communicate with the AI Agent (Vyoma Guru)
 */
export async function askAiAgent(
  userMessage: string, 
  chatHistory: ChatMessage[] = [],
  videoContext?: { courseTitle: string, episodeTitle: string }
) {
  try {
    // 1. Check for API key (environment variable or database SystemSetting)
    let apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'GEMINI_API_KEY' }
      });
      if (setting?.value) {
        apiKey = setting.value;
      }
    }

    // 2. Fetch all courses dynamically to act as the chatbot's knowledge base
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        contentType: true,
        accessLevel: true,
        price: true,
        priceUSD: true
      }
    });

    const coursesContext = courses.map(c => 
      `- Title: "${c.title}"
        ID: ${c.id}
        Category: ${c.category || 'General'}
        Type: ${c.contentType}
        Access Level: ${c.accessLevel}
        Price: ${c.price ? `₹${c.price}` : 'Free/Subscription'} (USD: ${c.priceUSD ? `$${c.priceUSD}` : 'N/A'})
        Full Description: ${c.description}`
    ).join('\n\n');

    // 3. Fetch custom FAQs from the database
    const faqs = await prisma.aiFaq.findMany();
    const faqsContext = faqs.map(f => 
      `- Question: "${f.question}"
        Answer: "${f.answer}"`
    ).join('\n\n');

    // 3.5 Fetch Custom CMS Pages for full site knowledge
    const customPages = await prisma.customPage.findMany();
    const customPagesContext = customPages.map(p =>
      `- Page Title: "${p.title}"
        URL Slug: "/${p.slug}"
        Content: ${p.content}`
    ).join('\n\n');

    // 3.6 Fetch Bundles
    const bundles = await prisma.bundle.findMany();
    const bundlesContext = bundles.map(b =>
      `- Bundle: "${b.title}"
        Price: ₹${b.price}
        Description: ${b.description}`
    ).join('\n\n');

    // 4. Fetch custom behavior directive from Super Admin configurations
    const directiveSetting = await prisma.systemSetting.findUnique({
      where: { key: 'AI_CUSTOM_DIRECTIVE' }
    });
    const customDirective = directiveSetting?.value || '';

    // Fetch Gamification Coin Settings to prevent AI hallucinations
    const coinSettings = await prisma.systemSetting.findMany({
      where: { key: { in: ['COINS_VIDEO_REWARD', 'COINS_COURSE_REWARD', 'COINS_REGISTRATION', 'COINS_PROFILE'] } }
    });
    const getCoinValue = (key: string, def: string) => coinSettings.find(s => s.key === key)?.value || def;

    // 5. Define the System Instruction with strict platform guidelines and Super Admin rules
    const systemPrompt = `You are "Vyoma Guru", the dedicated virtual learning guide for the Vyoma Sanskrit OTT platform.
Your objective is to answer questions, guide navigation, explain features, and details about Sanskrit courses available on this website.

${videoContext ? `CURRENT USER CONTEXT (CRITICAL):
The user is currently inside the video player watching the episode "${videoContext.episodeTitle}" from the course "${videoContext.courseTitle}".
If they ask questions like "explain this", "what does this mean", or ask a question about the content, assume they are asking about this specific course and episode!` : ''}

DYNAMIC WEBSITE CONTENT:
---
AVAILABLE COURSES:
${coursesContext || 'No courses listed currently.'}

COURSE BUNDLES:
${bundlesContext || 'No bundles currently.'}

CUSTOM INFORMATION PAGES (Important platform knowledge):
${customPagesContext || 'No custom pages loaded.'}

PLATFORM PLANS & TIERS:
- FREE Plan: Access to free courses and video trailers.
- GOLD Subscription (Monthly or Yearly): Grants full access to standard videos, audiobooks, podcasts, and study tools.
- PLATINUM Subscription (Monthly or Yearly): Grants all Gold features + premium content, private group studies, and exclusive programs.

PLATFORM NAVIGATION PATHS:
- Homepage / Browse: "/"
- Explore / Search: "/explore"
- User Profile: "/profile"
- Progress Tracker: "/progress"
- Gift Wisdom (Subscription vouchers): "/gift"
- Login: "/login"
- Register: "/register"

SPECIAL SYSTEM FEATURES:
- Study Rooms: Multiplayer watch sessions to study and watch lessons synchronously with other students in real-time. Accessible via watch pages.
- Sanskrit Coins System: A gamified rewards wallet where users earn coins. Exact rewards: ${getCoinValue('COINS_REGISTRATION', '0')} coins for registering, ${getCoinValue('COINS_PROFILE', '0')} for completing profile, ${getCoinValue('COINS_VIDEO_REWARD', '2')} per video, and ${getCoinValue('COINS_COURSE_REWARD', '10')} per course completion.
- Flashcards: A Leitner box memory system (1 to 5 boxes) to learn and review Sanskrit vocabulary. Accessible in watch page sidebars.
- Certificates: Earned automatically when a user passes all quizzes associated with a course.

FREQUENTLY ASKED QUESTIONS (CUSTOM KNOWLEDGE BASE):
${faqsContext || 'No custom FAQs loaded.'}

SUPER ADMIN BEHAVIOR DIRECTIVES (MUST OBEY AND ENFORCE):
${customDirective || 'No custom prompt directives.'}

CRITICAL RULES & GUARDRAILS:
1. ONLY discuss Vyoma Sanskrit OTT, its courses, features, subscriptions, coins, certificates, study rooms, flashcards, or navigation.
2. If the user asks general questions (e.g. general programming, homework, recipe, writing articles, unrelated translations, global news, pop culture, math, or other non-platform related topics), you MUST politely refuse.
   Strictly respond in this format: "I am Vyoma Guru, your guide specifically for the Vyoma Sanskrit OTT platform. I can only assist you with questions related to our platform, courses, and features."
3. Keep answers concise, premium, readable, and structured. Use bullet points and bold styling where appropriate.
4. If referring to page links, format them as markdown links, e.g., [Profile Page](/profile), [Explore](/explore), or [Gift Vouchers](/gift).
`;

    // 5.5 Check Chatbot Mode for Custom API redirect
    const modeSetting = await prisma.systemSetting.findUnique({
      where: { key: 'CHATBOT_MODE' }
    });
    const chatbotMode = modeSetting?.value || 'BUILTIN';

    if (chatbotMode === 'CUSTOM_API') {
      const customUrlSetting = await prisma.systemSetting.findUnique({
        where: { key: 'CHATBOT_CUSTOM_API_URL' }
      });
      const customKeySetting = await prisma.systemSetting.findUnique({
        where: { key: 'CHATBOT_CUSTOM_API_KEY' }
      });

      const customUrl = customUrlSetting?.value || '';
      const customKey = customKeySetting?.value || '';

      if (!customUrl) {
        return "I am sorry, but the Custom Chatbot API URL is not configured. Please contact the administrator.";
      }

      const response = await fetch(customUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customKey}`,
        },
        body: JSON.stringify({
          message: userMessage,
          history: chatHistory,
          systemInstruction: systemPrompt
        })
      });

      if (!response.ok) {
        return `Custom API error (Status: ${response.status}). Please verify the chatbot configuration.`;
      }

      const data = await response.json();
      const reply = data.reply || data.response || data.text || data.choices?.[0]?.message?.content;
      if (!reply) {
        return "The custom AI agent returned an empty response. Please verify the API settings.";
      }
      return reply;
    }

    // 6. Fallback Mode if API Key is not set
    if (!apiKey) {
      return getSimulatedResponse(userMessage, courses, faqs, customDirective);
    }

    // 7. Call Gemini API
    const formattedContents = [
      ...chatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: formattedContents,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 800,
          }
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error details:', errText);
      return `I encountered an error trying to process your request. (Status: ${response.status}). Please verify the GEMINI_API_KEY setting.`;
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!reply) {
      return "I'm sorry, I couldn't formulate a response. Please try asking again.";
    }

    return reply;

  } catch (error: any) {
    console.error('AI Agent Error:', error);
    return `An unexpected error occurred: ${error.message || 'Unknown error'}`;
  }
}

/**
 * Safe simulated response provider for testing when API keys are not yet configured.
 */
function getSimulatedResponse(msg: string, courses: any[], faqs: any[], customDirective: string): string {
  const query = msg.toLowerCase();

  // Guardrail check
  const isPlatformRelated = /course|sanskrit|vyoma|study|room|coin|points|register|login|profile|progress|gift|voucher|price|fee|pay|tier|sub|gold|plat|cert|quiz|card|flash|help|faq/i.test(query);

  if (!isPlatformRelated) {
    return "I am Vyoma Guru, your guide specifically for the Vyoma Sanskrit OTT platform. I can only assist you with questions related to our platform, courses, and features.";
  }

  let intro = '';
  if (customDirective) {
    intro += `*Super Admin Custom Directive applied:* "${customDirective}"\n\n`;
  }

  // Look for matches in custom FAQs first
  for (const faq of faqs) {
    const questionWords = faq.question.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w: string) => w.length > 4 && !['sanskrit', 'course', 'vyoma', 'what', 'how', 'when', 'where'].includes(w));
    // Require at least one significant keyword match
    const matches = questionWords.some((word: string) => query.includes(word));
    if (matches && questionWords.length > 0) {
      return intro + `**${faq.question}**\n\n${faq.answer}`;
    }
  }

  if (query.includes('course') || query.includes('browse') || query.includes('list')) {
    if (courses.length === 0) {
      return intro + "We offer various Sanskrit courses, but no courses were found in the database right now.";
    }
    const list = courses.slice(0, 5).map(c => `- **${c.title}** (${c.contentType}) - ${c.category || 'General'}`).join('\n');
    return intro + `Here are some of the courses available on our platform:\n\n${list}\n\nTo view all of them, head over to the [Explore Page](/explore).`;
  }

  if (query.includes('sub') || query.includes('tier') || query.includes('price') || query.includes('gold') || query.includes('plat') || query.includes('pay')) {
    return intro + `We have three tiers of access:\n\n` +
      `- **FREE Plan**: Check out course descriptions, watch trailers, and try free trial episodes.\n` +
      `- **GOLD Subscription**: Grants full access to all standard lessons, audiobooks, podcasts, and learning tools.\n` +
      `- **PLATINUM Subscription**: Everything in Gold, plus premium courses and private study rooms.\n\n` +
      `You can subscribe or view prices on the [Subscription Page](/subscribe).`;
  }

  if (query.includes('cert') || query.includes('pass') || query.includes('quiz')) {
    return intro + `Yes! You can earn official **Certificates** by successfully passing the quizzes under each course with a score of 50% or higher. View your certificates anytime on the [Progress Page](/progress).`;
  }

  if (query.includes('coin') || query.includes('reward') || query.includes('points')) {
    return intro + `**Sanskrit Coins** are our gamified rewards! You can earn them by:\n` +
      `- Registering on the platform (+50 coins)\n` +
      `- Completing your avatar/profile profile details (+30 coins)\n` +
      `- Reaching video milestone rewards.\n\n` +
      `Check your coin balance on your [Profile Page](/profile).`;
  }

  if (query.includes('room') || query.includes('study') || query.includes('watch')) {
    return intro + `Our **Study Rooms** allow you to study in groups. You can start a multiplayer sync-session from any video watch page, send the URL to your friends, and study together synchronously with live chat!`;
  }

  if (query.includes('flash') || query.includes('vocab') || query.includes('card')) {
    return intro + `We use a **Flashcard system** based on the Leitner memory technique. You can add Sanskrit vocabulary words to your study list during video playback, and test yourself periodically.`;
  }

  return intro + `Hello! I am **Vyoma Guru**, your virtual assistant. I can help you with:\n\n` +
    `- **Courses**: Ask me to list our Sanskrit courses.\n` +
    `- **Subscriptions**: Learn about Gold & Platinum plans.\n` +
    `- **Gamification & Rewards**: Ask about Sanskrit Coins and Certificates.\n` +
    `- **Study Tools**: Ask about Study Rooms or Flashcards.\n` +
    `- **Navigation**: Get quick links to search, profile, or vouchers.`;
}
