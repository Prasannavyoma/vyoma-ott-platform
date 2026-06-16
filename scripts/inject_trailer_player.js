const fs = require('fs');
const path = require('path');

const targetFilePath = path.join(__dirname, '..', 'src', 'app', 'watch', '[id]', 'page.tsx');
console.log("Reading target file:", targetFilePath);

let content = fs.readFileSync(targetFilePath, 'utf8');

// --- REPLACEMENT 1: LOCKED GATEWAY ---
console.log("Executing Replacement 1 (Locked Gateway)...");
const target1 = `                        <Link href={\`/checkout/\${courseId}\`} style={{ 
                          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                          color: '#fff', textDecoration: 'none', padding: '14px 30px', 
                          borderRadius: '30px', fontWeight: 900, fontSize: '0.9rem', 
                          letterSpacing: '1px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                          transition: 'transform 0.2s'
                        }}>
                          🏷️ BUY SEPARATELY (₹{course.price || 299})
                        </Link>
                     </div>`;

const replace1 = `                        <Link href={\`/checkout/\${courseId}\`} style={{ 
                          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                          color: '#fff', textDecoration: 'none', padding: '14px 30px', 
                          borderRadius: '30px', fontWeight: 900, fontSize: '0.9rem', 
                          letterSpacing: '1px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                          transition: 'transform 0.2s'
                        }}>
                          🏷️ BUY SEPARATELY (₹{course.price || 299})
                        </Link>
                        
                        {(course as any).trailerUrl && (
                          <TrailerPlayer trailerUrl={(course as any).trailerUrl} title={course.title} />
                        )}
                     </div>`;

if (content.includes(target1.trim())) {
  console.log("Found target 1!");
  // Normalize trim comparison in case of extra newlines
  const exactMatch = content.match(new RegExp(escapeRegExp(target1.trim()).replace(/\\s+/g, '\\s+')));
  if (exactMatch) {
     content = content.replace(exactMatch[0], replace1);
     console.log("✅ Replacement 1 SUCCEEDED.");
  }
} else {
  console.log("Target 1 NOT found exactly. Attempting fallback search for Target 1...");
  // Dynamic regex fallback for target 1
  const rx1 = /<Link\s+href=\{\`\/checkout\/\$\{courseId\}\`\}[\s\S]+?BUY\s+SEPARATELY[\s\S]+?<\/Link>\s*<\/div>/;
  const m1 = content.match(rx1);
  if (m1) {
     const originalDiv = m1[0];
     const replacedDiv = originalDiv.replace('</Link>', `</Link>\n                        {(course as any).trailerUrl && (\n                          <TrailerPlayer trailerUrl={(course as any).trailerUrl} title={course.title} />\n                        )}`);
     content = content.replace(originalDiv, replacedDiv);
     console.log("✅ Replacement 1 (Fallback Mode) SUCCEEDED.");
  } else {
     console.error("❌ ALL replacement 1 methods failed.");
  }
}


// --- REPLACEMENT 2: ENGAGEMENT ROW ---
console.log("Executing Replacement 2 (Engagement Row)...");
const rx2 = /<CourseEngagement\s+courseId=\{course\.id\}\s+initialNote=\{noteContent\}>([\s\S]*?)<\/CourseEngagement>/;
const m2 = content.match(rx2);
if (m2) {
   const originalEngagement = m2[0];
   const replacedEngagement = `
                <CourseEngagement courseId={course.id} initialNote={noteContent}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     {(course as any).trailerUrl && (
                       <TrailerPlayer trailerUrl={(course as any).trailerUrl} title={course.title} />
                     )}
                     {!isLocked && (
                       <DownloadButton videoUrl={playUrl} courseTitle={displayTitle} />
                     )}
                  </div>
                </CourseEngagement>`.trim();
   
   content = content.replace(originalEngagement, replacedEngagement);
   console.log("✅ Replacement 2 SUCCEEDED.");
} else {
   console.error("❌ Replacement 2 FAILED.");
}

fs.writeFileSync(targetFilePath, content, 'utf8');
console.log("💾 Finished writing modifications to page.tsx!");

// Helper for literal string regex escape
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
