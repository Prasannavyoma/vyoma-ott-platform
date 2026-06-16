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

  // Advanced Server Action to ingest results and release coins/certificates
  async function submitResult(uid: string, score: number, passed: boolean) {
    "use server";
    
    const existingResult = await prisma.quizResult.create({
      data: {
        userId: uid,
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
        where: { id: uid },
        data: {
          coins: { increment: coinsGranted }
        }
      });

      // Generate Certificate if not existing
      const existingCert = await prisma.certificate.findFirst({
        where: { userId: uid, courseId: courseId }
      });

      if (!existingCert) {
        certCode = `VYOMA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await prisma.certificate.create({
          data: {
            userId: uid,
            courseId: courseId,
            code: certCode
          }
        });

        // 💬 WhatsApp Certificate Automation Dispatch
        const { sendWhatsAppMessage, getWhatsAppSettings } = await import('@/lib/whatsapp');
        const userObj = await prisma.user.findUnique({ where: { id: uid } });
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

    return { success: true, coins: coinsGranted, certificate: certCode };
  }

  return (
    <main style={{ minHeight: '100vh', background: '#000', color: '#fff' }}>
      <NavBar />
      
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '100px 20px' }}>
         <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>FINAL EVALUATION</span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '10px' }}>{course.title}</h1>
            <p style={{ color: '#888', marginTop: '10px' }}>Demonstrate your mastery to unlock dynamic artifacts and wallet elevations.</p>
         </div>

         <QuizEngine 
           quizId={quiz.id}
           courseId={course.id}
           title={course.title}
           questions={quiz.questions}
           minPassScore={quiz.minPassScore}
           userId={user.id}
           submitResultAction={submitResult}
         />
      </div>
    </main>
  );
}
