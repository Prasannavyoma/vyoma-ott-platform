import GenreShowcase from '../components/GenreShowcase';

export const dynamic = 'force-dynamic';

export default function AudiobookGenrePage() {
  return (
    <GenreShowcase 
      contentType="AUDIOBOOK" 
      title="🎧 Immersive Audio Books" 
      description="Immerse yourself in spoken learning, professional narrative translations, and ancient teachings tailored for listening."
    />
  );
}
