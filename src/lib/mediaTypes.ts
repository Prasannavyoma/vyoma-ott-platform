/**
 * Utility functions for media type identification, offline download eligibility,
 * and interactive module handling.
 */

export function isInteractiveGame(
  url?: string | null,
  contentType?: string | null,
  category?: string | null
): boolean {
  if (contentType === 'GAME') return true;
  if (category && category.toLowerCase().includes('game')) return true;
  if (!url) return false;
  const lower = url.toLowerCase().trim();
  return (
    lower.includes('story_html5') ||
    lower.includes('/games/') ||
    lower.includes('storyline') ||
    lower.includes('<iframe') ||
    lower.endsWith('.html') ||
    lower.includes('.html?')
  );
}

export function isNonDownloadableMedia(url?: string | null): boolean {
  if (!url) return true;
  const lower = url.toLowerCase().trim();
  return (
    lower.includes('<iframe') ||
    lower.includes('story_html5') ||
    lower.includes('/games/') ||
    lower.includes('storyline') ||
    lower.endsWith('.html') ||
    lower.includes('.html?') ||
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('vimeo.com')
  );
}
