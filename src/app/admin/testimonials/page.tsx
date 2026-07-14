import prisma from '@/lib/prisma';
import TestimonialsClient from './TestimonialsClient';

export default async function AdminTestimonialsPage() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <div className="admin-header" style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>🌟 Testimonial Approvals</h1>
        <p style={{ color: '#aaa', marginTop: '5px' }}>Review user submissions, approve them for the frontend, or add custom testimonials.</p>
      </div>

      <TestimonialsClient testimonials={testimonials} />
    </div>
  );
}
