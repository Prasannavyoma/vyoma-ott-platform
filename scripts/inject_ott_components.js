const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'app', 'watch', '[id]', 'page.tsx');
console.log("Target File Path:", targetPath);

let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add component imports
console.log("1. Injecting Component Imports...");
const importsToInject = `
import WatchlistButton from '@/app/components/WatchlistButton';
import LikeDislikeSystem from '@/app/components/LikeDislikeSystem';
import { getWatchlistStatus, getCourseLikeStatus } from '@/app/actions/ott';
`.trim();

content = content.replace(
  "import { getCurrentUser } from '@/lib/auth';",
  `${importsToInject}\nimport { getCurrentUser } from '@/lib/auth';`
);

// 2. Fetch statuses in page component body
console.log("2. Injecting Status Fetching Data...");
const fetchers = `
  // Check custom engagement telemetry
  const isBookmarked = await getWatchlistStatus(courseId);
  const isLiked = await getCourseLikeStatus(courseId);
`.trim();

// We insert it right before the first if (!course) around line 49
content = content.replace(
  "// Graceful fallback mock in case db lookup fails/empty",
  `${fetchers}\n\n  // Graceful fallback mock in case db lookup fails/empty`
);

// 3. Replace the CourseEngagement wrapper with full control tray
console.log("3. Inserting dynamic interaction Control Tray...");
const engagementPattern = /<CourseEngagement\s+courseId=\{course\.id\}\s+initialNote=\{noteContent\}>([\s\S]*?)<\/CourseEngagement>/;
const matchedEngagement = content.match(engagementPattern);

if (matchedEngagement) {
  const newEngagement = `
                <CourseEngagement courseId={course.id} initialNote={noteContent}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                     
                     {/* DYNAMIC BOOKMARK TOGGLE */}
                     <WatchlistButton courseId={course.id} initialStatus={isBookmarked} />

                     {/* DYNAMIC SENTIMENT TRACKING */}
                     <LikeDislikeSystem courseId={course.id} initialStatus={isLiked} />

                     {/* CINEMATIC PLAYBACK TEASER */}
                     {(course as any).trailerUrl && (
                       <TrailerPlayer trailerUrl={(course as any).trailerUrl} title={course.title} />
                     )}

                     {/* COMPILING DOWNSTREAM TRIGGERS */}
                     {!isLocked && (
                       <div style={{ marginLeft: 'auto' }}>
                         <DownloadButton videoUrl={playUrl} courseTitle={displayTitle} />
                       </div>
                     )}
                  </div>
                </CourseEngagement>`.trim();

  content = content.replace(matchedEngagement[0], newEngagement);
  console.log("✅ Control tray injected Successfully.");
} else {
  console.error("❌ Target engagement container not found!");
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log("💾 Modifications persisted to page.tsx successfully!");
