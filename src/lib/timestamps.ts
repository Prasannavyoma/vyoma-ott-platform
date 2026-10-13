/**
 * YouTube-style Video Timestamp & Chapters Utility
 * Supports parsing, formatting, extracting chapters from text, and seamless seeking.
 */

export interface Chapter {
  id: string;
  timestamp: number; // in seconds
  timeStr: string;   // e.g. "02:15"
  title: string;     // e.g. "Mangalacharanam"
}

/**
 * Parses timestamp string into total seconds.
 * Examples supported:
 * - "02:15" -> 135
 * - "2:15" -> 135
 * - "01:04:20" -> 4460
 * - "1:04:20" -> 4460
 * - "1m30s" -> 90
 * - "90s" -> 90
 * - "90" -> 90
 */
export function parseTimestamp(str: string | null | undefined): number | null {
  if (!str) return null;
  const trimmed = str.trim();

  // 1. YouTube query param format: e.g. "1m30s" or "2h15m10s"
  if (/^(\d+h)?(\d+m)?(\d+s)?$/i.test(trimmed) && (trimmed.includes('h') || trimmed.includes('m') || trimmed.includes('s'))) {
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    const hMatch = trimmed.match(/(\d+)h/i);
    const mMatch = trimmed.match(/(\d+)m/i);
    const sMatch = trimmed.match(/(\d+)s/i);
    if (hMatch) hours = parseInt(hMatch[1], 10);
    if (mMatch) minutes = parseInt(mMatch[1], 10);
    if (sMatch) seconds = parseInt(sMatch[1], 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  // 2. Pure number seconds (e.g. "90" or "90.5")
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return Math.floor(parseFloat(trimmed));
  }

  // 3. HH:MM:SS or MM:SS
  const parts = trimmed.split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (!isNaN(mins) && !isNaN(secs)) {
      return mins * 60 + secs;
    }
  } else if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    const secs = parseInt(parts[2], 10);
    if (!isNaN(hours) && !isNaN(mins) && !isNaN(secs)) {
      return hours * 3600 + mins * 60 + secs;
    }
  }

  return null;
}

/**
 * Formats seconds into MM:SS or HH:MM:SS string.
 */
export function formatTimestamp(seconds: number, forceHours: boolean = false): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');

  if (hrs > 0 || forceHours) {
    return `${hrs}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Regex to match any timestamp pattern inside text:
 * Matches "00:00", "01:25", "1:25", "01:05:30", "1:05:30", etc.
 */
export const TIMESTAMP_REGEX = /(?:\[|\()?\b(\d{1,2}:\d{2}(?::\d{2})?)\b(?:\]|\))?/g;

/**
 * Extracts structured chapters from freeform text (like YouTube descriptions).
 * Matches lines like:
 * "00:00 Introduction"
 * "02:15 - Mangalacharanam"
 * "[05:40] Shloka 1 Recitation"
 * "1. 10:20 Padavibhaga"
 */
export function extractChaptersFromText(text: string | null | undefined): Chapter[] {
  if (!text) return [];

  const chapters: Chapter[] = [];
  const lines = text.split(/\r?\n/);
  const seenTimestamps = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Search for timestamp in this line
    const match = line.match(/(?:\[|\()?\b(\d{1,2}:\d{2}(?::\d{2})?)\b(?:\]|\))?/);
    if (match) {
      const timeStr = match[1];
      const seconds = parseTimestamp(timeStr);

      if (seconds !== null && !seenTimestamps.has(seconds)) {
        // Strip the timestamp and common prefixes/delimiters (- : .) from the line to get the title
        let title = line
          .replace(match[0], '')
          .replace(/^[\s\-–—:.\d)]+/, '')
          .trim();

        if (!title) {
          title = `Section at ${timeStr}`;
        }

        seenTimestamps.add(seconds);
        chapters.push({
          id: `ch_${seconds}_${i}`,
          timestamp: seconds,
          timeStr: formatTimestamp(seconds),
          title
        });
      }
    }
  }

  // Sort chapters chronologically
  return chapters.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Global client-side helper to seek the player to a timestamp.
 * Dispatches a custom event caught by the Cinematic Player,
 * and gently scrolls up to the player if necessary.
 */
export function seekToTimestamp(seconds: number, autoPlay: boolean = true) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent('vyoma:seek', {
      detail: { time: seconds, play: autoPlay }
    })
  );

  // Smoothly scroll to the video player if currently far down the page
  const playerElement = document.getElementById('player-container') || document.querySelector('.watch-grid');
  if (playerElement) {
    const rect = playerElement.getBoundingClientRect();
    if (rect.top < -50 || rect.bottom < 100) {
      playerElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}
