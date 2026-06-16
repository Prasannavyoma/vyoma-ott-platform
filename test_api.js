const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AQ.Ab8RN6KSkRhNdXxnT5Qj5mDUeqnbAZ6R4GPD-u1jKE6vlcCwOw";
fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
