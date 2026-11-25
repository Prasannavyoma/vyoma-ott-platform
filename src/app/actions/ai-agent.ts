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
        priceUSD: true,
        hasFreeTrial: true,
        _count: {
          select: { episodes: true }
        }
      }
    });

    const coursesContext = courses.map(c => 
      `- Title: "${c.title}"
        ID: ${c.id}
        Category: ${c.category || 'General'}
        Type: ${c.contentType}
        Episodes Count: ${c._count?.episodes || 0}
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

    // Fetch Support / Contact Settings dynamically
    const contactSettings = await prisma.systemSetting.findMany({
      where: { key: { in: ['CONTACT_PHONE_NUMBER', 'CONTACT_WHATSAPP_NUMBER', 'CONTACT_EMAIL_ADDRESS'] } }
    });
    const getContactVal = (key: string, def: string) => contactSettings.find(s => s.key === key)?.value || def;

    const contactInfo = {
      phone: getContactVal('CONTACT_PHONE_NUMBER', '+91 98765 43210'),
      whatsapp: getContactVal('CONTACT_WHATSAPP_NUMBER', '+91 98765 43210'),
      email: getContactVal('CONTACT_EMAIL_ADDRESS', 'support@vyomasanskrit.in')
    };

    const coinValues = {
      registration: getCoinValue('COINS_REGISTRATION', '50'),
      profile: getCoinValue('COINS_PROFILE', '30'),
      video: getCoinValue('COINS_VIDEO_REWARD', '2'),
      course: getCoinValue('COINS_COURSE_REWARD', '10')
    };

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

COMMON USER TROUBLESHOOTING & HELP PROCEDURES (CRITICAL):
- HOW TO LOGIN / SIGN IN:
  Navigate to "/login". Enter your registered email address or username and password, or click "Sign in with Google". If not registered yet, sign up at "/register".
- FORGOT PASSWORD / PASSWORD FORGOTTEN:
  Go to "/forgot-password" (or click "Forgot Password?" on "/login"). Enter your registered email to receive a secure password reset link. Check Spam/Junk folder if not seen within 2 minutes. Click the link to set a new password.
- PLAN NOT ACTIVATED / PAID BUT SUBSCRIPTION NOT SHOWING:
  1. Refresh user session: Log out and log back in, or hard-refresh the page (Ctrl+F5) to reload updated membership status.
  2. Processing delay: UPI/Netbanking payments can take 1-2 minutes for Razorpay webhook verification.
  3. Check invoice in "/profile".
  4. If still not activated, send Payment ID to support via WhatsApp or email.
- HOW TO USE CONTENT / GETTING STARTED:
  Browse courses at "/explore" -> click any course to launch player at "/watch/[id]" -> select episodes from the sidebar -> use Flashcards or Notes -> take Quizzes to earn certificates.
- VIDEO PLAYBACK / BUFFERING ISSUES:
  Check internet connection (2+ Mbps required), disable aggressive browser ad-blockers, clear browser cache, or try an Incognito window.

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

    // 6. Built-in Knowledge Retrieval & Response Engine
    if (!apiKey) {
      return getSimulatedResponse(userMessage, courses, faqs, customDirective, {
        bundles,
        customPages,
        coinValues,
        contactInfo,
        videoContext
      });
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

    let response = await fetch(
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

    // Fallback to gemini-1.5-flash if 2.5 is not available on this API key or model tier
    if (!response.ok && (response.status === 404 || response.status === 400)) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
    }

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

interface KnowledgeEngineData {
  bundles?: any[];
  customPages?: any[];
  coinValues?: {
    registration: string;
    profile: string;
    video: string;
    course: string;
  };
  contactInfo?: {
    phone: string;
    whatsapp: string;
    email: string;
  };
  videoContext?: { courseTitle: string; episodeTitle: string };
}

/**
 * Enterprise Built-in Knowledge Retrieval Engine (Vyoma Guru Core).
 * Delivers accurate, contextual, high-precision answers for platform curriculum,
 * Sanskrit study tools, gamification, certificates, and subscriptions.
 */
function getSimulatedResponse(
  msg: string, 
  courses: any[], 
  faqs: any[], 
  customDirective: string,
  extraData?: KnowledgeEngineData
): string {
  const query = msg.toLowerCase().trim();
  const rawTokens = query.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 1);
  const stopWords = new Set(['what', 'which', 'where', 'when', 'who', 'how', 'why', 'can', 'could', 'would', 'should', 'the', 'this', 'that', 'with', 'from', 'have', 'does', 'your', 'about', 'some', 'please', 'tell']);
  const meaningfulTokens = rawTokens.filter(w => !stopWords.has(w));

  let intro = '';
  if (customDirective) {
    intro += `*Super Admin Directive:* "${customDirective}"\n\n`;
  }

  // 1. Current Video Context Interception
  if (extraData?.videoContext && (query.includes('this') || query.includes('episode') || query.includes('video') || query.includes('explain') || query.includes('here') || query.includes('lesson'))) {
    const vc = extraData.videoContext;
    return intro + `Namaste! 🙏 You are currently watching **"${vc.episodeTitle}"** from the course **"${vc.courseTitle}"**.\n\n` +
      `- Use the **Flashcard Tab** in the player sidebar to save and review Sanskrit vocabulary from this lesson.\n` +
      `- Want to study with peers? Click **"Start Study Room"** to launch a live synchronized study session.\n` +
      `- Completed this video? You will earn **${extraData.coinValues?.video || '2'} Sanskrit Coins** automatically towards your next reward!`;
  }

  // 2. Custom Super Admin FAQs Matcher (Exact & Overlap Scoring)
  if (faqs && faqs.length > 0) {
    let bestFaq: any = null;
    let highestFaqScore = 0;

    for (const faq of faqs) {
      const qTokens = faq.question.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w: string) => w.length > 2 && !stopWords.has(w));
      if (qTokens.length === 0) continue;

      let score = 0;
      if (faq.question.toLowerCase().includes(query) || query.includes(faq.question.toLowerCase())) {
        score += 50;
      }
      for (const t of meaningfulTokens) {
        if (qTokens.includes(t)) score += 15;
      }

      if (score > highestFaqScore && score >= 15) {
        highestFaqScore = score;
        bestFaq = faq;
      }
    }

    if (bestFaq) {
      return intro + `**${bestFaq.question}**\n\n${bestFaq.answer}`;
    }
  }

  // 3. Greetings & Courtesy
  const greetings = ['hi', 'hello', 'namaste', 'namaskar', 'pranam', 'hey', 'greetings', 'hari om', 'shubhodaya'];
  if (greetings.includes(query) || (rawTokens.length <= 2 && greetings.some(g => query.includes(g)))) {
    return intro + `Namaste! 🙏 I am **Vyoma Guru**, your personal guide for the Vyoma Sanskrit OTT platform.\n\n` +
      `Here is what I can assist you with:\n` +
      `- **Explore Courses**: Ask for recommendations on Grammar, Ramayana, Gita, Stotras, or Kids courses.\n` +
      `- **Getting Started**: Ask **"How to use content?"** or **"How to login?"**.\n` +
      `- **Troubleshooting**: Ask about **"Forgot password?"** or **"My plan not activated?"**.\n` +
      `- **Study Tools**: Ask about **Study Rooms**, **Leitner Flashcards**, or **Sanskrit Grammar Tools**.\n` +
      `- **Rewards & Coins**: Learn how to earn **Sanskrit Coins** and unlock **Official Certificates**.\n` +
      `- **Membership**: Inquire about **Free, Gold, and Platinum** plans and discounts.\n\n` +
      `What would you like assistance with today?`;
  }

  // 3.1 Forgot Password / Password Reset Assistance
  if (/forgot.*password|forg[oe]t?en.*password|forgern|forgon|lost.*password|reset.*password|cant.*remember.*password|change.*password/i.test(query)) {
    return intro + `### 🔑 How to Reset or Recover Your Password\n\n` +
      `If you have forgotten your password, follow these simple steps to regain access:\n\n` +
      `1. **Go to Forgot Password**: Click directly on the [Forgot Password Page](/forgot-password) (or click *"Forgot Password?"* on the [Sign In Page](/login)).\n` +
      `2. **Enter Your Email**: Type your registered email address and click **"Send Reset Link"**.\n` +
      `3. **Check Your Inbox**: You will receive a secure reset link within 1–2 minutes.\n` +
      `   *(💡 Tip: If you don't see it in your Inbox, please check your **Spam / Junk** folder).* \n` +
      `4. **Set New Password**: Click the link in the email and create your new secure password.\n\n` +
      `*Already logged in?* You can update your credentials anytime at [Change Password](/change-password).`;
  }

  // 3.2 Plan Not Activated / Payment Deducted / Subscription Pending
  if (/(plan|subscription|gold|platinum).*not.*(activ|work|show)|paid.*not.*(activ|work|show)|not.*activ[ae]ted|money.*deducted|amount.*deducted|charged.*free|payment.*failed|payment.*done.*free/i.test(query)) {
    const ci = extraData?.contactInfo || { phone: '+91 98765 43210', whatsapp: '+91 98765 43210', email: 'support@vyomasanskrit.in' };
    const cleanWa = ci.whatsapp.replace(/[^0-9]/g, '');

    return intro + `### 🛡️ Subscription Activation Help & Assurance\n\n` +
      `Please don't worry! If your payment was deducted, your funds and plan are completely safe. Here is how to quickly resolve this:\n\n` +
      `1. **Refresh Your Active Session (Most Common Fix)**:\n` +
      `   - Often, your browser simply needs to re-fetch the latest subscription badge from the server.\n` +
      `   - Please click [Sign Out](/profile) and log back in, or perform a hard refresh (**Ctrl + F5** on Windows or **Cmd + Shift + R** on Mac).\n\n` +
      `2. **Banking / Webhook Clearance**:\n` +
      `   - Payments via UPI or Netbanking through Razorpay occasionally take 1–2 minutes for bank confirmation.\n` +
      `   - Verify if the invoice appears on your [Profile & Invoices Page](/profile).\n\n` +
      `3. **Fast-Track Priority Support**:\n` +
      `   - If your Gold/Platinum badge does not appear after 5 minutes, our team will manually activate your account immediately.\n` +
      `   - Please message us with your **Registered Email** and **Payment ID / Order ID**:\n` +
      `     - 💬 **WhatsApp**: [Chat Directly on WhatsApp](https://wa.me/${cleanWa})\n` +
      `     - 📧 **Email**: [${ci.email}](mailto:${ci.email})\n` +
      `     - 📞 **Phone**: **${ci.phone}**`;
  }

  // 3.3 How to Login / Sign In / Registration Assistance
  if (/how to (login|sign in|log in|register|create account|signup)|cant.*login|cannot.*login|login.*(issue|problem|error)|sign in.*(problem|issue)/i.test(query)) {
    return intro + `### 🚪 How to Sign In or Create an Account\n\n` +
      `Accessing your Vyoma Sanskrit account is fast and easy:\n\n` +
      `1. **Sign In to Existing Account**:\n` +
      `   - Go to the [Sign In Page](/login).\n` +
      `   - Enter your registered **Email Address** (or Username) and **Password**.\n` +
      `   - Or click **"Sign In with Google"** for instant 1-click access.\n\n` +
      `2. **New to Vyoma? Register in Seconds**:\n` +
      `   - Visit the [Registration Page](/register).\n` +
      `   - Enter your name, email, and choose a password.\n` +
      `   - You'll instantly receive **+50 Sanskrit Coins** as a welcome reward!\n\n` +
      `3. **Troubleshooting Login Errors**:\n` +
      `   - *Incorrect Password?* Reset it in 30 seconds via [Forgot Password](/forgot-password).\n` +
      `   - *Too many failed attempts?* For your security, the account enters a 15-minute cooldown before allowing further attempts.`;
  }

  // 3.4 How to Use Content / Getting Started Guide
  if (/how to (use|watch|learn|navigate|start|access).*content|how (does it work|to start|to use)|where to start|getting started|how.*watch.*video|how.*use.*platform/i.test(query)) {
    return intro + `### 🎓 How to Use Vyoma Sanskrit Content (Quick Start Guide)\n\n` +
      `Here is how to get the most out of the Vyoma platform in 5 easy steps:\n\n` +
      `1. **Discover Courses**: Visit the [Explore Catalog](/explore) or homepage to browse topics like Grammar, Ramayana, Gita, Stotras, and Children's learning.\n` +
      `2. **Start Video/Audio Playback**: Click on any course card to open the [Watch Player](/watch). Lessons play in high-definition HLS streaming with audio-only and speed control toggles.\n` +
      `3. **Navigate Chapters**: Use the right-hand episode list to track completed lessons and resume wherever you left off.\n` +
      `4. **Use In-Player Study Tools**:\n` +
      `   - 🗂️ **Flashcards**: Click the Flashcards tab in the player sidebar to save and review Sanskrit vocabulary.\n` +
      `   - 📝 **Notes**: Take timestamped personal study notes while watching.\n` +
      `   - 👥 **Study Rooms**: Click *"Start Study Room"* to invite friends to watch and discuss Shlokas together in real time.\n` +
      `5. **Take Quizzes & Earn Certificates**: Complete module quizzes with a 50%+ score to earn your verifiable Sanskrit Certificate on your [Progress Page](/progress)!`;
  }

  // 3.5 Video Playback & Technical Troubleshooting
  if (/video.*not.*(play|load|work)|black.*screen|buffering|stuck|blank.*screen|audio.*not.*work|error.*playing|cant.*play/i.test(query)) {
    return intro + `### ⚙️ Video & Playback Troubleshooting\n\n` +
      `If you experience buffering, a black screen, or playback errors, try these quick fixes:\n\n` +
      `1. **Internet Speed**: Ensure an active connection with at least 2–5 Mbps bandwidth.\n` +
      `2. **Ad-Blockers & Privacy Extensions**: Aggressive browser ad-blockers can mistakenly block video media segments. Try pausing ad-blockers or whitelisting the site.\n` +
      `3. **Browser Cache / Incognito**: Open the page in a Private/Incognito window or clear your browser cache.\n` +
      `4. **Supported Browsers**: We recommend updated Chrome, Safari, Edge, or Firefox.\n\n` +
      `If an issue persists on a specific video, please reach out to our [Helpdesk Support](/profile) and mention the episode title!`;
  }

  // 3.6 Voucher & Discount Coupon Assistance
  if (/voucher.*not.*(work|apply|valid)|coupon.*(error|invalid|not work)|cant.*redeem/i.test(query)) {
    return intro + `### 🎟️ Voucher & Coupon Redemption Tips\n\n` +
      `If your discount code or gift voucher is not applying:\n\n` +
      `1. **Check for Extra Spaces**: Ensure no accidental spaces were pasted before or after the code.\n` +
      `2. **Case Sensitivity**: Codes are generally uppercase (e.g., \`VYOMA10\`).\n` +
      `3. **One-Time Use**: Gift vouchers can only be redeemed once per account.\n` +
      `4. **Eligible Tier**: Some vouchers are specific to Gold or Platinum annual plans.\n\n` +
      `Need assistance redeeming a gift? Contact us via [WhatsApp Support](https://wa.me/919876543210) with your code!`;
  }

  // 4. Sanskrit Coins & Gamification Engine
  if (/coin|coins|reward|rewards|xp|point|points|wallet|streak|milestone|earn/i.test(query)) {
    const c = extraData?.coinValues || { registration: '50', profile: '30', video: '2', course: '10' };
    return intro + `### 🪙 Vyoma Sanskrit Coins & Gamification\n\n` +
      `You earn Sanskrit Coins as you progress on your learning journey:\n\n` +
      `- **Welcome Reward**: **+${c.registration} Coins** on account signup.\n` +
      `- **Profile Completion**: **+${c.profile} Coins** for adding your name and profile avatar.\n` +
      `- **Lesson Telemetry**: **+${c.video} Coins** for each video lesson you watch.\n` +
      `- **Course Completion**: **+${c.course} Coins** when you complete an entire curriculum.\n` +
      `- **Daily Streaks**: Maintain daily study streaks to earn bonus XP points and level up your learner rank.\n\n` +
      `💰 You can check your coin balance and unlock rewards anytime in your [Learner Profile & Wallet](/profile).`;
  }

  // 5. Multiplayer Study Rooms
  if (/study room|study rooms|multiplayer|watch together|group study|sync|live room/i.test(query)) {
    return intro + `### 👥 Multiplayer Study Rooms\n\n` +
      `Vyoma **Study Rooms** allow synchronized collaborative learning with fellow Sanskrit enthusiasts worldwide:\n\n` +
      `- **Real-time Video Sync**: Videos pause, seek, and play together for everyone in the room.\n` +
      `- **Interactive Chat**: Discuss Shlokas, meanings, and grammatical nuances live during playback.\n` +
      `- **How to Start**: Open any video on a course watch page and click **"Start Study Room"** in the sidebar. You can copy and share the unique invite link with friends or study groups!\n\n` +
      `Ready to study together? Pick any lesson from the [Explore Catalog](/explore) to create a room.`;
  }

  // 6. Leitner Flashcard Memory System
  if (/flashcard|flashcards|leitner|vocabulary|vocab|memoriz|memory box|card/i.test(query)) {
    return intro + `### 🗂️ Leitner Spaced-Repetition Flashcards\n\n` +
      `Our flashcard system uses the scientifically proven **Leitner 5-Box Spaced Repetition** method:\n\n` +
      `- **5 Mastery Boxes**: New Sanskrit vocabulary starts in Box 1. Answering correctly advances the card toward Box 5 (Mastered).\n` +
      `- **Spaced Reinforcement**: Cards in higher boxes are reviewed at longer intervals to cement long-term memory in your brain.\n` +
      `- **In-Player Access**: You can review flashcards directly in the video player sidebar or explore your complete deck in [Flashcard Memory Studio](/profile/flashcards).`;
  }

  // 7. Certificates & Passing Quizzes
  if (/cert|certificate|certificates|quiz|quizzes|exam|score|passing|pass/i.test(query)) {
    return intro + `### 📜 Accredited Sanskrit Certificates\n\n` +
      `Earn verified **Certificates of Completion** for your accomplishments:\n\n` +
      `- **Structured Quizzes**: Each course features dedicated quizzes testing comprehension, vocabulary, and grammar.\n` +
      `- **Passing Criteria**: Score **50% or higher** across all module quizzes for that course.\n` +
      `- **Instant Issuance**: Once achieved, your tamper-evident, verifiable digital Certificate (with PDF download and printing) is instantly available.\n\n` +
      `Check your quiz scores and download certificates anytime on your [Progress Page](/progress).`;
  }

  // 8. Sanskrit Tools: Sandhi Splitter & Grammar Analyzer
  if (/grammar|sandhi|analyzer|split|dhatu|pratipadika|subhashita|verse|shloka|quote|vibhakti/i.test(query)) {
    return intro + `### 🕉️ Integrated Sanskrit Analysis Tools\n\n` +
      `Our platform includes specialized built-in Sanskrit analytical engines:\n\n` +
      `- **Sandhi Splitter**: Deconstructs complex compound words (*Samasas*) and euphonic blends into component words with the grammatical rule applied.\n` +
      `- **Morphological Word Breakdown**: Identifies dictionary base forms (*Pratipadika* for nouns, *Dhatu* for verbs), along with Case (*Vibhakti*), Gender (*Linga*), Number (*Vachana*), and Tense (*Lakara*).\n` +
      `- **Daily Subhashitas**: Inspiring daily classical verses with original Sanskrit script, English transliteration, and insightful commentary.\n\n` +
      `✨ To test the analyzer right now, simply click the **"Sanskrit Tools"** tab in this floating widget!`;
  }

  // 9. Subscriptions, Pricing & Bundles
  if (/sub|subscription|subscriptions|tier|tiers|price|pricing|cost|fee|plan|plans|gold|platinum|free|upgrade|annual|yearly|monthly/i.test(query)) {
    let bundlesText = '';
    if (extraData?.bundles && extraData.bundles.length > 0) {
      bundlesText = `\n\n**Featured Value Bundles:**\n` + extraData.bundles.slice(0, 3).map((b: any) => `- **${b.title}**: ₹${b.price} — *${b.description || 'Special multi-course bundle'}*`).join('\n');
    }

    return intro + `### 💎 Platform Subscription Plans\n\n` +
      `Choose the tier that matches your Sanskrit aspirations:\n\n` +
      `- **FREE Tier**: Explore full course descriptions, watch cinematic trailers, and access designated free trial lessons.\n` +
      `- **GOLD Subscription**: Full unlimited access to all standard video courses, audiobooks, podcasts, and study tools.\n` +
      `- **PLATINUM Subscription**: All Gold benefits PLUS exclusive masterclasses, private study rooms, and VIP interactive programs.\n` +
      `- **🌟 Annual Savings**: Annual billing saves you an automatic **15% discount** compared to monthly renewals!${bundlesText}\n\n` +
      `👉 View exact prices and subscribe securely on the [Subscription Page](/subscribe).`;
  }

  // 10. Gifting Wisdom & Subscription Vouchers
  if (/gift|voucher|vouchers|coupon|present|donate|sponsor/i.test(query)) {
    return intro + `### 🎁 Gift of Wisdom (Subscription Vouchers)\n\n` +
      `Share the timeless beauty of Sanskrit with friends, family, or students:\n\n` +
      `- Purchase prepaid Gold or Platinum vouchers.\n` +
      `- Receive a digital gift code that can be redeemed instantly by any recipient.\n` +
      `- Never expires until claimed by the student.\n\n` +
      `👉 Send a gift code today at [Gift Wisdom](/gift).`;
  }

  // 11. Customer Support & Contact Helpdesk
  if (/contact|support|help|phone|whatsapp|email|call|reach|address|office|admin/i.test(query)) {
    const ci = extraData?.contactInfo || { phone: '+91 98765 43210', whatsapp: '+91 98765 43210', email: 'support@vyomasanskrit.in' };
    const cleanWa = ci.whatsapp.replace(/[^0-9]/g, '');
    return intro + `### 📞 Vyoma Sanskrit Helpdesk & Support\n\n` +
      `Our team is here to assist you:\n\n` +
      `- **Phone Support**: **${ci.phone}**\n` +
      `- **WhatsApp Direct**: [Chat on WhatsApp](https://wa.me/${cleanWa})\n` +
      `- **Email Support**: [${ci.email}](mailto:${ci.email})\n\n` +
      `You can also reach us through the **Contact Tab** in this floating widget!`;
  }

  // 12. Account & Navigation Quick-Links
  if (/password|reset|profile|account|login|sign in|register|signup|invoice|dark mode|theme/i.test(query)) {
    return intro + `### 🧭 Account & Navigation Essentials\n\n` +
      `- **My Profile**: Update personal details, view badges and coins at [Learner Profile](/profile).\n` +
      `- **Change Password**: Update your account credentials securely at [Change Password](/change-password).\n` +
      `- **Learning Progress**: Check completed lessons and quiz scores at [Progress Tracker](/progress).\n` +
      `- **Browse Catalog**: Discover new topics and series at [Explore Catalog](/explore).`;
  }

  // 13. Dynamic Multi-Factor Course Search Engine
  if (courses && courses.length > 0) {
    const scoredCourses = courses.map((c: any) => {
      let score = 0;
      const titleLower = c.title.toLowerCase();
      const descLower = (c.description || '').toLowerCase();
      const catLower = (c.category || '').toLowerCase();

      // Exact title match
      if (titleLower === query) score += 100;
      else if (titleLower.includes(query)) score += 50;
      else if (query.includes(titleLower)) score += 40;

      // Meaningful token matches
      for (const token of meaningfulTokens) {
        if (token.length > 2) {
          if (titleLower.includes(token)) score += 20;
          if (catLower.includes(token)) score += 15;
          if (descLower.includes(token)) score += 5;
        }
      }

      return { ...c, matchScore: score };
    }).filter((c: any) => c.matchScore > 0).sort((a: any, b: any) => b.matchScore - a.matchScore);

    if (scoredCourses.length > 0) {
      const topMatches = scoredCourses.slice(0, 4);
      const matchesText = topMatches.map((c: any) => {
        const episodeInfo = c._count?.episodes ? ` (${c._count.episodes} lessons)` : '';
        const priceInfo = c.accessLevel === 'FREE' ? 'Free Course' : (c.price ? `₹${c.price}` : 'Included in Gold/Platinum');
        const descPreview = c.description ? c.description.slice(0, 110) + '...' : 'Comprehensive Sanskrit curriculum.';
        return `- **[${c.title}](/watch/${c.id})**${episodeInfo}\n  *Category: ${c.category || 'Sanskrit'} • ${priceInfo}*\n  ${descPreview}`;
      }).join('\n\n');

      return intro + `### 📚 Recommended Sanskrit Courses for You:\n\n${matchesText}\n\n` +
        `🔎 To search our complete library of courses, audiobooks, and podcasts, visit the [Explore Page](/explore).`;
    }
  }

  // 14. Custom CMS Pages Matcher (About Us, Mission, Sanskrit Heritage)
  if (extraData?.customPages && extraData.customPages.length > 0) {
    for (const page of extraData.customPages) {
      const pTitle = page.title.toLowerCase();
      if (meaningfulTokens.some((t: string) => pTitle.includes(t)) || query.includes(pTitle)) {
        return intro + `### ${page.title}\n\n${page.content.slice(0, 350)}...\n\nRead more on the [${page.title} Page](/${page.slug}).`;
      }
    }
  }

  // 15. Standard Guardrail / Help Overview
  const isPlatformQuery = /sanskrit|vyoma|course|learn|shloka|stotra|audio|video|podcast|app|site|web/i.test(query);
  if (!isPlatformQuery && meaningfulTokens.length >= 2) {
    return "I am **Vyoma Guru**, your virtual guide specifically for the Vyoma Sanskrit OTT platform. I can assist you with courses, Sanskrit study tools, coins, study rooms, flashcards, certificates, subscriptions, and platform navigation. How can I help you on your Sanskrit journey today?";
  }

  // Default Course Showcase Overview
  const defaultCourses = courses.slice(0, 3).map((c: any) => `- **[${c.title}](/watch/${c.id})** (${c.category || 'Sanskrit'})`).join('\n');
  return intro + `Namaste! 🙏 I am **Vyoma Guru**, your platform guide. Here is what you can discover:\n\n` +
    `**Featured Courses:**\n${defaultCourses || '- Explore our extensive catalog of Sanskrit literature and grammar'}\n\n` +
    `**Quick Links:**\n` +
    `- [Explore All Courses](/explore)\n` +
    `- [Subscription Plans & Discounts](/subscribe)\n` +
    `- [Study Progress & Certificates](/progress)\n` +
    `- [Sanskrit Coins & Profile](/profile)\n\n` +
    `Feel free to ask me any question about our courses, features, or how to get started!`;
}
