import GenreShowcase from '../components/GenreShowcase';

export const dynamic = 'force-dynamic';

export default function VideoGenrePage() {
  return (
    <GenreShowcase 
      contentType="VIDEO" 
      title="📺 Premium Video Library" 
      description="Explore our extensive catalog of cinematic masterclasses, multi-part video series, and structured learning curriculum."
    />
  );
}
