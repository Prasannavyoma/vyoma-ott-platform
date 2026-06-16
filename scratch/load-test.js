// Frontend & API Load Benchmark Test
const url = 'http://localhost:3000/';
const totalRequests = 100;
const concurrencyLimit = 10;

async function runLoadTest() {
  console.log(`⚡ Initiating Load Benchmark on ${url}...`);
  console.log(`📊 Parameters: Total Requests = ${totalRequests}, Concurrency Limit = ${concurrencyLimit}\n`);

  const start = performance.now();
  const timings = [];
  let failures = 0;
  
  // Create queue of requests
  let activeIndex = 0;
  
  async function worker() {
    while (activeIndex < totalRequests) {
      const index = activeIndex++;
      const reqStart = performance.now();
      try {
        const response = await fetch(url, { headers: { 'User-Agent': 'LoadTestWorker' } });
        await response.text(); // Fully ingest body
        const reqEnd = performance.now();
        const latency = reqEnd - reqStart;
        if (response.ok) {
          timings.push(latency);
        } else {
          failures++;
          console.warn(`⚠️ Request #${index} returned status ${response.status}`);
        }
      } catch (err) {
        failures++;
        console.error(`❌ Request #${index} failed: ${err.message}`);
      }
    }
  }

  // Spin up parallel workers
  const workers = Array.from({ length: concurrencyLimit }, () => worker());
  await Promise.all(workers);

  const end = performance.now();
  const totalDurationSeconds = (end - start) / 1000;

  // Compute metrics
  const successfulCount = timings.length;
  timings.sort((a, b) => a - b);
  
  const min = timings[0] || 0;
  const max = timings[timings.length - 1] || 0;
  const sum = timings.reduce((acc, t) => acc + t, 0);
  const avg = sum / (successfulCount || 1);
  
  const p90Idx = Math.floor(successfulCount * 0.9);
  const p90 = timings[p90Idx] || 0;
  const rps = successfulCount / totalDurationSeconds;

  console.log('📈 Load Benchmark Results:');
  console.log(`-----------------------------------------------`);
  console.log(`🏁 Total Execution Time:   ${totalDurationSeconds.toFixed(3)} seconds`);
  console.log(`🚀 Requests Completed:     ${successfulCount}`);
  console.log(`💥 Requests Failed:        ${failures}`);
  console.log(`⚡ Throughput (RPS):       ${rps.toFixed(2)} req/sec`);
  console.log(`⏱️ Min Response Time:      ${min.toFixed(2)}ms`);
  console.log(`⏱️ Avg Response Time:      ${avg.toFixed(2)}ms`);
  console.log(`⏱️ 90th Pct Latency:       ${p90.toFixed(2)}ms`);
  console.log(`⏱️ Max Response Time:      ${max.toFixed(2)}ms`);
  console.log(`-----------------------------------------------`);

  if (failures > 0) {
    console.error('❌ Benchmark complete with failures.');
    process.exit(1);
  } else {
    console.log('🏆 Benchmark completed successfully with 0% error rate.');
    process.exit(0);
  }
}

runLoadTest();
