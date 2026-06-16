const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'src', 'app', 'watch', '[id]', 'page.tsx');
console.log("Processing File:", pagePath);

let content = fs.readFileSync(pagePath, 'utf8');

// 1. Inject the activeIndex / nextEp calculation
console.log("1. Injecting Next Episode Lookup Logic...");
const lookupLogic = `
  // Identify the next episode in the sequence for AutoPlay Countdown
  let nextEpUrl = undefined;
  let nextEpTitle = undefined;
  if (course.episodes.length > 0 && activeEpisode) {
    const activeIdx = course.episodes.findIndex((e: any) => e.id === activeEpisode.id);
    if (activeIdx !== -1 && activeIdx < course.episodes.length - 1) {
      const nextEp = course.episodes[activeIdx + 1];
      nextEpUrl = \`/watch/\${course.id}?ep=\${nextEp.id}\`;
      nextEpTitle = nextEp.title;
    }
  }
`.trim();

const anchor = `  let activeEpisode: any = null;
  if (course.episodes.length > 0) {
    activeEpisode = currentEpId ? course.episodes.find(e => e.id === currentEpId) || course.episodes[0] : course.episodes[0];
  }`;

if (content.includes(anchor)) {
  content = content.replace(anchor, `${anchor}\n\n${lookupLogic}`);
  console.log("✅ Lookup Logic Spliced.");
} else {
  // Regex fallback
  const rx = /let\s+activeEpisode\s*:\s*any\s*=\s*null;\s*if\s*\(course\.episodes\.length\s*>\s*0\)\s*\{[\s\S]*?\}/;
  const match = content.match(rx);
  if (match) {
    content = content.replace(match[0], `${match[0]}\n\n${lookupLogic}`);
    console.log("✅ Lookup Logic Spliced (Regex Fallback).");
  } else {
    console.error("❌ Could not locate activeEpisode declaration block!");
  }
}

// 2. Inject the additional props into AdaptivePlayer component
console.log("2. Injecting nextEpisodeUrl/nextEpisodeTitle props to AdaptivePlayer call...");
const playerAnchor = `<AdaptivePlayer 
                  url={playUrl} 
                  poster={activeEpisode?.thumbnailUrl || course.thumbnailUrl || undefined} 
                  episodeId={activeEpisode?.id}
                />`;

const replacementPlayer = `<AdaptivePlayer 
                  url={playUrl} 
                  poster={activeEpisode?.thumbnailUrl || course.thumbnailUrl || undefined} 
                  episodeId={activeEpisode?.id}
                  nextEpisodeUrl={nextEpUrl}
                  nextEpisodeTitle={nextEpTitle}
                />`;

if (content.includes(playerAnchor)) {
  content = content.replace(playerAnchor, replacementPlayer);
  console.log("✅ Player props updated.");
} else {
  // Precise spacing regex fallback
  const rxPlayer = /<AdaptivePlayer\s+url=\{playUrl\}[\s\S]+?episodeId=\{activeEpisode\?\.id\}[\s\S]+?\/>/;
  const matchPlayer = content.match(rxPlayer);
  if (matchPlayer) {
    const updatedProps = matchPlayer[0].replace('/>', '  nextEpisodeUrl={nextEpUrl}\n                  nextEpisodeTitle={nextEpTitle}\n                />');
    content = content.replace(matchPlayer[0], updatedProps);
    console.log("✅ Player props updated (Regex Fallback).");
  } else {
    console.error("❌ Could not locate AdaptivePlayer JSX block!");
  }
}

fs.writeFileSync(pagePath, content, 'utf8');
console.log("💾 PERSISTENCE COMPLETED.");
