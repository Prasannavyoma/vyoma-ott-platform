"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useGlobalPlayer } from './GlobalPlayerProvider';
import { askAiAgent } from '@/app/actions/ai-agent';
import Hls from 'hls.js';
import { useRouter } from 'next/navigation';
import { 
  addFlashcard, 
  createStudyRoom, 
  pollStudyRoom, 
  updateStudyRoomState, 
  sendStudyRoomMessage, 
  getClientUser 
} from '@/app/actions/learning-ott';

interface SubtitleCue {
  startTime: number;
  endTime: number;
  text: string;
}

function parsePayload(payload: string) {
  try {
    return JSON.parse(payload);
  } catch (e) {
    return payload;
  }
}

function parseVtt(vttText: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const lines = vttText.split(/\r?\n/);
  
  let currentCue: Partial<SubtitleCue> | null = null;
  const timeRegex = /([0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}|[0-9]{2}:[0-9]{2}\.[0-9]{3})\s*-->\s*([0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}|[0-9]{2}:[0-9]{2}\.[0-9]{3})/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const match = line.match(timeRegex);
    if (match) {
      const startTime = parseVttTime(match[1]);
      const endTime = parseVttTime(match[2]);
      currentCue = { startTime, endTime, text: '' };
    } else if (currentCue && !line.startsWith('WEBVTT') && !line.match(/^[0-9]+$/)) {
      if (currentCue.text) {
        currentCue.text += ' ' + line;
      } else {
        currentCue.text = line;
      }
      
      const nextLine = lines[i + 1]?.trim();
      if (!nextLine || nextLine.match(timeRegex) || nextLine.match(/^[0-9]+$/)) {
        cues.push({
          startTime: currentCue.startTime!,
          endTime: currentCue.endTime!,
          text: currentCue.text.replace(/<[^>]*>/g, '')
        });
        currentCue = null;
      }
    }
  }
  return cues;
}

function parseVttTime(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const secondsParts = parts[1].split('.');
    const seconds = parseInt(secondsParts[0], 10);
    const ms = parseInt(secondsParts[1], 10) || 0;
    return minutes * 60 + seconds + ms / 1000;
  } else {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const secondsParts = parts[2].split('.');
    const seconds = parseInt(secondsParts[0], 10);
    const ms = parseInt(secondsParts[1], 10) || 0;
    return hours * 3600 + minutes * 60 + seconds + ms / 1000;
  }
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
  const s2 = str2.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
  
  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;
  
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matches = 0;
  words1.forEach(w => {
    if (words2.includes(w)) matches++;
  });
  
  const wordScore = (matches / Math.max(words1.length, words2.length)) * 100;
  
  const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  const distance = track[s2.length][s1.length];
  const charScore = (1 - distance / Math.max(s1.length, s2.length)) * 100;
  
  return Math.round((wordScore + charScore) / 2);
}

interface Marker {
  id: string;
  timestamp: number;
  type: string;
  payload: string;
}

function getYouTubeEmbedUrl(url: string): string {
  if (url.includes('youtube.com/embed/')) return url;
  let videoId = '';
  if (url.includes('youtube.com/watch')) {
    try {
      const parts = url.split('?')[1];
      const params = new URLSearchParams(parts);
      videoId = params.get('v') || '';
    } catch (e) {}
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : url;
}

function getVimeoEmbedUrl(url: string): string {
  if (url.includes('player.vimeo.com/video/')) return url;
  const match = url.match(/vimeo\.com\/(\d+)/);
  const videoId = match ? match[1] : '';
  return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1` : url;
}

export default function CinematicPlayer({ 
  url, 
  poster, 
  episodeId, 
  courseId,
  markers = [],
  nextEpisodeUrl,
  nextEpisodeTitle,
  initialPosition,
  subtitleUrl
}: { 
  url: string, 
  poster?: string, 
  episodeId?: string, 
  courseId?: string,
  markers?: Marker[],
  nextEpisodeUrl?: string,
  nextEpisodeTitle?: string,
  initialPosition?: number,
  subtitleUrl?: string
}) {
  const { playEpisode, isMinimized, setPlaying, isPlaying, updateTime, videoRef } = useGlobalPlayer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Format Detection & Iframe Extraction
  let cleanUrl = url.trim();
  if (cleanUrl.toLowerCase().includes('<iframe')) {
    const match = cleanUrl.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
      cleanUrl = match[1];
    }
  }

  // Clean the URL of double backslashes, escaped quotes, or newlines/spaces
  cleanUrl = cleanUrl.replace(/\\"/g, '"').replace(/\\/g, '').replace(/[\r\n]+/g, '').trim();

  const lowerUrl = cleanUrl.toLowerCase();
  const isPdf = lowerUrl.endsWith('.pdf') || lowerUrl.includes('.pdf?');
  const isAudioFormat = lowerUrl.endsWith('.mp3') || lowerUrl.endsWith('.wav') || lowerUrl.endsWith('.ogg') || lowerUrl.includes('.mp3?') || lowerUrl.includes('.wav?') || lowerUrl.includes('.ogg?');
  const isYouTube = lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be');
  const isVimeo = lowerUrl.includes('vimeo.com');
  const isEmbedVideo = isYouTube || isVimeo;
  const isVideoFormat = lowerUrl.endsWith('.mp4') || lowerUrl.includes('.mp4?') ||
                        lowerUrl.endsWith('.m3u8') || lowerUrl.includes('.m3u8?') ||
                        lowerUrl.endsWith('.webm') || lowerUrl.includes('.webm?') ||
                        lowerUrl.endsWith('.mov') || lowerUrl.includes('.mov?') ||
                        lowerUrl.endsWith('.ogv') || lowerUrl.includes('.ogv?') ||
                        lowerUrl.endsWith('.m4v') || lowerUrl.includes('.m4v?') ||
                        lowerUrl.endsWith('.mpd') || lowerUrl.includes('.mpd?') ||
                        lowerUrl.endsWith('.avi') || lowerUrl.includes('.avi?');
  const isHtml = lowerUrl.endsWith('.html') || lowerUrl.endsWith('.htm') || lowerUrl.includes('index.html') || lowerUrl.includes('story_html5.html') || lowerUrl.includes('/flipbooks/') || lowerUrl.includes('/flipbook/') || (!isPdf && !isAudioFormat && !isVideoFormat && !isEmbedVideo && (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://')));
  
  // Bugfix: Audio IS played by the native video element, so it should not be considered "NonNativeVideo" which relies on iframes
  const isNonNativeVideo = isHtml || isPdf || isEmbedVideo;

  const [docControlsMode, setDocControlsMode] = useState(false);
  const [iframeUrl, setIframeUrl] = useState(cleanUrl);

  useEffect(() => {
    setDocControlsMode(false);
    if (isPdf) {
      setIframeUrl(`${cleanUrl}#toolbar=0`);
    } else {
      setIframeUrl(cleanUrl);
    }
  }, [cleanUrl, isPdf]);

  // Sync iframe Url with timeline jumps
  const navigateIframeToTime = (timestamp: number) => {
    // Estimate page based on timestamp (e.g. 1 page per 30 seconds) or marker payload
    const marker = markers.find(m => m.timestamp === timestamp);
    let pageNum = Math.floor(timestamp / 30) + 1;
    if (marker) {
      const payload = parsePayload(marker.payload);
      if (payload && typeof payload === 'object' && payload.page) {
        pageNum = payload.page;
      }
    }
    
    // Check if the URL already has a hash/query and update/append it
    let baseUrl = cleanUrl;
    const hashIndex = baseUrl.indexOf('#');
    if (hashIndex !== -1) {
      baseUrl = baseUrl.substring(0, hashIndex);
    }
    const queryIndex = baseUrl.indexOf('?');
    if (queryIndex !== -1) {
      baseUrl = baseUrl.substring(0, queryIndex);
    }

    if (isPdf) {
      setIframeUrl(`${baseUrl}#toolbar=0&page=${pageNum}`);
    } else {
      setIframeUrl(`${baseUrl}?page=${pageNum}#page=${pageNum}`);
    }
  };


  // Interactive state
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [activeXray, setActiveXray] = useState<any>(null);
  const [lastProcessedTime, setLastProcessedTime] = useState<number>(-1);

  // Smart Learning Features States
  const [hoveredMarker, setHoveredMarker] = useState<Marker | null>(null);
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<{ timestamp: number; text: string; type: 'subtitle' | 'chapter' }[]>([]);
  
  // Chant-Along State
  const [activeChant, setActiveChant] = useState<any>(null);
  const [chantStatus, setChantStatus] = useState<'idle' | 'listening'>('idle');
  const [chantTranscript, setChantTranscript] = useState('');
  const [chantScore, setChantScore] = useState<number | null>(null);
  const [chantError, setChantError] = useState<string | null>(null);
  
  // Branching State
  const [activeBranch, setActiveBranch] = useState<any>(null);
  
  // Study Room State
  const [studyRoomId, setStudyRoomId] = useState<string | null>(null);
  const [studyRoom, setStudyRoom] = useState<any>(null);
  const [showStudyRoomSidebar, setShowStudyRoomSidebar] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  // AI Tutor State
  const [showAiTutorSidebar, setShowAiTutorSidebar] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<any[]>([
    { role: 'model', content: 'Namaste! 🙏 I am Vyoma Guru, your AI Tutor for this specific video. I have full context of what you are currently watching.\n\nAsk me to explain concepts, translate terms, or elaborate on the content of this lesson!' }
  ]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const aiChatEndRef = useRef<HTMLDivElement>(null);
  const [isHost, setIsHost] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [flashcardStatus, setFlashcardStatus] = useState<string | null>(null);

  const finalNextUrl = nextEpisodeUrl ? (studyRoomId ? `${nextEpisodeUrl}&room=${studyRoomId}` : nextEpisodeUrl) : undefined;

  // Custom Controls State
  const [showControls, setShowControls] = useState(true);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // UI state for menus
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [audioMode, setAudioMode] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const isAudio = audioMode || isAudioFormat;

  // Auto-scroll AI Chat
  useEffect(() => {
    if (aiChatEndRef.current) {
      aiChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiChatMessages, isAiLoading, showAiTutorSidebar]);

  const [localTime, setLocalTime] = useState<number>(0);
  const currentPosition = isNonNativeVideo && !isAudioFormat ? localTime : (videoRef.current?.currentTime || 0);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // HLS Adaptive State
  const hlsRef = useRef<Hls | null>(null);
  const [qualityLevels, setQualityLevels] = useState<{ index: number; height: number; bitrate: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [activeResolution, setActiveResolution] = useState<string>('');

  // Auto-play State
  const [showCountdown, setShowCountdown] = useState(false);
  const [count, setCount] = useState(6);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Progress State
  const [hasSetInitialPosition, setHasSetInitialPosition] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    setIsFullscreen(!!document.fullscreenElement);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Mouse move idle detection for controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showQualityMenu) setShowControls(false);
    }, 3000);
  };

  const skip = (seconds: number) => {
    if (isNonNativeVideo && !isAudioFormat) {
      setLocalTime(prev => {
        const next = Math.max(0, Math.min(duration, prev + seconds));
        updateTime(next);
        return next;
      });
    } else if (videoRef.current) {
      videoRef.current.currentTime += seconds;
      updateTime(videoRef.current.currentTime);
    }
  };

  const handleSpeedChange = (s: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = s;
    }
    setPlaybackRate(s);
  };

  // Sync volume, mute, and play/pause state to same-origin iframe elements (Dual Control Sync)
  const syncIframeMedia = () => {
    if (!isHtml || !iframeRef.current) return;
    try {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      const audios = iframeDoc.querySelectorAll('audio');
      const videos = iframeDoc.querySelectorAll('video');
      const mediaElements = [...Array.from(audios), ...Array.from(videos)];

      mediaElements.forEach((media: any) => {
        media.volume = volume;
        media.muted = isMuted;

        if (isPlaying) {
          if (media.__wasPlaying) {
            media.play().catch(() => {});
            delete media.__wasPlaying;
          }
        } else {
          if (!media.paused) {
            media.__wasPlaying = true;
            media.pause();
          }
        }
      });
    } catch (e) {
      // Cross-origin iframe, ignore gracefully
    }
  };

  // Sync state changes to iframe
  useEffect(() => {
    syncIframeMedia();
  }, [isPlaying, volume, isMuted, isHtml]);

  // Attach event propagation when same-origin iframe loads
  const handleIframeLoad = () => {
    if (!isHtml || !iframeRef.current) return;
    try {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      const resetTimer = () => {
        handleMouseMove();
      };

      iframeDoc.addEventListener('mousemove', resetTimer);
      iframeDoc.addEventListener('click', resetTimer);
      iframeDoc.addEventListener('keydown', resetTimer);

      // Perform initial media synchronization
      syncIframeMedia();
    } catch (e) {
      console.error("Iframe event delegation blocked (cross-origin):", e);
    }
  };

  // Core Media Initialization
  useEffect(() => {
    if (episodeId && courseId) {
      playEpisode(episodeId, courseId, cleanUrl, initialPosition || 0, poster);
    }
    
    let finalUrl = cleanUrl;
    if (cleanUrl.startsWith('https://d3a8qbwm8iliew.cloudfront.net/')) {
      finalUrl = cleanUrl.replace('https://d3a8qbwm8iliew.cloudfront.net/', '/video-proxy/');
    }

    if (isNonNativeVideo) {
      // Auto-complete interactive content after 15s
      const timer = setTimeout(() => {
        if (episodeId) {
          fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ episodeId, position: 999999, completed: true }),
            keepalive: true
          }).catch(() => {});
        }
      }, 15000);
      return () => clearTimeout(timer);
    }

    const video = videoRef.current;
    if (!video) return;

    const isHls = lowerUrl.includes('m3u8') || lowerUrl.includes('mpegurl');

    if (!isAudioFormat && isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({ capLevelToPlayerSize: true, autoStartLoad: true });
        hlsRef.current = hls;
        
        hls.loadSource(finalUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const levels = hls.levels.map((level, idx) => ({
            index: idx, height: level.height, bitrate: level.bitrate
          }));
          setQualityLevels(levels);
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          const activeLevel = hls.levels[data.level];
          if (activeLevel) setActiveResolution(`${activeLevel.height}p`);
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = finalUrl;
      }
    } else {
      video.src = finalUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [episodeId, courseId, cleanUrl]);

  // Load subtitles and parse WebVTT
  useEffect(() => {
    if (!subtitleUrl) return;
    
    fetch(subtitleUrl)
      .then(res => res.text())
      .then(text => {
        const parsed = parseVtt(text);
        setSubtitles(parsed);
      })
      .catch(err => console.error("Error fetching subtitles:", err));
  }, [subtitleUrl]);

  // Retrieve current user and check URL query parameters for Study Room ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setStudyRoomId(room);
      setShowStudyRoomSidebar(true);
    }
    
    getClientUser()
      .then(user => {
        if (user) {
          setCurrentUser(user);
        } else {
          // Fallback guest user to allow anonymous co-watching
          setCurrentUser({
            id: 'guest-' + Math.random().toString(36).substring(2, 9),
            name: 'Guest_' + Math.floor(1000 + Math.random() * 9000),
            email: 'guest@vyoma-ott.org',
            plan: 'FREE'
          });
        }
      })
      .catch(e => console.error("Error fetching client user details", e));
  }, []);

  // Poll Study Room state and synchronize playhead / playback status
  const isPlayingRef = useRef(isPlaying);
  const localTimeRef = useRef(localTime);
  
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    localTimeRef.current = localTime;
  }, [localTime]);

  // Auto-scroll chat log to bottom when a new message arrives
  useEffect(() => {
    if (showStudyRoomSidebar && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showStudyRoomSidebar]);

  useEffect(() => {
    if (!studyRoomId || !currentUser) return;

    const interval = setInterval(async () => {
      try {
        const room = await pollStudyRoom(studyRoomId);
        if (!room) return;

        setStudyRoom(room);
        setChatMessages(room.messages || []);

        const isUserHost = currentUser.id === room.hostId;
        setIsHost(isUserHost);

        if (isUserHost) {
          const pos = isNonNativeVideo && !isAudioFormat 
            ? localTimeRef.current 
            : (videoRef.current?.currentTime || 0);
          await updateStudyRoomState(studyRoomId, isPlayingRef.current, pos, episodeId || "none");
        } else {
          // If the host is on a different episode, redirect the participant
          const currentEp = episodeId || "none";
          const hostEp = room.episodeId || "none";
          if (hostEp !== currentEp) {
            const destUrl = hostEp === "none"
              ? `/watch/${courseId}?room=${studyRoomId}`
              : `/watch/${courseId}?ep=${hostEp}&room=${studyRoomId}`;
            window.location.href = destUrl;
            return;
          }

          if (isNonNativeVideo && !isAudioFormat) {
            if (Math.abs(localTimeRef.current - room.position) > 4) {
              setLocalTime(room.position);
            }
            if (room.isPlaying !== isPlayingRef.current) {
              setPlaying(room.isPlaying);
            }
          } else if (videoRef.current) {
            const timeDiff = Math.abs(videoRef.current.currentTime - room.position);
            if (timeDiff > 4) {
              videoRef.current.currentTime = room.position;
            }
            if (room.isPlaying && videoRef.current.paused) {
              videoRef.current.play().catch(() => {});
              setPlaying(true);
            } else if (!room.isPlaying && !videoRef.current.paused) {
              videoRef.current.pause();
              setPlaying(false);
            }
          }
        }
      } catch (e) {
        console.error("Study Room polling error:", e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [studyRoomId, currentUser, episodeId, courseId]);

  // Set default simulated duration for non-native files
  useEffect(() => {
    if (isNonNativeVideo && !isAudioFormat) {
      setDuration(600); // 10 minutes simulated
    }
  }, [isNonNativeVideo, isAudioFormat]);

  // Simulated Timer for Non-Native Formats (PDF, HTML, Embeds)
  useEffect(() => {
    if (!isNonNativeVideo || isAudioFormat) return;

    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setLocalTime(prev => {
          const next = prev + 1 * playbackRate;
          if (next >= duration) {
            if (timer) clearInterval(timer);
            handleEnded();
            return duration;
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, isNonNativeVideo, isAudioFormat, duration, playbackRate]);

  // Handle markers & progress updates for Non-Native Formats
  useEffect(() => {
    if (!isNonNativeVideo || isAudioFormat) return;
    const current = Math.floor(localTime);
    updateTime(localTime);

    // Initial Position Resume
    if (!hasSetInitialPosition && initialPosition && initialPosition > 0) {
      setLocalTime(initialPosition);
      setHasSetInitialPosition(true);
    } else if (!hasSetInitialPosition && current > 2) {
      setHasSetInitialPosition(true);
    }

    // Telemetry Sync every 10 seconds
    if (episodeId && current > 0 && current - lastUpdateRef.current >= 10) {
      lastUpdateRef.current = current;
      const isComplete = current >= duration * 0.95;
      
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId: episodeId,
          position: current,
          completed: isComplete
        }),
        keepalive: true
      }).catch(err => console.error("Progress save error", err));
    }

    // Interactive Marker Polling
    if (current !== lastProcessedTime) {
      setLastProcessedTime(current);
      
      const marker = markers.find(m => Math.floor(m.timestamp) === current);
      if (marker) {
        if (marker.type === 'QUIZ_PROMPT') {
          setPlaying(false);
          setActiveQuiz(parsePayload(marker.payload));
        } else if (marker.type === 'CHANT_PROMPT') {
          setPlaying(false);
          setActiveChant(parsePayload(marker.payload));
        } else if (marker.type === 'BRANCH_PROMPT') {
          setPlaying(false);
          setActiveBranch(parsePayload(marker.payload));
        }
      }
    }
  }, [localTime, isNonNativeVideo, isAudioFormat, duration, episodeId, initialPosition, markers, lastProcessedTime, hasSetInitialPosition]);

  // Handle X-Ray glossary for Non-Native Formats on pause
  useEffect(() => {
    if (!isNonNativeVideo || isAudioFormat) return;
    
    if (!isPlaying) {
      const current = Math.floor(localTime);
      const marker = markers.find(m => m.type === 'XRAY_GLOSSARY' && Math.abs(m.timestamp - current) < 30);
      if (marker) {
        setActiveXray(JSON.parse(marker.payload));
      }
    } else {
      setActiveXray(null);
    }
  }, [isPlaying, isNonNativeVideo, isAudioFormat, localTime, markers]);

  // In-Video Search matching effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const results: { timestamp: number; text: string; type: 'subtitle' | 'chapter' }[] = [];

    // 1. Search chapters
    markers.filter(m => m.type === 'CHAPTER').forEach(m => {
      const chapterData = parsePayload(m.payload);
      const title = typeof chapterData === 'object' ? chapterData.title : chapterData;
      if (title && String(title).toLowerCase().includes(query)) {
        results.push({
          timestamp: m.timestamp,
          text: `Chapter: ${title}`,
          type: 'chapter'
        });
      }
    });

    // 2. Search subtitles
    subtitles.forEach(cue => {
      if (cue.text.toLowerCase().includes(query)) {
        results.push({
          timestamp: cue.startTime,
          text: cue.text,
          type: 'subtitle'
        });
      }
    });

    setSearchResults(results.slice(0, 30));
  }, [searchQuery, subtitles, markers]);

  // Flashcard Deck addition from X-Ray Glossary
  const handleAddToFlashcard = async () => {
    if (!activeXray) return;
    setFlashcardStatus("Adding...");
    try {
      const res = await addFlashcard(activeXray.title, activeXray.description);
      if (res.success) {
        setFlashcardStatus(res.message);
      } else {
        setFlashcardStatus("Failed to add.");
      }
    } catch (err: any) {
      setFlashcardStatus(err.message || "Error adding flashcard");
    }
    setTimeout(() => setFlashcardStatus(null), 3000);
  };

  // AI Chant Recording with Web Speech API
  const startChantRecording = () => {
    const SpeechRecognition = typeof window !== 'undefined'
      ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
      : null;

    if (!SpeechRecognition) {
      // Fallback simulating speech recognition (helpful for unsupported environments or server rendering)
      setChantStatus('listening');
      setChantTranscript('');
      setChantError("Speech recognition not supported in this browser. Fallback simulator active.");
      
      setTimeout(() => {
        const targetStr = activeChant?.transliteration || activeChant?.text || "";
        setChantTranscript(targetStr);
        const score = calculateSimilarity(targetStr, targetStr);
        setChantScore(score);
        setChantStatus('idle');
      }, 2000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'sa-IN';

      recognition.onstart = () => {
        setChantStatus('listening');
        setChantTranscript('');
        setChantScore(null);
        setChantError(null);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event);
        setChantError(event.error || "Speech recognition error");
        setChantStatus('idle');
      };

      recognition.onend = () => {
        setChantStatus('idle');
      };

      recognition.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setChantTranscript(resultText);
        const target = activeChant?.transliteration || activeChant?.text || "";
        const score = calculateSimilarity(resultText, target);
        setChantScore(score);
      };

      recognition.start();
    } catch (e: any) {
      setChantError("Microphone access failed.");
      setChantStatus('idle');
    }
  };

  // Ambilight Engine (Only active for standard video)
  useEffect(() => {
    let animationFrameId: number;
    let lastDrawTime = 0;

    const drawCanvas = (time: number) => {
      if (time - lastDrawTime > 60) {
        if (videoRef.current && canvasRef.current && isPlaying && !isMinimized && !isAudio && !isNonNativeVideo) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
          }
        }
        lastDrawTime = time;
      }
      animationFrameId = requestAnimationFrame(drawCanvas);
    };

    if (isPlaying && !isMinimized && !isAudio && !isNonNativeVideo) {
      animationFrameId = requestAnimationFrame(drawCanvas);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, isMinimized, videoRef, isAudio, isNonNativeVideo]);

  const handleTimeUpdate = (e: any) => {
    const current = Math.floor(e.target.currentTime);
    updateTime(e.target.currentTime);
    
    // Initial Position Resume
    if (!hasSetInitialPosition && initialPosition && initialPosition > 0 && e.target.duration > 0) {
      if (Math.abs(current - initialPosition) > 2 && current < 5) {
        e.target.currentTime = initialPosition;
        setHasSetInitialPosition(true);
      }
    } else if (!hasSetInitialPosition && current > 2) {
      setHasSetInitialPosition(true);
    }

    // Telemetry Sync every 10 seconds
    if (episodeId && current > 0 && current - lastUpdateRef.current >= 10) {
      lastUpdateRef.current = current;
      const isComplete = current >= e.target.duration * 0.95;
      
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId: episodeId,
          position: current,
          completed: isComplete
        }),
        keepalive: true
      }).catch(err => console.error("Progress save error", err));
    }

    // Interactive Marker Polling
    if (current !== lastProcessedTime) {
      setLastProcessedTime(current);
      
      const marker = markers.find(m => Math.floor(m.timestamp) === current);
      if (marker) {
        if (marker.type === 'QUIZ_PROMPT') {
          videoRef.current?.pause();
          setPlaying(false);
          setActiveQuiz(parsePayload(marker.payload));
        } else if (marker.type === 'CHANT_PROMPT') {
          videoRef.current?.pause();
          setPlaying(false);
          setActiveChant(parsePayload(marker.payload));
        } else if (marker.type === 'BRANCH_PROMPT') {
          videoRef.current?.pause();
          setPlaying(false);
          setActiveBranch(parsePayload(marker.payload));
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
    if (episodeId) {
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId, position: duration, completed: true }),
        keepalive: true
      }).catch(() => {});
    }

    if (finalNextUrl) {
      setShowCountdown(true);
      setCount(5);
      timerRef.current = setInterval(() => {
        setCount(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            router.push(finalNextUrl);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handlePause = () => {
    setPlaying(false);
    if (!videoRef.current) return;
    
    const current = Math.floor(videoRef.current.currentTime);
    const marker = markers.find(m => m.type === 'XRAY_GLOSSARY' && Math.abs(m.timestamp - current) < 30);
    if (marker) {
      setActiveXray(JSON.parse(marker.payload));
    }
  };

  const handlePlay = () => {
    setPlaying(true);
    setActiveXray(null);
  };

  const closeQuiz = () => {
    setActiveQuiz(null);
    videoRef.current?.play();
    setPlaying(true);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0 && isMuted) {
      setIsMuted(false);
      if (videoRef.current) {
        videoRef.current.muted = false;
      }
    }
    if (videoRef.current) {
      videoRef.current.volume = val;
    }
  };

  const changeSpeed = () => {
    if (videoRef.current) {
      const rates = [0.5, 1, 1.25, 1.5, 2];
      const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
      const nextRate = rates[nextIdx];
      videoRef.current.playbackRate = nextRate;
      setPlaybackRate(nextRate);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (isNonNativeVideo && !isAudioFormat) {
      setLocalTime(time);
      updateTime(time);
      navigateIframeToTime(time);
    } else if (videoRef.current) {
      videoRef.current.currentTime = time;
      updateTime(time);
    }
  };

  const changeQuality = (levelIndex: number) => {
    setCurrentQuality(levelIndex);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
    }
    setShowQualityMenu(false);
  };

  // If minimized to PiP
  if (isMinimized) {
    return (
      <div style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.2)', textAlign: 'center' }}>
        <h3 style={{ color: '#aaa', margin: 0 }}>Playing in Picture-in-Picture mode</h3>
        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>The video is currently floating in the corner of your screen.</p>
      </div>
    );
  }

  // Non-Native early return removed to allow full player control overlays to render

  return (
    <div 
      ref={playerContainerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      style={{ 
        position: 'relative', 
        width: '100%', 
        aspectRatio: showStudyRoomSidebar ? '21/9' : '16/9', 
        borderRadius: '12px', 
        overflow: 'hidden', 
        background: '#000',
        display: 'flex',
        flexDirection: 'row'
      }}
    >
      {/* 1. Main Video & Overlays Area */}
      <div style={{ position: 'relative', flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {/* Background Canvas for Ambilight */}
        {!isAudio && (
          <canvas 
            ref={canvasRef} 
            style={{
              position: 'absolute',
              top: '-10%', left: '-10%',
              width: '120%', height: '120%',
              filter: 'blur(60px) saturate(200%) brightness(0.8)',
              opacity: isPlaying ? 1 : 0.5,
              transition: 'opacity 0.5s',
              zIndex: 0,
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Audio Mode Poster Fallback & CD Animation */}
        {isAudio && (
           <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, background: `url(${poster || '/default-poster.jpg'}) center/cover no-repeat` }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }} />
              
              {/* Spinning Vinyl Record */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <div style={{
                   width: '180px', height: '180px',
                   borderRadius: '50%',
                   background: '#111',
                   border: '8px solid #222',
                   boxShadow: '0 0 40px rgba(0,0,0,0.8), inset 0 0 20px #000',
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   animationName: 'spinVinyl',
                   animationDuration: '3s',
                   animationTimingFunction: 'linear',
                   animationIterationCount: 'infinite',
                   animationPlayState: isPlaying ? 'running' : 'paused',
                   position: 'relative'
                 }}>
                    {/* CD Grooves */}
                    <div style={{ position: 'absolute', width: '140px', height: '140px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)' }} />
                    <div style={{ position: 'absolute', width: '100px', height: '100px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)' }} />
                    
                    {/* CD Center Label */}
                    <div style={{
                       width: '60px', height: '60px', borderRadius: '50%',
                       background: `url(${poster || '/default-poster.jpg'}) center/cover`,
                       border: '2px solid #f26422',
                       display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                       <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fff', boxShadow: 'inset 0 0 4px #000' }} />
                    </div>
                 </div>
                 
                 <h3 style={{ color: '#fff', margin: '20px 0 5px 0', fontSize: '1.2rem', fontWeight: 800, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                   Audio Mode Active
                 </h3>
                 <p style={{ color: '#aaa', fontSize: '0.8rem', margin: 0 }}>Video is disabled to save bandwidth</p>
              </div>
           </div>
        )}
        
        {/* Primary Video Player / Embed Frame */}
        {isNonNativeVideo && !isAudioFormat ? (
          <div style={{
            position: 'relative',
            width: '100%',
            height: (isHtml || isPdf) && !docControlsMode ? 'calc(100% - 60px)' : '100%',
            zIndex: 1,
            boxShadow: '0 0 50px rgba(0,0,0,0.8)'
          }}>
            {isEmbedVideo ? (
              <iframe src={isYouTube ? getYouTubeEmbedUrl(cleanUrl) : getVimeoEmbedUrl(cleanUrl)} style={{ width: '100%', height: '100%', border: 'none' }} allow="autoplay; fullscreen" allowFullScreen />
            ) : isPdf ? (
              <iframe src={iframeUrl} style={{ width: '100%', height: '100%', border: 'none' }} />
            ) : isHtml ? (
              <iframe 
                ref={iframeRef}
                src={iframeUrl} 
                onLoad={handleIframeLoad}
                style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} 
              />
            ) : null}
          </div>
        ) : (
          <video
            ref={videoRef}
            poster={isAudio ? undefined : poster}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onClick={() => setPlaying(!isPlaying)}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: isAudio ? 0 : 1,
              boxShadow: '0 0 50px rgba(0,0,0,0.8)',
              cursor: 'pointer',
              opacity: isAudio ? 0 : 1
            }}
          >
            {subtitleUrl && subtitlesEnabled && (
              <track kind="subtitles" src={subtitleUrl} srcLang="en" label="English" default />
            )}
          </video>
        )}

        {/* CUSTOM THEATER SHIELD (CONTROL OVERLAYS) */}
        {isHtml && docControlsMode && (
          <button
            onClick={() => setDocControlsMode(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 100,
              background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '0.8rem',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(242,100,34,0.4)',
              pointerEvents: 'auto'
            }}
          >
            🖥️ Show Player Controls
          </button>
        )}

        <div style={{
          position: (isHtml || isPdf) && !docControlsMode ? 'relative' : 'absolute',
          top: (isHtml || isPdf) && !docControlsMode ? undefined : 0,
          left: 0, right: 0,
          bottom: 0,
          height: (isHtml || isPdf) && !docControlsMode ? '60px' : undefined,
          background: (isHtml || isPdf) && !docControlsMode 
            ? 'linear-gradient(to top, #0f172a 0%, #1e293b 100%)' 
            : showControls ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.2) 85%, rgba(0,0,0,0.6) 100%)' : 'transparent',
          display: docControlsMode ? 'none' : 'flex',
          flexDirection: 'column',
          justifyContent: (isHtml || isPdf) && !docControlsMode ? 'center' : 'space-between',
          pointerEvents: (isHtml || isPdf) && !docControlsMode ? 'auto' : 'none',
          opacity: (isHtml || isPdf) && !docControlsMode ? 1 : (showControls ? 1 : 0),
          transition: 'opacity 0.3s ease',
          zIndex: 10
        }}>

          {/* Top Info Tray */}
          {!(isHtml || isPdf) && (
            <div style={{ padding: '20px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: showControls ? 'auto' : 'none', width: '100%' }}>
              <div>
                {isFullscreen && (
                  <div style={{ color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Now Streaming</h3>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Middle Play Trigger (Visual Feedback) */}
          {!(isHtml || isPdf) && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                if (isHtml || isPdf) return;
                setPlaying(!isPlaying);
                if (isPlaying) videoRef.current?.pause();
                else videoRef.current?.play();
              }}
              style={{ 
                display: 'flex', 
                flex: 1, 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: (isHtml || isPdf) ? 'default' : 'pointer',
                pointerEvents: (isHtml || isPdf) ? 'none' : 'auto'
              }}
            >
              {!isPlaying && !(isHtml || isPdf) && (
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.background = '#f26422';
                  e.currentTarget.style.borderColor = '#fff';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(242, 100, 34, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)';
                }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '4px', color: '#fff' }}>
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              )}
            </div>
          )}

          {/* Bottom Complex Console */}
          <div 
            className="player-console-bottom" 
            style={{ 
              padding: (isHtml || isPdf) ? '10px 25px' : '0 25px 25px 25px', 
              pointerEvents: (isHtml || isPdf) ? 'auto' : (showControls ? 'auto' : 'none'),
              width: '100%'
            }}
          >
            
            {/* Glowing Slider Track */}
            {!(isHtml || isPdf) && (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '15px', width: '100%' }}>
                <input 
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentPosition}
                  onChange={handleSeek}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '4px',
                    background: `linear-gradient(to right, var(--primary, #f26422) 0%, var(--primary, #f26422) ${(currentPosition / (duration || 100)) * 100}%, rgba(255,255,255,0.2) ${(currentPosition / (duration || 100)) * 100}%, rgba(255,255,255,0.2) 100%)`,
                    appearance: 'none',
                    cursor: 'pointer',
                    margin: 0,
                    outline: 'none',
                    zIndex: 10
                  }}
                />
                
                {/* Smart Chapter Ticks */}
                {duration > 0 && markers.filter(m => m.type === 'CHAPTER').map((m) => {
                  const leftPercent = (m.timestamp / duration) * 100;
                  return (
                    <div 
                      key={m.id}
                      style={{
                        position: 'absolute',
                        left: `${leftPercent}%`,
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#fff',
                        border: '2px solid #f26422',
                        transform: 'translate(-50%, -2px)',
                        cursor: 'pointer',
                        zIndex: 15
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isNonNativeVideo && !isAudioFormat) {
                          setLocalTime(m.timestamp);
                          updateTime(m.timestamp);
                          navigateIframeToTime(m.timestamp);
                        } else if (videoRef.current) {
                          videoRef.current.currentTime = m.timestamp;
                          updateTime(m.timestamp);
                        }
                      }}
                      onMouseEnter={() => setHoveredMarker(m)}
                      onMouseLeave={() => setHoveredMarker(null)}
                    />
                  );
                })}

                
                {/* Hover tooltip for Chapters */}
                {hoveredMarker && duration > 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '140%',
                    left: `${(hoveredMarker.timestamp / duration) * 100}%`,
                    transform: 'translateX(-50%)',
                    background: 'rgba(15,22,36,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                    zIndex: 100,
                    pointerEvents: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(5px)'
                  }}>
                    <span style={{ fontWeight: 800, color: '#f26422', marginRight: '5px' }}>
                      [{formatTime(hoveredMarker.timestamp)}]
                    </span>
                    {typeof parsePayload(hoveredMarker.payload) === 'object' ? parsePayload(hoveredMarker.payload).title : parsePayload(hoveredMarker.payload)}
                  </div>
                )}

                <style>{`
                  input[type=range]::-webkit-slider-thumb {
                    appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: var(--primary, #f26422);
                    cursor: pointer;
                    border: 2px solid #fff;
                    box-shadow: 0 0 10px rgba(242,100,34,0.8);
                    transition: transform 0.1s ease;
                    z-index: 20;
                    position: relative;
                  }
                  input[type=range]:hover::-webkit-slider-thumb {
                    transform: scale(1.3);
                  }
                `}</style>
              </div>
            )}

            {/* Control Trays */}
            <div className="player-controls-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              
              {/* LEFT: Main Actions */}
              <div className="player-controls-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                
                {/* Play/Pause & Skip buttons (only for native videos/audio) */}
                {!(isHtml || isPdf) && (
                  <>
                    {/* Play/Pause */}
                    <button onClick={() => { setPlaying(!isPlaying); if (isPlaying) videoRef.current?.pause(); else videoRef.current?.play(); }} style={btnStyle}>
                      {isPlaying ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      )}
                    </button>

                    {/* Skip Back 10 */}
                    <button onClick={() => skip(-10)} style={btnStyle} title="Backward 10s">
                       <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8zm-1.33 9.24h-.93v-3.06h-.03l-1 .7v-.7l1-.7h.96v3.76zm2.93-3.82c.67 0 1.19.53 1.19 1.89s-.52 1.93-1.19 1.93-1.2-.55-1.2-1.93.53-1.89 1.2-1.89zm0 .52c-.32 0-.54.36-.54 1.37s.21 1.41.54 1.41.53-.36.53-1.41-.22-1.37-.53-1.37z"/></svg>
                    </button>

                    {/* Skip Fwd 10 */}
                    <button onClick={() => skip(10)} style={btnStyle} title="Forward 10s">
                       <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M4 13c0 4.42 3.58 8 8 8s8-3.58 8-8h-2c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8zm8.67 1.24h-.93v-3.06h-.03l-1 .7v-.7l1-.7h.96v3.76zm2.93-3.82c.67 0 1.19.53 1.19 1.89s-.52 1.93-1.19 1.93-1.2-.55-1.2-1.93.53-1.89 1.2-1.89zm0 .52c-.32 0-.54.36-.54 1.37s.21 1.41.54 1.41.53-.36.53-1.41-.22-1.37-.53-1.37z"/></svg>
                    </button>
                  </>
                )}

                {/* Volume Mixer */}
                {!isPdf && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }} className="volume-mixer">
                    <button onClick={toggleMute} style={btnStyle}>
                      {isMuted || volume === 0 ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                      ) : volume < 0.5 ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-2 16.77l-5-5H3V9h4l5-5v16zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                      )}
                    </button>
                    <input 
                      className="volume-slider"
                      type="range"
                      min={0} max={1} step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      style={{
                        width: '70px',
                        height: '4px',
                        background: 'rgba(255,255,255,0.3)',
                        borderRadius: '2px',
                        appearance: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                )}

                {/* Time Readout */}
                <div className="time-readout" style={{ color: '#fff', fontSize: '0.85rem', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                  {formatTime(currentPosition)} <span style={{ color: 'rgba(255,255,255,0.4)' }}>/</span> {formatTime(duration)}
                </div>

              </div>

              {/* RIGHT: Dynamic Speed Controls + Screen */}
              <div className="player-controls-right" style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative' }}>
                
                {/* 🖥️ Doc Controls Button for HTML Flipbooks */}
                {isHtml && (
                  <button 
                    onClick={() => setDocControlsMode(true)} 
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backdropFilter: 'blur(5px)'
                    }}
                    title="Interact with Document Controls"
                  >
                    🖥️ Doc Controls
                  </button>
                )}


                {/* 👥 Study Room Toggle / Session Launcher */}
                <button 
                  onClick={async () => {
                    if (!studyRoomId) {
                      if (courseId) {
                        try {
                          const res = await createStudyRoom(courseId, episodeId || "none");
                          if (res.success && res.roomId) {
                            setStudyRoomId(res.roomId);
                            setIsHost(true);
                            setShowStudyRoomSidebar(true);
                            const newUrl = `${window.location.pathname}?room=${res.roomId}`;
                            window.history.pushState({ path: newUrl }, '', newUrl);
                          }
                        } catch (err) {
                          alert("Please log in to start a Study Room session.");
                          console.error("Failed to create study room", err);
                        }
                      }
                    } else {
                      setShowStudyRoomSidebar(!showStudyRoomSidebar);
                    }
                  }}
                  style={{
                    background: studyRoomId ? 'rgba(242,100,34,0.2)' : 'rgba(255,255,255,0.1)',
                    border: studyRoomId ? '1px solid rgba(242,100,34,0.4)' : '1px solid rgba(255,255,255,0.2)',
                    color: studyRoomId ? '#f26422' : '#fff',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backdropFilter: 'blur(5px)'
                  }}
                  title={studyRoomId ? "Study Room Active" : "Start Study Room"}
                >
                  👥 {studyRoomId ? 'Room Active' : 'Study Room'}
                </button>



                {/* Audio/Video mode switcher */}
                {!isAudioFormat && !(isHtml || isPdf) && (
                  <button 
                    onClick={() => setAudioMode(!audioMode)} 
                    style={{
                      background: audioMode ? 'rgba(242,100,34,0.2)' : 'rgba(255,255,255,0.1)',
                      border: audioMode ? '1px solid rgba(242,100,34,0.4)' : '1px solid rgba(255,255,255,0.2)',
                      color: audioMode ? '#f26422' : '#fff',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backdropFilter: 'blur(5px)'
                    }}
                  >
                    {audioMode ? "📻 Audio" : "📺 Video"}
                  </button>
                )}

                {/* CC Subtitles */}
                {subtitleUrl && !(isHtml || isPdf) && (
                  <button 
                    onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                    style={{
                      background: subtitlesEnabled ? 'rgba(70,211,105,0.2)' : 'rgba(255,255,255,0.1)',
                      border: subtitlesEnabled ? '1px solid rgba(70,211,105,0.4)' : '1px solid rgba(255,255,255,0.2)',
                      color: subtitlesEnabled ? '#46d369' : '#fff',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backdropFilter: 'blur(5px)'
                    }}
                  >
                    💬 {subtitlesEnabled ? 'CC ON' : 'CC OFF'}
                  </button>
                )}

                {/* Advanced Speed Selector */}
                {!(isHtml || isPdf) && (
                  <div style={{ position: 'relative' }}>
                     <button 
                       onClick={() => setShowSpeedMenu(!showSpeedMenu)} 
                       style={{
                         background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
                         padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 900,
                         cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(5px)'
                       }}
                     >
                       ⚡ {playbackRate === 1 ? 'Normal' : `${playbackRate}x`}
                     </button>

                     {showSpeedMenu && (
                       <div 
                         id="speed-menu"
                         onMouseLeave={() => setShowSpeedMenu(false)}
                         style={{
                           position: 'absolute', bottom: '120%', right: 0,
                           background: 'rgba(15,22,36,0.95)', border: '1px solid rgba(255,255,255,0.1)',
                           borderRadius: '8px', padding: '8px 0', width: '120px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                           zIndex: 50, display: 'flex', flexDirection: 'column', backdropFilter: 'blur(10px)'
                         }}
                       >
                         {[0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4].map((s) => (
                           <button
                             key={s}
                             onClick={() => { handleSpeedChange(s); setShowSpeedMenu(false); }}
                             style={{
                               background: 'transparent', border: 'none', color: playbackRate === s ? '#f26422' : '#fff',
                               padding: '8px 16px', textAlign: 'left', fontWeight: playbackRate === s ? 900 : 600,
                               fontSize: '0.85rem', cursor: 'pointer'
                             }}
                             onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                             onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                           >
                             {s === 1 ? '1.0x (Normal)' : `${s}x`}
                           </button>
                         ))}
                       </div>
                     )}
                  </div>
                )}
                
                {/* Quality Selector */}
                {qualityLevels.length > 0 && (
                  <div style={{ position: 'relative' }}>
                     <button 
                       onClick={() => setShowQualityMenu(!showQualityMenu)} 
                       style={{
                         background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
                         padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 900,
                         cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(5px)'
                       }}
                     >
                       ⚙️ {currentQuality === -1 ? `Auto (${activeResolution || '...'})` : `${qualityLevels[currentQuality]?.height}p`}
                     </button>
                     {showQualityMenu && (
                       <div style={{ position: 'absolute', bottom: '120%', right: 0, background: 'rgba(15,22,36,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 0', width: '150px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', flexDirection: 'column', backdropFilter: 'blur(10px)' }}>
                         <button onClick={() => changeQuality(-1)} style={{ padding: '10px 20px', background: currentQuality === -1 ? 'rgba(242,100,34,0.2)' : 'transparent', border: 'none', color: currentQuality === -1 ? '#f26422' : '#fff', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700 }}>
                           Auto
                         </button>
                         {qualityLevels.map((lvl, idx) => (
                           <button key={idx} onClick={() => changeQuality(idx)} style={{ padding: '10px 20px', background: currentQuality === idx ? 'rgba(242,100,34,0.2)' : 'transparent', border: 'none', color: currentQuality === idx ? '#f26422' : '#fff', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700 }}>
                             {lvl.height}p
                           </button>
                         ))}
                       </div>
                     )}
                  </div>
                )}

                {/* Fullscreen Trigger */}
                <button onClick={toggleFullscreen} style={btnStyle} title="Full Screen">
                  {!isFullscreen ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
                  )}
                </button>

              </div>
            </div>
          </div>
        </div>

        {/* Up Next Countdown Overlay */}
        {showCountdown && finalNextUrl && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(15px)', zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.4s ease'
          }}>
             <h4 style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Up Next</h4>
             <h2 style={{ fontSize: '2.2rem', color: '#fff', fontWeight: 900, marginBottom: '30px', textAlign: 'center', maxWidth: '80%' }}>{nextEpisodeTitle}</h2>
             
             <div style={{
              width: '120px', height: '120px', borderRadius: '50%', border: '4px solid rgba(242, 100, 34, 0.2)', borderTopColor: '#f26422',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              animation: 'spinVinyl 1.5s linear infinite', marginBottom: '35px', position: 'relative'
             }}>
                <div style={{ position: 'absolute', transform: 'rotate(0deg)', color: '#fff', fontSize: '2.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                   <span style={{ animation: 'spinBack 1.5s linear infinite' }}>{count > 0 ? count : '✓'}</span>
                </div>
             </div>

             <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={() => { if(timerRef.current) clearInterval(timerRef.current); setShowCountdown(false); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '12px 30px', borderRadius: '30px', cursor: 'pointer', fontWeight: 800, backdropFilter: 'blur(5px)' }}>
                   ✕ CANCEL
                </button>
                <button onClick={() => router.push(finalNextUrl!)} style={{ background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', border: 'none', color: '#fff', padding: '12px 35px', borderRadius: '30px', cursor: 'pointer', fontWeight: 900, boxShadow: '0 10px 30px rgba(242,100,34,0.3)' }}>
                   ▶ PLAY NOW
                </button>
             </div>
          </div>
        )}

        {/* 🔮 X-Ray Side Panel Overlay */}
        {activeXray && !isPlaying && (
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: '350px',
            background: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0.95) 100%)',
            zIndex: 5, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 30px',
            borderLeft: '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'auto'
          }}>
            <span style={{ color: '#aaa', fontSize: '0.7rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>X-Ray Context</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 15px 0', color: '#fff' }}>{activeXray.title}</h2>
            <p style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: 1.6, flex: 1, maxHeight: '200px', overflowY: 'auto' }}>
              {activeXray.description}
            </p>
            
            {/* ➕ Add to Flashcard Deck Button */}
            <button 
              onClick={handleAddToFlashcard}
              style={{
                width: '100%',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '30px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                marginBottom: '15px',
                boxShadow: '0 4px 15px rgba(242,100,34,0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {flashcardStatus || "➕ Add to Flashcard Deck"}
            </button>

            {activeXray.link && (
              <a href={activeXray.link} target="_blank" style={{ display: 'inline-block', textAlign: 'center', padding: '10px 20px', background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 800, border: '1px solid rgba(255,255,255,0.2)' }}>
                Download Resource
              </a>
            )}
          </div>
        )}

        {/* 🧠 Interactive Bandersnatch Quiz Overlay */}
        {activeQuiz && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(15px)',
            zIndex: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.4s ease',
            pointerEvents: 'auto'
          }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '600px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '20px', color: '#fff' }}>{activeQuiz.question}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {activeQuiz.options.map((opt: string, idx: number) => (
                  <button key={idx} onClick={closeQuiz} style={{ 
                    padding: '15px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                    color: '#fff', fontSize: '1rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '25px' }}>Select an answer to resume playback.</p>
            </div>
          </div>
        )}


        {/* 🎤 AI Chant-Along Voice Pronunciation Validator Overlay */}
        {activeChant && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)',
            zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.4s ease',
            pointerEvents: 'auto'
          }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(15,22,36,0.95), rgba(15,22,36,0.7))', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '600px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
              <span style={{ color: '#f26422', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>AI Chant Pronunciation Validator</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: '15px 0', color: '#fff', fontFamily: 'serif' }}>{activeChant.text}</h2>
              {activeChant.transliteration && (
                <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: '1.1rem', margin: '-5px 0 15px 0' }}>"{activeChant.transliteration}"</p>
              )}
              {activeChant.translation && (
                <p style={{ color: '#888', fontSize: '0.9rem', margin: '0 auto 25px auto', maxWidth: '85%' }}>{activeChant.translation}</p>
              )}

              {/* Mic / Status Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                {chantStatus === 'listening' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(255,75,75,0.2)', border: '2px solid rgb(255,75,75)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.2s infinite'
                    }}>
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'rgb(255,75,75)' }}>
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                      </svg>
                    </div>
                    <span style={{ color: 'rgb(255,75,75)', fontWeight: 800, fontSize: '0.9rem', marginTop: '10px' }}>Listening... Speak Sanskrit now</span>
                  </div>
                ) : (
                  <button 
                    onClick={startChantRecording}
                    style={{
                      padding: '14px 28px',
                      background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)',
                      color: '#fff',
                      fontSize: '1rem',
                      fontWeight: 900,
                      border: 'none',
                      borderRadius: '30px',
                      cursor: 'pointer',
                      boxShadow: '0 8px 25px rgba(242,100,34,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                    </svg>
                    START VALUATION
                  </button>
                )}

                {/* Error / Fallback indicator */}
                {chantError && (
                  <div style={{ color: '#ffeb3b', fontSize: '0.85rem', fontWeight: 600 }}>
                    ⚠️ {chantError}
                  </div>
                )}

                {/* Speech recognition transcription and score */}
                {chantTranscript && (
                  <div style={{ marginTop: '20px', width: '100%', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Captured audio transcript:</div>
                    <p style={{ color: '#fff', fontSize: '1.1rem', margin: '5px 0 15px 0', fontWeight: 700 }}>"{chantTranscript}"</p>
                    
                    {chantScore !== null && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                          <div style={{
                            fontSize: '2.5rem',
                            fontWeight: 900,
                            color: chantScore >= 80 ? '#46d369' : chantScore >= 50 ? '#ffeb3b' : '#ff4b4b'
                          }}>{chantScore}%</div>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 800, color: '#fff' }}>
                              {chantScore >= 80 ? 'Perfect Pronunciation!' : chantScore >= 50 ? 'Good effort! Try again.' : 'Needs practice!'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#aaa' }}>Accuracy score based on Sanskrit phonetics</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Fallback keyboard entry for manual testing */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                  <span style={{ color: '#888', fontSize: '0.75rem' }}>Or type transliterated Sanskrit to test:</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text"
                      placeholder="e.g. om bhur bhuvah svah"
                      style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value;
                          if (val.trim()) {
                            setChantTranscript(val);
                            const target = activeChant.transliteration || activeChant.text || "";
                            const score = calculateSimilarity(val, target);
                            setChantScore(score);
                          }
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const parent = e.currentTarget.parentElement;
                        const input = parent?.querySelector('input');
                        if (input && input.value.trim()) {
                          setChantTranscript(input.value);
                          const target = activeChant.transliteration || activeChant.text || "";
                          const score = calculateSimilarity(input.value, target);
                          setChantScore(score);
                        }
                      }}
                      style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      Test
                    </button>
                  </div>
                </div>

                {/* Overlays action button */}
                <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                  {chantScore !== null && chantScore >= 70 && (
                    <button 
                      onClick={() => {
                        setActiveChant(null);
                        videoRef.current?.play();
                        setPlaying(true);
                      }}
                      style={{ padding: '12px 30px', background: 'rgba(70,211,105,0.2)', border: '1px solid #46d369', color: '#46d369', borderRadius: '30px', cursor: 'pointer', fontWeight: 800 }}
                    >
                      CONTINUE VIDEO
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setActiveChant(null);
                      videoRef.current?.play();
                      setPlaying(true);
                    }}
                    style={{ padding: '12px 30px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '30px', cursor: 'pointer', fontWeight: 800 }}
                  >
                    SKIP CHANT
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🌿 Branching Narratives Options Overlay */}
        {activeBranch && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)',
            zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.4s ease',
            pointerEvents: 'auto'
          }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(15,22,36,0.95), rgba(15,22,36,0.7))', padding: '45px 40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '650px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
              <span style={{ color: '#f26422', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>Branching Interactive Narrative</span>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, margin: '20px 0 30px 0', color: '#fff', lineHeight: 1.3 }}>{activeBranch.question}</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {activeBranch.choices?.map((choice: any, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => {
                      if (isNonNativeVideo && !isAudioFormat) {
                        setLocalTime(choice.timestamp);
                        updateTime(choice.timestamp);
                        navigateIframeToTime(choice.timestamp);
                      } else if (videoRef.current) {
                        videoRef.current.currentTime = choice.timestamp;
                        updateTime(choice.timestamp);
                      }
                      setActiveBranch(null);
                      setPlaying(true);
                      videoRef.current?.play();
                    }} 
                    style={{ 
                      padding: '16px 24px', 
                      background: 'rgba(255,255,255,0.05)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      color: '#fff', 
                      fontSize: '1.05rem', 
                      borderRadius: '14px', 
                      cursor: 'pointer', 
                      transition: 'all 0.25s', 
                      fontWeight: 700,
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(242,100,34,0.1)';
                      e.currentTarget.style.borderColor = '#f26422';
                      e.currentTarget.style.boxShadow = '0 0 15px rgba(242,100,34,0.2)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span>{choice.text}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f26422' }}>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div> {/* Closes Main Video & Overlays Area */}

      {/* 2. Study Room Sidebar Panel */}
      {showStudyRoomSidebar && (
        <div style={{
          width: '350px',
          height: '100%',
          background: '#0a0f1d',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 20,
          position: 'relative'
        }}>
          {/* Header */}
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 800 }}>Co-Watching Study Room</h3>
              <span style={{ fontSize: '0.75rem', color: isHost ? '#f26422' : '#46d369' }}>
                {isHost ? '👑 Hosting Session' : '👥 Joined Session (Synced)'}
              </span>
            </div>
            <button 
              onClick={() => setShowStudyRoomSidebar(false)}
              style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.1rem' }}
            >
              ✕
            </button>
          </div>

          {/* Share Links details */}
          <div style={{ padding: '15px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#aaa', fontSize: '0.75rem', fontFamily: 'monospace' }}>Room: {studyRoomId?.slice(0, 8)}...</span>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Invite link copied to clipboard!");
                }
              }}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Copy Link
            </button>
          </div>

          {/* Chat Messages Log */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {chatMessages.length === 0 ? (
              <div style={{ color: '#666', fontSize: '0.85rem', textAlign: 'center', marginTop: '40px' }}>
                No messages yet. Chat live and study together!
              </div>
            ) : (
              <>
                {chatMessages.map((msg: any) => {
                  const isMsgSelf = msg.userId === currentUser?.id;
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignSelf: isMsgSelf ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                      <span style={{ fontSize: '0.7rem', color: '#888', marginBottom: '2px', textAlign: isMsgSelf ? 'right' : 'left' }}>
                        {msg.userName}
                      </span>
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: isMsgSelf ? '#f26422' : 'rgba(255,255,255,0.06)',
                        color: '#fff',
                        fontSize: '0.85rem',
                        lineHeight: 1.4,
                        borderTopRightRadius: isMsgSelf ? '2px' : '12px',
                        borderTopLeftRadius: isMsgSelf ? '12px' : '2px',
                        wordBreak: 'break-word'
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Chat Form Entry */}
          <div style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0a0f1d' }}>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!chatInput.trim() || !studyRoomId) return;
                const text = chatInput;
                setChatInput('');
                try {
                  await sendStudyRoomMessage(studyRoomId, text, currentUser?.id, currentUser?.name);
                  setChatMessages(prev => [...prev, {
                    id: 'temp-' + Date.now(),
                    userName: currentUser?.name || currentUser?.email?.split('@')[0] || "Me",
                    userId: currentUser?.id,
                    text: text,
                    createdAt: new Date()
                  }]);
                } catch (err) {
                  console.error("Error sending message", err);
                }
              }}
              style={{ display: 'flex', gap: '8px' }}
            >
              <input 
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Say something to room..."
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  padding: '8px 16px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}



      {/* Styled custom animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spinVinyl { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
        @keyframes spinBack { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(-360deg); } 
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 75, 75, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(255, 75, 75, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 75, 75, 0); }
        }
      `}} />
    </div>
  );
}

// Reusable control button styling
const btnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  padding: '5px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.1s ease, opacity 0.2s ease',
  opacity: 0.85
};
