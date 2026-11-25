import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import QuizEngine from '@/app/components/QuizEngine';
import NavBar from '@/app/components/NavBar';

export default async function QuizPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  let courseId = params.id;

  // Self-healing URI decoding fallback to handle special characters in Course IDs
  if (courseId && courseId.includes('%')) {
    try {
      courseId = decodeURIComponent(courseId);
    } catch (e) {}
  }

  const { getCurrentUser } = await import('@/lib/auth');
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  const quiz = await prisma.quiz.findFirst({
    where: { courseId },
    include: { questions: true }
  });

  if (!course || !quiz) {
    redirect('/');
  }

  // Server-side authoritative grading and certificate generation (Bug #21 & #62 fixes)
  async function submitResult(clientAnswers: Record<string, string>) {
    "use server";

    const { getCurrentUser } = await import('@/lib/auth');
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      throw new Error("Unauthorized: Session expired. Please log in.");
    }
    
    // Authoritative server-side answer evaluation
    let correctCount = 0;
    quiz!.questions.forEach(q => {
      if (clientAnswers[q.id] && clientAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const totalQuestions = quiz!.questions.length || 1;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= quiz!.minPassScore;

    await prisma.quizResult.create({
      data: {
        userId: sessionUser.id,
        quizId: quiz!.id,
        score: score,
        passed: passed
      }
    });

    let coinsGranted = 0;
    let certCode = "";

    if (passed) {
      // Award coins logic
      let coinsQuizReward = 50;
      try {
        const qSetting = await prisma.systemSetting.findUnique({ where: { key: 'COINS_QUIZ_REWARD' } });
        if (qSetting) coinsQuizReward = parseInt(qSetting.value) || 0;
      } catch (e) {}

      coinsGranted = coinsQuizReward;
      await prisma.user.update({
        where: { id: sessionUser.id },
        data: {
          coins: { increment: coinsGranted }
        }
      });

      // Generate Certificate if not existing
      const existingCert = await prisma.certificate.findFirst({
        where: { userId: sessionUser.id, courseId: courseId }
      });

      if (!existingCert) {
        const crypto = await import('crypto');
        certCode = `VYOMA-CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        await prisma.certificate.create({
          data: {
            userId: sessionUser.id,
            courseId: courseId,
            code: certCode
          }
        });

        // 💬 WhatsApp Certificate Automation Dispatch
        const { sendWhatsAppMessage, getWhatsAppSettings } = await import('@/lib/whatsapp');
        const userObj = await prisma.user.findUnique({ where: { id: sessionUser.id } });
        if (userObj?.phone) {
          const settings = await getWhatsAppSettings();
          if (settings.enabled && settings.templates.certificate) {
             sendWhatsAppMessage(userObj.phone, settings.templates.certificate, 'en_US', [
               { type: "text", text: userObj.name || 'Scholar' },
               { type: "text", text: course!.title },
               { type: "text", text: `vyoma-ott.com/certificate/${certCode}` }
             ]).catch(console.error);
          }
        }
      } else {
        certCode = existingCert.code;
      }
    }

    return { success: true, score, passed, coins: coinsGranted, certificate: certCode };
  }

  // Redact correct answers before sending quiz questions to the client browser (Bug #21 fix)
  const sanitizedQuestions = quiz.questions.map(q => ({
    id: q.id,
    text: q.text,
    options: q.options
  }));

  return (
    <main style={{ minHeight: '100vh', background: '#000', color: '#fff' }}>
      <NavBar />
      
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '160px 20px 60px 20px' }}>
         <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>FINAL EVALUATION</span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '10px' }}>{course.title}</h1>
            <p style={{ color: '#888', marginTop: '10px' }}>Demonstrate your mastery to unlock dynamic artifacts and wallet elevations.</p>
         </div>

         <QuizEngine 
           quizId={quiz.id}
           courseId={course.id}
           title={course.title}
           questions={sanitizedQuestions}
           minPassScore={quiz.minPassScore}
           userId={user.id}
           submitResultAction={submitResult}
         />
      </div>
    </main>
  );
}
