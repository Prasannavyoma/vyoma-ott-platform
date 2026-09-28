import GenreShowcase from '../components/GenreShowcase';

export const dynamic = 'force-dynamic';

export default function GameGenrePage() {
  return (
    <GenreShowcase 
      contentType="GAME" 
      title="🎮 Interactive Games" 
      description="Engage your comprehension through gamified interactive exercises, flashcard decks, and immersive modules."
    />
  );
}
