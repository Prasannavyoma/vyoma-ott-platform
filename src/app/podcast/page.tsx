import GenreShowcase from '../components/GenreShowcase';

export const dynamic = 'force-dynamic';

export default function PodcastGenrePage() {
  return (
    <GenreShowcase 
      contentType="PODCAST" 
      title="🎙️ Audiobooks & Podcasts" 
      description="Tune into educational discussions, audiobooks, scholar roundtables, and episodic knowledge capsules recorded live."
    />
  );
}
