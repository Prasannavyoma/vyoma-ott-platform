import GenreShowcase from '../components/GenreShowcase';

export const dynamic = 'force-dynamic';

export default function EbookGenrePage() {
  return (
    <GenreShowcase 
      contentType="EBOOK" 
      title="📖 Rich Ebook Catalog" 
      description="Access downloadable manuscripts, translated PDF readers, and high-resolution textual study materials."
    />
  );
}
