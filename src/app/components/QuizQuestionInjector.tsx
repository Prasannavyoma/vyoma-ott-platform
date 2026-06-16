"use client";

import { useState } from 'react';

interface QuizQuestionInjectorProps {
  onSubmitAction: (formData: FormData) => void;
}

export default function QuizQuestionInjector({ onSubmitAction }: QuizQuestionInjectorProps) {
  const [text, setText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']); // Start with 2 options
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);

  function handleAddOption() {
    setOptions([...options, '']);
  }

  function handleRemoveOption(idx: number) {
    if (options.length <= 2) return; // minimum 2
    const newOptions = options.filter((_, i) => i !== idx);
    setOptions(newOptions);
    if (correctIndex === idx) setCorrectIndex(null);
    else if (correctIndex !== null && correctIndex > idx) setCorrectIndex(correctIndex - 1);
  }

  function handleOptionChange(idx: number, val: string) {
    const newOptions = [...options];
    newOptions[idx] = val;
    setOptions(newOptions);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    const filteredOpts = options.map(o => o.trim()).filter(Boolean);
    if (!text.trim()) return alert("Please write question text.");
    if (filteredOpts.length < 2) return alert("Provide at least 2 options.");
    if (correctIndex === null || !filteredOpts[correctIndex]) return alert("Select a correct answer.");

    const fd = new FormData();
    fd.append('text', text);
    // Serialize options exactly as JSON
    fd.append('optionsJson', JSON.stringify(filteredOpts));
    fd.append('correctAnswer', filteredOpts[correctIndex]);

    await onSubmitAction(fd);
    
    // Reset form
    setText('');
    setOptions(['', '']);
    setCorrectIndex(null);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div>
         <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Question Definition</label>
         <textarea 
           required 
           value={text}
           onChange={(e) => setText(e.target.value)}
           placeholder="Write your assessment prompt here..."
           style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid #333', padding: '12px', borderRadius: '8px', minHeight: '70px', fontFamily: 'inherit' }} 
         />
      </div>

      <div>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase' }}>Multiple Choice Options</label>
            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold' }}>Select radio next to correct choice</span>
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
            {options.map((opt, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                 
                 {/* Select Correct */}
                 <input 
                   type="radio" 
                   name="correct-answer-radio"
                   checked={correctIndex === idx}
                   onChange={() => setCorrectIndex(idx)}
                   style={{ width: '18px', height: '18px', accentColor: '#46d369', cursor: 'pointer' }}
                 />

                 {/* Input Text */}
                 <input 
                   required
                   type="text"
                   placeholder={`Option ${idx + 1}`}
                   value={opt}
                   onChange={(e) => handleOptionChange(idx, e.target.value)}
                   style={{ flex: 1, padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}
                 />

                 {/* Remove Trigger */}
                 {options.length > 2 && (
                   <button 
                     type="button" 
                     onClick={() => handleRemoveOption(idx)}
                     style={{ background: 'transparent', color: '#ff4d4f', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }}
                   >
                     ✕
                   </button>
                 )}

              </div>
            ))}
         </div>

         <button 
           type="button" 
           onClick={handleAddOption}
           style={{ 
             background: 'rgba(255,255,255,0.05)', 
             color: '#fff', 
             border: '1px dashed #444', 
             padding: '8px 15px', 
             borderRadius: '6px', 
             fontSize: '0.85rem', 
             cursor: 'pointer', 
             display: 'flex', 
             alignItems: 'center', 
             gap: '5px',
             transition: 'all 0.2s'
           }}
           onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
           onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
         >
           ➕ Add Choice Input
         </button>
      </div>

      <button 
        type="submit" 
        style={{ 
          background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', 
          color: '#fff', 
          fontWeight: 900, 
          padding: '14px', 
          borderRadius: '8px', 
          border: 'none', 
          cursor: 'pointer', 
          marginTop: '10px',
          boxShadow: '0 4px 15px rgba(242,100,34,0.2)'
        }}
      >
        COMMIT NEW QUESTION
      </button>
    </form>
  );
}
