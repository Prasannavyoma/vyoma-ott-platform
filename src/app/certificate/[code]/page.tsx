import prisma from '@/lib/prisma';
import Link from 'next/link';
import PrintCertificateButton from './PrintCertificateButton';

export const dynamic = 'force-dynamic';

export default async function CertificatePage(props: any) {
  const params = await props.params;
  const { code } = params;

  let cert = null;
  if (code && code !== 'undefined') {
    try {
      cert = await prisma.certificate.findUnique({
        where: { code },
        include: {
          user: { select: { name: true, email: true } },
          course: { select: { title: true } }
        }
      });
      if (!cert) {
        cert = await prisma.certificate.findUnique({
          where: { id: code },
          include: {
            user: { select: { name: true, email: true } },
            course: { select: { title: true } }
          }
        });
      }
    } catch (e) {}
  }

  if (!cert) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#090a0f', color: '#fff' }}>
        <h1 style={{ fontSize: '2rem', color: '#fff', marginBottom: '15px' }}>Certificate Not Found</h1>
        <p style={{ color: '#aaa', marginBottom: '25px' }}>The verification code <strong>{code}</strong> is invalid or does not exist.</p>
        <Link href="/" style={{ color: 'var(--primary, #f26422)', fontWeight: 'bold' }}>← Return Home</Link>
      </div>
    );
  }

  const dateStr = new Date(cert.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="cert-page" style={{ minHeight: '100vh', background: '#121319', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Action Bar (hidden when printing) */}
      <div className="no-print" style={{ marginBottom: '25px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <Link href="/profile#certificates" style={{ padding: '10px 22px', background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: '30px', textDecoration: 'none', fontWeight: 700, border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.9rem' }}>
          ← Back to Profile
        </Link>
        <PrintCertificateButton />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: A4 landscape; margin: 0; }
        @media print {
          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          /* Print only the certificate: hides site-wide overlays (cookie banner, chat widgets, etc.) */
          body * { visibility: hidden !important; }
          .cert-container, .cert-container * { visibility: visible !important; }
          .no-print { display: none !important; }
          .cert-page { background: #fff !important; padding: 0 !important; min-height: 0 !important; }
          .cert-container {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            max-width: none !important;
            height: 100% !important;
            min-height: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            /* Keep the cream paper and gold frame even when "Background graphics" is off */
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />

      {/* Certificate Body Container */}
      <div className="cert-container" style={{ 
        width: '100%', 
        maxWidth: '960px', 
        minHeight: '620px',
        background: '#fffdf8',
        border: '14px solid #d4af37',
        outline: '3px solid #b8860b',
        outlineOffset: '-10px',
        padding: '45px 50px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        color: '#1a1a1a',
        borderRadius: '4px',
        boxSizing: 'border-box'
      }}>
        
        {/* 🌟 LOGO WATERMARK BACKGROUND */}
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: '500px',
          maxWidth: '80%',
          opacity: 0.06, 
          pointerEvents: 'none',
          zIndex: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
           <img 
             src="/assets/logo-200-x-70-px.png" 
             alt="Vyoma Watermark" 
             style={{ width: '100%', height: 'auto', filter: 'brightness(0)' }} 
           />
        </div>

        {/* TOP BRAND LOGO */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: '15px' }}>
          <img 
            src="/assets/logo-200-x-70-px.png" 
            alt="Vyoma Logo" 
            style={{ height: '55px', objectFit: 'contain', filter: 'brightness(0)' }} 
          />
        </div>

        {/* CERTIFICATE HEADING */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2.5rem', color: '#111', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 8px 0', fontWeight: 800 }}>
            Certificate of Completion
          </h1>

          <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontStyle: 'italic', color: '#666', margin: '0 0 15px 0' }}>
            This certifies that
          </p>

          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '2.8rem', color: '#b8860b', fontWeight: 'bold', borderBottom: '2px solid rgba(212,175,55,0.4)', paddingBottom: '8px', display: 'inline-block', minWidth: '50%', maxWidth: '90%', margin: '0 0 15px 0' }}>
            {cert.user?.name || cert.user?.email || 'Scholar'}
          </h2>

          <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontStyle: 'italic', color: '#666', margin: '0 0 12px 0' }}>
            has successfully completed the course
          </p>

          <h3 style={{ fontFamily: 'system-ui, sans-serif', fontSize: '1.8rem', color: '#f26422', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 25px 0', padding: '0 20px', lineHeight: 1.3 }}>
            {cert.course?.title}
          </h3>
        </div>

        {/* BOTTOM FOOTER METRICS */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', borderTop: '1px solid rgba(212,175,55,0.4)', paddingTop: '18px', marginTop: '15px' }}>
          
          <div style={{ textAlign: 'left', flex: 1 }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 800, margin: 0, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Issued</p>
            <p style={{ fontSize: '1rem', color: '#222', fontWeight: 700, margin: '3px 0 0 0' }}>{dateStr}</p>
          </div>

          <div style={{ textAlign: 'center', flex: 1.5 }}>
            <div style={{ fontSize: '1rem', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#333', marginBottom: '2px', fontWeight: 'bold' }}>
              Vyoma Linguistic Labs
            </div>
            <p style={{ fontSize: '0.78rem', fontWeight: 800, margin: 0, color: '#777', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Authorized Signature</p>
          </div>

          <div style={{ textAlign: 'right', flex: 1 }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 800, margin: 0, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verification Code</p>
            <p style={{ fontSize: '1rem', color: '#f26422', fontWeight: 900, margin: '3px 0 0 0', fontFamily: 'monospace' }}>{cert.code}</p>
          </div>

        </div>

      </div>

    </div>
  );
}
