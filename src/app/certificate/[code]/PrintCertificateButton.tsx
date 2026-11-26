'use client';

/**
 * Print / Save PDF trigger for the certificate page.
 * A client component (not an inline <script>) so the handler is attached even when the
 * page is reached via client-side <Link> navigation, where injected scripts never run.
 */
export default function PrintCertificateButton() {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <button
      type="button"
      id="print-btn-top"
      onClick={handlePrint}
      style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', color: '#fff', border: 'none', borderRadius: '30px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 15px rgba(242,100,34,0.4)', fontSize: '0.9rem' }}
    >
      🖨️ Print / Save PDF
    </button>
  );
}
