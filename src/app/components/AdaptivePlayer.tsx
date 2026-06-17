"use client";

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useRouter } from 'next/navigation';
import ReactPlayer from 'react-player';

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

interface AdaptivePlayerProps {
  url: string;
  poster?: string;
  episodeId?: string;
  nextEpisodeUrl?: string;
  nextEpisodeTitle?: string;
  initialPosition?: number; // 🕒 Saved position in seconds to resume from
  onEnded?: () => void;
  subtitleUrl?: string; // .vtt or .srt subtitle file URL
}

function getAutoSubtitle(episodeId: string, time: number) {
  const subtitles = [
    {
      sanskrit: "ॐ सह नाववतु । सह नौ भुनक्तु ।",
      english: "Om, May we be protected together; may we be nourished together."
    },
    {
      sanskrit: "सह वीर्यं करवावहै ।",
      english: "May we work together with great energy and courage."
    },
    {
      sanskrit: "तेजस्वि नावधीतमस्तु मा विद्विषावहै ॥",
      english: "May our study be enlightening and not give rise to hostility."
    },
    {
      sanskrit: "ॐ शान्तिः शान्तिः शान्तिः ॥",
      english: "Om Peace, Peace, Peace."
    },
    {
      sanskrit: "विद्या ददाति विनयं विनयाद्याति पात्रताम् ।",
      english: "Knowledge gives humility, from humility comes capability."
    },
    {
      sanskrit: "पात्रत्वाद्धनमाप्नोति धनाद्धर्मं ततः सुखम् ॥",
      english: "From capability one gets wealth, from wealth righteousness, and from that comes happiness."
    },
    {
      sanskrit: "उद्यमेन हि सिध्यन्ति कार्याणि न मनोरथैः ।",
      english: "Tasks are accomplished by effort, not by mere wishing."
    },
    {
      sanskrit: "न हि सुप्तस्य सिंहस्य प्रविशन्ति मुखे मृगाः ॥",
      english: "Deer do not walk into the mouth of a sleeping lion."
    }
  ];

  const index = Math.floor(time / 8) % subtitles.length;
  const current = subtitles[index];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ color: '#ff8c53', fontSize: '1.2rem', fontWeight: 900 }}>{current.sanskrit}</div>
      <div style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 500, opacity: 0.9 }}>{current.english}</div>
    </div>
  );
}

export default function AdaptivePlayer({ 
  url, 
  poster, 
  episodeId, 
  nextEpisodeUrl, 
  nextEpisodeTitle, 
  initialPosition,
  onEnded,
  subtitleUrl
}: AdaptivePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastUpdateRef = useRef<number>(0);
  const router = useRouter();

  const reactPlayerRef = useRef<any>(null);
  const ReactPlayerComponent = ReactPlayer as any;

  // Multi-Format Content Detection
  const lowerUrl = url.toLowerCase();
  const isHtml = lowerUrl.endsWith('.html') || lowerUrl.endsWith('.htm') || lowerUrl.includes('index.html');
  const isPdf = lowerUrl.endsWith('.pdf');
  const isAudio = lowerUrl.endsWith('.mp3') || lowerUrl.endsWith('.wav') || lowerUrl.endsWith('.ogg');
  const isYouTube = lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be');
  const isVimeo = lowerUrl.includes('vimeo.com');
  const isEmbedVideo = isYouTube || isVimeo;
  
  const isThirdParty = isYouTube || isVimeo || lowerUrl.includes('soundcloud.com') || lowerUrl.includes('twitch.tv') || lowerUrl.includes('dailymotion.com') || lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch') || lowerUrl.includes('wistia.com') || lowerUrl.includes('mixcloud.com');
  
  const isNonVideoFormat = isHtml || isPdf || isAudio || isThirdParty;

  // Custom Control State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [audioMode, setAudioMode] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(!!subtitleUrl);
  
  // HLS Adaptive Stream Quality State
  const hlsRef = useRef<Hls | null>(null);
  const [qualityLevels, setQualityLevels] = useState<{ index: number; height: number; bitrate: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = Auto
  const [activeResolution, setActiveResolution] = useState<string>('');
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // 🧭 Smart Chapter Markers (Netflix/Prime Video style)
  const defaultChapters = [
    { time: 0, title: "🧘 Mangalacharanam (Invocation)" },
    { time: 15, title: "📖 Shloka Recitation" },
    { time: 60, title: "💡 Word-by-Word Meaning" },
    { time: 180, title: "🧠 Deep Philosophical Commentary" }
  ];

  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);
  const [hoverChapter, setHoverChapter] = useState<string | null>(null);
  const [showSkipIntro, setShowSkipIntro] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Autoplay Countdown State
  const [showCountdown, setShowCountdown] = useState(false);
  const [count, setCount] = useState(6);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 🕒 Resumed Playback Position states
  const [hasSetInitialPosition, setHasSetInitialPosition] = useState(false);
  const [showResumeNotice, setShowResumeNotice] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setHasSetInitialPosition(false);
    setShowResumeNotice(false);
    setHasError(false);
    setErrorMessage('');
  }, [episodeId]);

  // 1. Video Element Source Initialization
  useEffect(() => {
    setShowCountdown(false);
    setCount(6);
    if (timerRef.current) clearInterval(timerRef.current);

    let finalUrl = url;
    if (url.startsWith('https://d3a8qbwm8iliew.cloudfront.net/')) {
      finalUrl = url.replace('https://d3a8qbwm8iliew.cloudfront.net/', '/video-proxy/');
    }

    if (isHtml || isPdf || isEmbedVideo) {
      // Interactive content auto-progresses after 15 seconds
      const timer = setTimeout(() => {
        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            episodeId: episodeId,
            position: 999999, // complete
            completed: true
          }),
          keepalive: true
        }).catch(() => {});
      }, 15000);
      return () => clearTimeout(timer);
    }

    const video = videoRef.current;
    if (!video) return;

    // Reset playback state
    setIsPlaying(false);
    setCurrentTime(0);
    setPlaybackRate(1);
    video.playbackRate = 1;

    const isHls = lowerUrl.includes('m3u8') || lowerUrl.includes('mpegurl') || lowerUrl.includes('index.m3u8');

    if (!isAudio && isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({ 
          capLevelToPlayerSize: true,
          autoStartLoad: true
        });
        hlsRef.current = hls;
        
        hls.loadSource(finalUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const levels = hls.levels.map((level, idx) => ({
            index: idx,
            height: level.height,
            bitrate: level.bitrate
          }));
          setQualityLevels(levels);
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          const activeLevel = hls.levels[data.level];
          if (activeLevel) {
            setActiveResolution(`${activeLevel.height}p`);
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('Fatal HLS network error, trying to recover...', data);
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('Fatal HLS media error, trying to recover...', data);
                hls.recoverMediaError();
                break;
              default:
                console.error('Fatal HLS error, destroying instance.', data);
                hls.destroy();
                hlsRef.current = null;
                setHasError(true);
                setErrorMessage(`Failed to decode video stream: ${data.details || 'Unknown Error'}`);
                break;
            }
          }
        });

        return () => {
          hls.destroy();
          hlsRef.current = null;
          setQualityLevels([]);
          setActiveResolution('');
          setCurrentQuality(-1);
        };
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = finalUrl;
        video.load();
        video.play().catch(() => {});
      }
    } else {
      video.src = finalUrl;
      video.load();
      video.play().catch(() => {});
    }
  }, [url, isHtml, isPdf, isAudio, episodeId]);

  // 2. Autoplay Timer Lifecycle
  useEffect(() => {
    if (showCountdown && nextEpisodeUrl) {
      timerRef.current = setInterval(() => {
        setCount((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            router.push(nextEpisodeUrl);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showCountdown, nextEpisodeUrl, router]);

  // 3. Auto-Hide Custom Controls Logic
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying && !showSpeedMenu && !showQualityMenu) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, showSpeedMenu, showQualityMenu]);

  // 4. Fullscreen Status Event Binding
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 5. Time Telemetry Tracker
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !episodeId) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setShowSkipIntro(video.currentTime >= 2 && video.currentTime <= 15);
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('video-time-update', { detail: { time: video.currentTime } }));
      }
      
      const now = Date.now();
      if (now - lastUpdateRef.current > 10000) {
        lastUpdateRef.current = now;
        
        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            episodeId: episodeId,
            position: Math.floor(video.currentTime),
            completed: video.ended || (video.duration > 0 && video.currentTime / video.duration > 0.92)
          })
        }).catch(() => {});

        fetch('/api/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seconds: 10 })
        }).catch(() => {});
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [episodeId]);

  // 5a. Custom Video Seek Request Listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleSeekRequest = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (videoRef.current && typeof customEvent.detail?.time === 'number') {
        videoRef.current.currentTime = customEvent.detail.time;
        setCurrentTime(customEvent.detail.time);
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    };
    window.addEventListener('video-seek-request', handleSeekRequest);
    return () => window.removeEventListener('video-seek-request', handleSeekRequest);
  }, []);

  // 6. Native Key Bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focused in a text input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          skip(-10);
          break;
        case 'ArrowRight':
          skip(10);
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'KeyF':
          toggleFullScreen();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted]);

  const saveProgressNow = (keepalive = false) => {
    const video = videoRef.current;
    if (!video || !episodeId || video.currentTime < 1) return;

    const data = JSON.stringify({
      episodeId: episodeId,
      position: Math.floor(video.currentTime),
      completed: video.ended || (video.duration > 0 && video.currentTime / video.duration > 0.92)
    });

    // Ensure deterministic JSON payload extraction in NextJS
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data,
      keepalive: keepalive
    }).catch(() => {});
  };

  const handlePause = () => {
    setIsPlaying(false);
    saveProgressNow();
  };

  // Immediate Save on page reload, exit, tab close, or browser minimization
  useEffect(() => {
    const handleExit = () => {
      saveProgressNow(true);
    };

    window.addEventListener('pagehide', handleExit);
    window.addEventListener('beforeunload', handleExit);
    return () => {
      window.removeEventListener('pagehide', handleExit);
      window.removeEventListener('beforeunload', handleExit);
    };
  }, [episodeId]);

  // Save progress on episode component unmount
  useEffect(() => {
    return () => {
      saveProgressNow();
    };
  }, [episodeId]);

  // --- CORE FUNCTIONAL TRIGGERS ---
  const togglePlay = () => {
    if (isThirdParty && reactPlayerRef.current) {
      setIsPlaying(!isPlaying);
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
    resetControlsTimeout();
  };

  const skip = (seconds: number) => {
    const nextTime = Math.max(0, Math.min(currentTime + seconds, duration || 100));
    if (isThirdParty && reactPlayerRef.current) {
      reactPlayerRef.current.seekTo(nextTime, 'seconds');
      setCurrentTime(nextTime);
    } else if (videoRef.current) {
      videoRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
    resetControlsTimeout();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (isThirdParty && reactPlayerRef.current) {
      reactPlayerRef.current.seekTo(newTime, 'seconds');
    } else if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const handleMouseMoveProgress = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const time = pct * duration;
    setHoverTime(time);
    setHoverX(x);

    // Find active chapter based on hover time
    const activeCh = defaultChapters.find((ch, idx) => {
      const nextTime = defaultChapters[idx + 1]?.time || duration;
      return time >= ch.time && time < nextTime;
    });
    setHoverChapter(activeCh ? activeCh.title : null);
  };

  const handleMouseLeaveProgress = () => {
    setHoverTime(null);
    setHoverChapter(null);
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    if (isThirdParty && reactPlayerRef.current) {
      setIsMuted(nextMute);
    } else if (videoRef.current) {
      videoRef.current.muted = nextMute;
      setIsMuted(nextMute);
    }
    resetControlsTimeout();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVolume = parseFloat(e.target.value);
    setVolume(nextVolume);
    if (nextVolume > 0 && isMuted) {
      setIsMuted(false);
      if (videoRef.current) videoRef.current.muted = false;
    } else if (nextVolume === 0 && !isMuted) {
      setIsMuted(true);
      if (videoRef.current) videoRef.current.muted = true;
    }
    if (videoRef.current && !isThirdParty) {
      videoRef.current.volume = nextVolume;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current && !isThirdParty) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
    resetControlsTimeout();
  };

  const handleQualityChange = (index: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index;
      setCurrentQuality(index);
    }
    setShowQualityMenu(false);
    resetControlsTimeout();
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
    resetControlsTimeout();
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
      if (initialPosition && !hasSetInitialPosition) {
        const seekTime = Math.min(initialPosition, video.duration - 2);
        video.currentTime = Math.max(0, seekTime);
        setCurrentTime(video.currentTime);
        setHasSetInitialPosition(true);
        
        setShowResumeNotice(true);
        setTimeout(() => setShowResumeNotice(false), 4000);
      }
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const h = Math.floor(timeInSeconds / 3600);
    const m = Math.floor((timeInSeconds % 3600) / 60);
    const s = Math.floor(timeInSeconds % 60);
    const formattedM = m.toString().padStart(2, '0');
    const formattedS = s.toString().padStart(2, '0');
    return h > 0 ? `${h}:${formattedM}:${formattedS}` : `${m}:${formattedS}`;
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    onEnded?.();
    window.dispatchEvent(new Event('video-finished'));

    if (episodeId) {
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId, position: 999999, completed: true })
      }).catch(() => {});
    }

    if (nextEpisodeUrl) {
      setShowCountdown(true);
      setCount(6);
    }
  };

  const cancelAutoplay = () => {
    setShowCountdown(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const triggerNextNow = () => {
    if (nextEpisodeUrl) {
      router.push(nextEpisodeUrl);
    }
  };

  // --- UI VARIABLES ---
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      style={{ 
        position: 'relative', 
        width: '100%', 
        paddingTop: isFullScreen ? '0' : '56.25%', 
        height: isFullScreen ? '100vh' : '0',
        background: '#000', 
        borderRadius: isFullScreen ? '0' : '12px', 
        overflow: 'hidden', 
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        cursor: showControls ? 'default' : 'none'
      }}
    >
      {/* ⚠️ Error Overlay */}
      {hasError && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 16, 26, 0.96)',
          backdropFilter: 'blur(15px)',
          zIndex: 110,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '20px'
        }}>
          <span style={{ fontSize: '3rem', marginBottom: '15px' }}>⚠️</span>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ff4444', marginBottom: '10px' }}>
            Playback Error
          </h3>
          <p style={{ maxWidth: '400px', color: '#ccc', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '20px' }}>
            {errorMessage || "An error occurred while attempting to load the video stream."}
          </p>
          <button 
            onClick={() => {
              setHasError(false);
              setErrorMessage('');
              // Re-trigger load
              const video = videoRef.current;
              if (video) {
                const currentSrc = video.src;
                video.src = '';
                video.src = currentSrc;
                video.load();
              }
            }}
            style={{
              background: '#f26422',
              color: '#fff',
              border: 'none',
              padding: '10px 25px',
              borderRadius: '20px',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: '0 5px 15px rgba(242,100,34,0.3)'
            }}
          >
            🔄 RETRY LOADING
          </button>
        </div>
      )}
      {/* CORE MEDIA CONTAINER */}
      {isThirdParty ? (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
          {/* @ts-ignore */}
          <ReactPlayerComponent
            ref={reactPlayerRef}
            url={url}
            width="100%"
            height="100%"
            playing={isPlaying}
            volume={volume}
            muted={isMuted}
            playbackRate={playbackRate}
            onProgress={(state: any) => {
              setCurrentTime(state.playedSeconds);
            }}
            onDuration={(dur: any) => setDuration(dur)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={handleVideoEnd}
            onError={(e: any) => {
              console.error("ReactPlayer error", e);
              setHasError(true);
              setErrorMessage("Failed to load stream. Ensure the link is valid and public.");
            }}
            config={{
              youtube: { playerVars: { showinfo: 0, controls: 0, rel: 0 } },
              vimeo: { playerOptions: { controls: false, title: false, byline: false } }
            } as any}
          />
        </div>
      ) : isHtml || isPdf ? (
        <iframe
          src={url}
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            border: 'none',
            background: isPdf ? '#fff' : '#000',
            zIndex: 1 // Keep below custom overlays if any
          }}
          title="Interactive Content Viewer"
          allowFullScreen
        />
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={handlePause}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleVideoEnd}
            poster={poster}
            onClick={togglePlay}
            onError={(e) => {
              console.error("HTML5 video error", e);
              setHasError(true);
              setErrorMessage("Failed to load video stream. This could be due to a network connection issue or format incompatibility.");
            }}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'contain',
              visibility: audioMode ? 'hidden' : 'visible'
            }}
          >
            {/* Native VTT subtitle track — accurate, auto-enabled when admin uploads subtitle */}
            {subtitleUrl && (
              <track
                key={subtitleUrl}
                kind="subtitles"
                src={subtitleUrl}
                srcLang="sa"
                label="Sanskrit / English"
                default={subtitlesEnabled}
              />
            )}
          </video>

          {/* Subtitle Overlay — only shown when CC enabled AND no native track (no subtitleUrl uploaded) */}
          {subtitlesEnabled && !audioMode && !subtitleUrl && (
            <div style={{
              position: 'absolute',
              bottom: showControls ? '80px' : '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '85%',
              maxWidth: '700px',
              zIndex: 8,
              textAlign: 'center',
              pointerEvents: 'none',
              transition: 'all 0.3s ease-out'
            }}>
              <span style={{
                background: 'rgba(3, 11, 23, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,140,83,0.3)',
                padding: '10px 20px',
                borderRadius: '14px',
                display: 'inline-block',
                lineHeight: '1.4',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
              }}>
                <div style={{ fontSize: '0.6rem', color: '#f26422', fontWeight: 900, letterSpacing: '1px', marginBottom: '4px', textTransform: 'uppercase' }}>No subtitle file uploaded — showing sample</div>
                {getAutoSubtitle(episodeId || '', currentTime)}
              </span>
            </div>
          )}

          {audioMode && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: `linear-gradient(rgba(3, 11, 23, 0.9), rgba(3, 11, 23, 0.95)), url('${poster || 'https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Balakanda.jpg'}') center/cover no-repeat`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5
            }}>
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes pulseWave {
                  0%, 100% { height: 10px; }
                  50% { height: 60px; }
                }
                @keyframes rotateChakra {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}} />
              
              <div style={{
                position: 'relative',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                border: '3px solid rgba(242, 100, 34, 0.3)',
                padding: '8px',
                background: 'rgba(255,255,255,0.03)',
                boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
                marginBottom: '20px',
                animation: isPlaying ? 'rotateChakra 20s linear infinite' : 'none'
              }}>
                <img 
                  src={poster || 'https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Balakanda.jpg'} 
                  alt="" 
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                />
                <div style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '24px', height: '24px',
                  borderRadius: '50%',
                  background: '#030b17',
                  border: '2px solid #f26422',
                  boxShadow: '0 0 10px #f26422'
                }} />
              </div>

              <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 800, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                Sanskrit Recitation Active
              </h4>
              <p style={{ margin: '0 0 25px 0', fontSize: '0.8rem', color: '#f26422', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                🎧 Audio-Only Mode Enabled
              </p>

              <div style={{ display: 'flex', gap: '5px', alignItems: 'center', height: '70px', padding: '10px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                {Array.from({ length: 19 }).map((_, i) => {
                  const factor = 1 + (i % 5) * 0.2;
                  const delay = 0.06 * i;
                  return (
                    <div key={i} style={{ 
                      width: '3.5px', 
                      background: 'linear-gradient(to top, #f26422 0%, #ffd700 100%)', 
                      borderRadius: '2.5px', 
                      height: '10px',
                      animation: isPlaying ? `pulseWave ${0.8 * factor}s ease-in-out infinite` : 'none',
                      animationDelay: isPlaying ? `${delay}s` : '0s'
                    }} />
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* 🕒 Premium Floating Playback Resume Toast Notice */}
      {showResumeNotice && (
        <div style={{
          position: 'absolute',
          top: '25px',
          left: '25px',
          background: 'rgba(10, 16, 26, 0.94)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '12px 20px',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: 800,
          color: '#39ff14', // Neon Green play/resume glow
          boxShadow: '0 8px 30px rgba(0,0,0,0.8), inset 0 0 10px rgba(57,255,20,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 100,
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '1rem', textShadow: '0 0 10px #39ff14' }}>▶</span> 
          <span>Resumed from <strong>{formatTime(initialPosition || 0)}</strong></span>
        </div>
      )}

      {/* ⏭️ Netflix-Style Floating Skip Chanting/Invocation Button */}
      {showSkipIntro && (
        <button 
          onClick={() => {
            if (videoRef.current) {
              videoRef.current.currentTime = 15;
              setCurrentTime(15);
              setShowSkipIntro(false);
            }
          }}
          style={{
            position: 'absolute',
            bottom: '100px',
            right: '30px',
            background: 'rgba(10, 16, 26, 0.9)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '12px 24px',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8), inset 0 0 10px rgba(255,255,255,0.05)',
            transition: 'all 0.2s',
            zIndex: 100
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = '#000';
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(255,255,255,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(10, 16, 26, 0.9)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.8)';
          }}
        >
          <span>⏭️</span> Skip Invocation
        </button>
      )}

      {/* CUSTOM THEATER SHIELD (CONTROL OVERLAYS) */}
      {!(isHtml || isPdf) && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: showControls ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.2) 85%, rgba(0,0,0,0.6) 100%)' : 'transparent',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pointerEvents: showControls ? 'auto' : 'none',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s ease',
          zIndex: 10
        }}>
        
        {/* Top Info Tray */}
        <div style={{ padding: '25px 35px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {isFullScreen && (
            <div style={{ color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Now Streaming</h3>
            </div>
          )}
        </div>

        {/* Middle Play Trigger (Visual Feedback) */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          style={{ 
            display: 'flex', 
            flex: 1, 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer',
            pointerEvents: 'auto'
          }}
        >
          {!isPlaying && (
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

        {/* Bottom Complex Console */}
        <div className="player-console-bottom" style={{ padding: '0 25px 25px 25px' }}>
          
          {/* Glowing Slider Track */}
          <div 
            onMouseMove={handleMouseMoveProgress}
            onMouseLeave={handleMouseLeaveProgress}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '15px', width: '100%' }}
          >
            {/* Ticks for Chapters */}
            {duration > 0 && defaultChapters.map((ch, idx) => {
              const leftPct = (ch.time / duration) * 100;
              if (leftPct > 100) return null;
              return (
                <div 
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${leftPct}%`,
                    width: '4px',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.4)',
                    borderRight: '1px solid rgba(0,0,0,0.6)',
                    borderRadius: '1px',
                    pointerEvents: 'none',
                    zIndex: 5
                  }}
                />
              );
            })}

            {/* Floating Chapter Tooltip */}
            {hoverTime !== null && (
              <div style={{
                position: 'absolute',
                bottom: '22px',
                left: `${hoverX}px`,
                transform: 'translateX(-50%)',
                background: 'rgba(10, 16, 26, 0.94)',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#fff',
                whiteSpace: 'nowrap',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                pointerEvents: 'none',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                animation: 'fadeInUp 0.15s ease-out'
              }}>
                {hoverChapter && (
                  <span style={{ color: 'var(--primary, #f26422)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {hoverChapter}
                  </span>
                )}
                <span style={{ fontFamily: 'monospace' }}>{formatTime(hoverTime)}</span>
              </div>
            )}

            <input 
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '4px',
                background: `linear-gradient(to right, var(--primary, #f26422) 0%, var(--primary, #f26422) ${progressPct}%, rgba(255,255,255,0.2) ${progressPct}%, rgba(255,255,255,0.2) 100%)`,
                appearance: 'none',
                cursor: 'pointer',
                margin: 0,
                outline: 'none'
              }}
            />
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
              }
              input[type=range]:hover::-webkit-slider-thumb {
                transform: scale(1.3);
              }
            `}</style>
          </div>

          {/* Control Trays */}
          <div className="player-controls-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            {/* LEFT: Main Actions */}
            <div className="player-controls-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              
              {/* Play/Pause */}
              <button onClick={togglePlay} style={btnStyle}>
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

              {/* Volume Mixer */}
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

              {/* Time Readout */}
              <div className="time-readout" style={{ color: '#fff', fontSize: '0.85rem', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                {formatTime(currentTime)} <span style={{ color: 'rgba(255,255,255,0.4)' }}>/</span> {formatTime(duration)}
              </div>

            </div>

            {/* RIGHT: Dynamic Speed Controls + Screen */}
            <div className="player-controls-right" style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }}>
              
              {/* Audio/Video mode switcher */}
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
                title={audioMode ? "Switch to Video Mode" : "Switch to Audio-Only Mode"}
              >
                {audioMode ? "📻 Audio" : "📺 Video"}
              </button>

              {/* CC Subtitles Switch Toggle */}
              <button 
                onClick={() => {
                  const next = !subtitlesEnabled;
                  setSubtitlesEnabled(next);
                  // Also sync native track if present
                  if (videoRef.current) {
                    const tracks = videoRef.current.textTracks;
                    for (let i = 0; i < tracks.length; i++) {
                      tracks[i].mode = next ? 'showing' : 'hidden';
                    }
                  }
                }}
                style={{
                  background: !subtitleUrl
                    ? 'rgba(255,255,255,0.05)'
                    : subtitlesEnabled
                      ? 'rgba(70,211,105,0.2)'
                      : 'rgba(255,255,255,0.1)',
                  border: !subtitleUrl
                    ? '1px solid rgba(255,255,255,0.1)'
                    : subtitlesEnabled
                      ? '1px solid rgba(70,211,105,0.4)'
                      : '1px solid rgba(255,255,255,0.2)',
                  color: !subtitleUrl
                    ? '#555'
                    : subtitlesEnabled ? '#46d369' : '#fff',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backdropFilter: 'blur(5px)',
                  position: 'relative'
                }}
                title={!subtitleUrl
                  ? 'No subtitle file uploaded — Go to Admin → Episode Editor to upload a .vtt file'
                  : subtitlesEnabled ? 'Click to disable subtitles' : 'Click to enable subtitles'}
              >
                💬 {!subtitleUrl ? 'CC —' : subtitlesEnabled ? 'CC ON' : 'CC OFF'}
              </button>

              {/* Advanced Speed Selector */}
              <div style={{ position: 'relative' }}>
                 <button 
                   onClick={() => setShowSpeedMenu(!showSpeedMenu)} 
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
                     gap: '4px',
                     backdropFilter: 'blur(5px)'
                   }}
                 >
                   ⚡ {playbackRate === 1 ? 'Normal' : `${playbackRate}x`}
                 </button>

                 {showSpeedMenu && (
                    <div style={{
                      position: 'absolute',
                      bottom: '120%',
                      right: 0,
                      background: 'rgba(15,22,36,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '8px 0',
                      width: '120px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      zIndex: 50,
                      display: 'flex',
                      flexDirection: 'column',
                      backdropFilter: 'blur(10px)'
                    }}>
                      {[0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSpeedChange(s)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: playbackRate === s ? 'var(--primary, #f26422)' : '#fff',
                            padding: '8px 16px',
                            textAlign: 'left',
                            fontWeight: playbackRate === s ? 900 : 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: '0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {s === 1 ? '1.0x (Normal)' : `${s}.0x`}
                        </button>
                      ))}
                    </div>
                  )}
               </div>

               {/* Quality Level Selector */}
               {qualityLevels.length > 0 && (
                 <div style={{ position: 'relative' }}>
                    <button 
                      onClick={() => {
                        setShowQualityMenu(!showQualityMenu);
                        setShowSpeedMenu(false);
                      }} 
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
                    >
                      ⚙️ {currentQuality === -1 ? `Auto (${activeResolution || 'Detecting...'})` : `${activeResolution || 'Loading...'}`}
                    </button>

                    {showQualityMenu && (
                      <div style={{
                        position: 'absolute',
                        bottom: '120%',
                        right: 0,
                        background: 'rgba(15,22,36,0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '8px 0',
                        width: '150px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        zIndex: 50,
                        display: 'flex',
                        flexDirection: 'column',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <button
                          onClick={() => handleQualityChange(-1)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: currentQuality === -1 ? 'var(--primary, #f26422)' : '#fff',
                            padding: '8px 16px',
                            textAlign: 'left',
                            fontWeight: currentQuality === -1 ? 900 : 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: '0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          Auto (Adaptive)
                        </button>
                        {qualityLevels
                          .slice()
                          .sort((a, b) => b.height - a.height)
                          .map((q) => (
                            <button
                              key={q.index}
                              onClick={() => handleQualityChange(q.index)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: currentQuality === q.index ? 'var(--primary, #f26422)' : '#fff',
                                padding: '8px 16px',
                                textAlign: 'left',
                                fontWeight: currentQuality === q.index ? 900 : 600,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: '0.2s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              {q.height}p {q.bitrate ? `(${Math.round(q.bitrate / 100000) / 10} Mbps)` : ''}
                            </button>
                          ))}
                      </div>
                    )}
                 </div>
               )}

              {/* Fullscreen Trigger */}
              <button onClick={toggleFullScreen} style={btnStyle} title="Full Screen">
                {isFullScreen ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                )}
              </button>

            </div>

          </div>
        </div>
      </div>
      )}

      {/* PREMIUM AUTO-PLAY COUNTDOWN OVERLAY */}
      {showCountdown && nextEpisodeUrl && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(15px)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.4s ease'
        }}>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes spinBack { 0% { transform: rotate(0deg); } 100% { transform: rotate(-360deg); } }
          `}</style>

          <h4 style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>
             Up Next
          </h4>
          <h2 style={{ color: '#fff', fontSize: '2.2rem', fontWeight: 900, marginBottom: '30px', textAlign: 'center', maxWidth: '80%' }}>
             {nextEpisodeTitle || "Next Episode"}
          </h2>

          <div style={{
            width: '120px', height: '120px',
            borderRadius: '50%',
            border: '4px solid rgba(242, 100, 34, 0.2)',
            borderTopColor: '#f26422',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'spin 1.5s linear infinite',
            marginBottom: '35px',
            position: 'relative'
          }}>
              <div style={{
                position: 'absolute',
                transform: 'rotate(0deg)',
                color: '#fff', fontSize: '2.5rem', fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', height: '100%'
              }}>
                 <span style={{ animation: 'spinBack 1.5s linear infinite' }}>{count > 0 ? count : '✓'}</span>
              </div>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
             <button 
               onClick={triggerNextNow}
               style={{
                 background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)',
                 color: '#fff', border: 'none', padding: '12px 35px', borderRadius: '30px',
                 fontWeight: 900, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 30px rgba(242,100,34,0.3)'
               }}
             >
               ▶ PLAY NOW
             </button>
             <button 
               onClick={cancelAutoplay}
               style={{
                 background: 'rgba(255,255,255,0.1)',
                 color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 30px', borderRadius: '30px',
                 fontWeight: 800, fontSize: '1rem', cursor: 'pointer', backdropFilter: 'blur(5px)'
               }}
             >
               ✕ CANCEL
             </button>
          </div>
        </div>
      )}
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
