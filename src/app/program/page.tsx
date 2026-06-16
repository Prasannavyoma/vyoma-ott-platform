import GenreShowcase from '../components/GenreShowcase';

export const dynamic = 'force-dynamic';

export default function ProgramGenrePage() {
  return (
    <GenreShowcase 
      contentType="PROGRAM" 
      title="🎓 Full Academy Programs" 
      description="Structured long-form pathways, multi-semester academies, and comprehensive study programs leading to certifications."
    />
  );
}
