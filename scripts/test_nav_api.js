const http = require('http');

http.get('http://localhost:3001/api/navigation', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("📡 API Navigation Response Status:", res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log("📦 Total Menus Fetched:", parsed.length);
      if (parsed.length > 0) {
        console.log("🏷️ Top Menu Labels:", parsed.map(m => m.label));
      } else {
        console.log("⚠️ API returned EMPTY array!");
      }
    } catch (e) {
      console.error("❌ JSON Parse Error. Response Content was:", data.slice(0, 200));
    }
  });
}).on("error", (err) => {
  console.log("❌ HTTP GET Error:", err.message);
});
