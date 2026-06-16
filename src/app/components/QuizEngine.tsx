"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type QuestionData = {
  id: string;
  text: string;
  options: string; // JSON
  correctAnswer: string;
}

type QuizProps = {
  quizId: string;
  courseId: string;
  title: string;
  questions: QuestionData[];
  minPassScore: number;
  submitResultAction: (userId: string, score: number, passed: boolean) => Promise<{ success: boolean, coins?: number, certificate?: string }>;
  userId: string;
}

export default function QuizEngine({ quizId, courseId, title, questions, minPassScore, submitResultAction, userId }: QuizProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number, passed: boolean, coinsAwarded?: number, certCode?: string } | null>(null);
  const router = useRouter();

  if (questions.length === 0) {
    return <div style={{ color: '#888', padding: '40px', textAlign: 'center' }}>Assessment payloads not loaded for this sequence.</div>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let correctCount = 0;
    
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const scorePct = Math.round((correctCount / questions.length) * 100);
    const passed = scorePct >= minPassScore;

    setSubmitted(true);

    // Push result to server
    const response = await submitResultAction(userId, scorePct, passed);
    
    setResult({
      score: scorePct,
      passed: passed,
      coinsAwarded: response.coins,
      certCode: response.certificate
    });
  }

  if (result) {
    return (
      <div style={{ background: 'var(--card-bg)', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
         <h2 style={{ fontSize: '3rem', marginBottom: '10px' }}>{result.passed ? '🎉 PASSED!' : '❌ INCOMPLETE'}</h2>
         <div style={{ fontSize: '1.5rem', fontWeight: 900, color: result.passed ? '#4caf50' : '#ff4444', marginBottom: '30px' }}>
            Final Valuation Score: {result.score}%
         </div>
         
         {result.passed ? (
           <div>
              <div style={{ background: 'rgba(242, 100, 34, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid var(--primary)', marginBottom: '20px' }}>
                 <h3 style={{ color: 'var(--primary)', margin: 0 }}>💰 +{result.coinsAwarded || 0} Coins Generated!</h3>
                 <p style={{ fontSize: '0.9rem', marginTop: '5px', color: '#aaa' }}>Wallet expanded successfully.</p>
              </div>

              {result.certCode && (
                <div style={{ background: '#fff', color: '#000', padding: '25px', borderRadius: '12px', marginTop: '20px', display: 'inline-block', width: '100%', boxShadow: '0 10px 40px rgba(255,255,255,0.1)' }}>
                   <div style={{ border: '2px solid #000', padding: '15px' }}>
                      <div style={{ fontSize: '0.7rem', letterSpacing: '3px', textTransform: 'uppercase', color: '#666', marginBottom: '10px' }}>Certificate of Completion</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{title} Mastery</div>
                      <div style={{ fontSize: '0.6rem', marginTop: '15px', color: '#777' }}>Verification Code: {result.certCode}</div>
                   </div>
                </div>
              )}

              <button onClick={() => router.push(`/watch/${courseId}`)} style={{ marginTop: '30px', background: 'var(--primary)', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: '30px', fontWeight: 800, cursor: 'pointer' }}>
                 RETURN TO COURSE
              </button>
           </div>
         ) : (
           <div>
              <p style={{ color: '#aaa', marginBottom: '30px' }}>Minimum authorization threshold of {minPassScore}% not satisfied.</p>
              <button onClick={() => { setSubmitted(false); setResult(null); setAnswers({}); }} style={{ background: '#333', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                 RETRY ASSESSMENT
              </button>
           </div>
         )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
       {questions.map((q, idx) => {
         const opts = JSON.parse(q.options) as string[];
         return (
           <div key={q.id} style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '1.1rem' }}><span style={{ color: 'var(--primary)', marginRight: '10px' }}>#{idx+1}</span> {q.text}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 {opts.map((o) => (
                    <label key={o} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px', cursor: 'pointer', transition: '0.2s', border: answers[q.id] === o ? '1px solid var(--primary)' : '1px solid transparent' }}>
                       <input 
                         type="radio" 
                         name={q.id} 
                         required 
                         checked={answers[q.id] === o}
                         onChange={() => setAnswers(prev => ({ ...prev, [q.id]: o }))}
                         style={{ accentColor: 'var(--primary)' }}
                       />
                       <span>{o}</span>
                    </label>
                 ))}
              </div>
           </div>
         );
       })}

       <button 
         type="submit" 
         disabled={submitted}
         style={{ marginTop: '20px', background: 'var(--primary)', color: '#fff', border: 'none', padding: '20px', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 30px rgba(242, 100, 34, 0.3)' }}>
          {submitted ? 'TRANSMITTING DATA...' : 'SUBMIT FOR EVALUATION'}
       </button>
    </form>
  );
}
