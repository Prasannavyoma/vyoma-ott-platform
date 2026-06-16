import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CertificatePage(props: any) {
  const params = await props.params;
  const { code } = params;

  const result = await prisma.$queryRawUnsafe<any[]>(
    `SELECT c.id, c.code, c.issuedAt, u.name as userName, u.email as userEmail, co.title as courseTitle 
     FROM Certificate c 
     JOIN User u ON c.userId = u.id 
     JOIN Course co ON c.courseId = co.id 
     WHERE c.code = ?`,
    code
  );

  const cert = result?.[0];

  if (!cert) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <h1 style={{ fontSize: '2rem', color: '#fff', marginBottom: '20px' }}>Certificate Not Found</h1>
        <p style={{ color: '#aaa', marginBottom: '30px' }}>The verification code <strong>{code}</strong> is invalid or does not exist.</p>
        <Link href="/" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>← Return Home</Link>
      </div>
    );
  }

  const dateStr = new Date(cert.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div style={{ minHeight: '100vh', background: '#e0e0e0', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Action Bar (hidden when printing) */}
      <div className="no-print" style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
        <Link href="/profile" style={{ padding: '10px 20px', background: '#333', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to Profile
        </Link>
        <button 
          id="print-btn-top"
          style={{ padding: '10px 20px', background: '#f26422', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(242,100,34,0.3)' }}
        >
          🖨️ Print / Save PDF
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .cert-container { box-shadow: none !important; border: none !important; }
        }
      `}} />

      <script dangerouslySetInnerHTML={{ __html: `
        function printCert() { window.print(); }
      `}} />

      {/* Certificate Body */}
      <div className="cert-container" style={{ 
        width: '100%', 
        maxWidth: '1000px', 
        aspectRatio: '1.414', // A4 landscape aspect ratio approx
        background: '#fffdf7',
        border: '15px solid #d4af37',
        outline: '4px solid #b8860b',
        outlineOffset: '-12px',
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        color: '#222'
      }}>
        
        {/* Background watermark/ornament */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.05, pointerEvents: 'none' }}>
           <svg width="400" height="400" viewBox="0 0 24 24" fill="currentColor">
             <path d="M12 2L2 22h20L12 2zm0 3.8l7.2 14.2H4.8L12 5.8z"/>
           </svg>
        </div>

        <img 
          src="https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2023/02/logo-200-x-70-px.png" 
          alt="Vyoma Logo" 
          style={{ height: '70px', objectFit: 'contain', marginBottom: '40px' }} 
        />

        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '3.5rem', color: '#1a1a1a', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '15px' }}>
          Certificate of Completion
        </h1>

        <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', fontStyle: 'italic', color: '#555', marginBottom: '30px' }}>
          This certifies that
        </p>

        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '4rem', color: '#d4af37', fontWeight: 'bold', borderBottom: '2px solid #ddd', paddingBottom: '10px', minWidth: '60%', marginBottom: '30px' }}>
          {cert.userName || 'Student'}
        </h2>

        <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', fontStyle: 'italic', color: '#555', marginBottom: '20px' }}>
          has successfully completed the course
        </p>

        <h3 style={{ fontFamily: 'system-ui, sans-serif', fontSize: '2rem', color: '#f26422', fontWeight: 900, textTransform: 'uppercase', marginBottom: '50px', maxWidth: '80%' }}>
          {cert.courseTitle}
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', width: '80%', marginTop: 'auto', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>Date Issued</p>
            <p style={{ fontSize: '1.1rem', color: '#555', margin: '5px 0 0' }}>{dateStr}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Signature_placeholder.png" alt="Signature" style={{ height: '40px', opacity: 0.5, marginBottom: '5px', filter: 'grayscale(100%)' }} />
            <p style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>Vyoma Linguistic Labs Foundation</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>Verification Code</p>
            <p style={{ fontSize: '1.1rem', color: '#555', margin: '5px 0 0', fontFamily: 'monospace' }}>{cert.code}</p>
          </div>
        </div>

      </div>

      <button 
        id="print-btn-bottom"
        className="no-print" 
        style={{ marginTop: '20px', padding: '12px 24px', background: '#f26422', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(242,100,34,0.3)' }}
      >
         🖨️ Print / Save PDF
      </button>

      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('print-btn-top').onclick = function() { window.print(); };
        document.getElementById('print-btn-bottom').onclick = function() { window.print(); };
      `}} />

    </div>
  );
}
