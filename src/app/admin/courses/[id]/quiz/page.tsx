import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import QuizQuestionInjector from '@/app/components/QuizQuestionInjector';

export default async function QuizEditor(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  let courseId = params.id;
  
  // Self-healing URI decoding fallback to handle space encodings (%20) in slug IDs
  if (courseId && courseId.includes('%')) {
    try {
      courseId = decodeURIComponent(courseId);
    } catch (e) {}
  }

  // Fetch existing quiz or initialize default tied to this course
  let quiz = await prisma.quiz.findFirst({
    where: { courseId },
    include: { questions: true }
  });

  if (!quiz) {
    quiz = await prisma.quiz.create({
      data: {
        title: 'Course Completion Assessment',
        description: 'Demonstrate mastery of course materials to unlock your certified diploma.',
        courseId: courseId,
        minPassScore: 75
      },
      include: { questions: true }
    });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });

  // -- SERVER ACTION: Update Quiz Metadata
  async function updateQuizMeta(fd: FormData) {
    "use server";
    if (!quiz) return;
    
    const title = fd.get('title') as string;
    const description = fd.get('description') as string;
    const minPassScore = parseInt(fd.get('minPassScore') as string || "70");

    await prisma.quiz.update({
      where: { id: quiz.id },
      data: { title, description, minPassScore }
    });
    
    revalidatePath(`/admin/courses/${courseId}/quiz`);
  }

  // -- SERVER ACTION: Injected Advanced Question Action
  async function addAdvancedQuestion(fd: FormData) {
    "use server";
    if (!quiz) return;

    const text = fd.get('text') as string;
    const optionsJson = fd.get('optionsJson') as string; // exact stringified json from our client injector
    const correctAnswer = fd.get('correctAnswer') as string;

    await prisma.question.create({
      data: {
        quizId: quiz.id,
        text,
        options: optionsJson,
        correctAnswer
      }
    });
    revalidatePath(`/admin/courses/${courseId}/quiz`);
  }

  async function delQuestion(id: string) {
    "use server";
    await prisma.question.delete({ where: { id } });
    revalidatePath(`/admin/courses/${courseId}/quiz`);
  }

  return (
    <div style={{ paddingBottom: '80px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header Context Bar */}
      <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link href={`/admin/courses/${courseId}`} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 20px', borderRadius: '30px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 800 }}>
              ← Return to Course
            </Link>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-1px', margin: 0 }}>Assessment Matrix Builder</h1>
         </div>
         <span style={{ background: 'rgba(70, 211, 105, 0.1)', color: '#46d369', padding: '6px 15px', borderRadius: '20px', fontSize: '0.8rem', border: '1px solid rgba(70,211,105,0.2)', fontWeight: 700 }}>
            Connected to: {course?.title?.slice(0, 30)}...
         </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '35px' }}>
         
         {/* LEFT COLUMN: MANAGEMENT TOOLS */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
           
           {/* Section 1: Quiz Core Config Options */}
           <div style={{ background: 'var(--card-bg)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
             <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
               ⚙️ Configure Global Parameters
             </h3>
             <form action={updateQuizMeta} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                   <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>Quiz Assessment Title</label>
                      <input required name="title" defaultValue={quiz.title} style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '8px' }} />
                   </div>
                   <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>Min Passing %</label>
                      <input required type="number" min="0" max="100" name="minPassScore" defaultValue={quiz.minPassScore} style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '8px' }} />
                   </div>
                </div>
                <div>
                   <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>Landing / Introductory Description</label>
                   <textarea name="description" rows={2} defaultValue={quiz.description || ''} style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '8px', fontFamily: 'inherit' }} />
                </div>
                <button type="submit" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #444', color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}>
                   💾 SAVE GLOBAL SETTINGS
                </button>
             </form>
           </div>

           {/* Section 2: Advanced Visual Injector */}
           <div style={{ background: 'var(--card-bg)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
             <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
               ➕ Visual Choice Injector
             </h3>
             <p style={{ fontSize: '0.8rem', color: '#777', marginTop: '-10px', marginBottom: '25px' }}>Use visual matrix inputs and selector indicators matching enterprise quiz applications.</p>
             
             <QuizQuestionInjector onSubmitAction={addAdvancedQuestion} />
           </div>

         </div>

         {/* RIGHT COLUMN: QUESTIONS STACK PREVIEW */}
         <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
               <h3 style={{ margin: 0 }}>📜 Assessment Stack ({quiz?.questions.length})</h3>
               {quiz?.questions.length > 0 && <span style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 800 }}>Required To Pass: {quiz.minPassScore}%</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
               {quiz?.questions.map((q, idx) => {
                  let opts: string[] = [];
                  try {
                    opts = JSON.parse(q.options);
                  } catch(e) {
                    opts = q.options.split(','); // legacy fallback
                  }

                  return (
                    <div key={q.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', alignItems: 'flex-start' }}>
                          <strong style={{ fontSize: '1rem', lineHeight: '1.4' }}>
                             <span style={{ color: '#555', marginRight: '10px' }}>Q{idx+1}.</span>
                             {q.text}
                          </strong>
                          <form action={async () => { "use server"; await delQuestion(q.id); }}>
                             <button type="submit" style={{ background: 'rgba(255,77,79,0.1)', color: '#ff4d4f', border: '1px solid rgba(255,77,79,0.2)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', padding: '6px 12px', fontWeight: 800 }}>
                               DELETE
                             </button>
                          </form>
                       </div>

                       <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {opts.map((o, oIdx) => {
                             const isCorrect = o.trim() === q.correctAnswer.trim();
                             return (
                               <div key={oIdx} style={{ 
                                 padding: '10px 15px', 
                                 background: isCorrect ? 'rgba(70, 211, 105, 0.08)' : 'rgba(0,0,0,0.15)', 
                                 borderRadius: '8px', 
                                 fontSize: '0.85rem', 
                                 border: isCorrect ? '1px solid rgba(70, 211, 105, 0.3)' : '1px solid rgba(255,255,255,0.03)',
                                 display: 'flex',
                                 justifyContent: 'space-between',
                                 alignItems: 'center',
                                 color: isCorrect ? '#fff' : '#aaa'
                               }}>
                                  <span>
                                     <span style={{ opacity: 0.5, marginRight: '8px' }}>{String.fromCharCode(65 + oIdx)}.</span>
                                     {o}
                                  </span>
                                  {isCorrect && <span style={{ background: '#46d369', color: '#000', fontWeight: 900, fontSize: '0.65rem', padding: '3px 8px', borderRadius: '4px' }}>CORRECT</span>}
                               </div>
                             );
                          })}
                       </div>
                    </div>
                  );
               })}

               {quiz?.questions.length === 0 && (
                 <div style={{ padding: '60px 40px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed #444', borderRadius: '16px', color: '#666' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '15px' }}>📋</div>
                    <strong>Assessment stack is empty.</strong>
                    <p style={{ fontSize: '0.85rem', marginTop: '5px', opacity: 0.8 }}>Use the injector panel to build dynamic questionnaires for authorization certification.</p>
                 </div>
               )}
            </div>
         </div>

      </div>
    </div>
  );
}
