# Load tests (Gatling)

Gatling JS SDK, pinned to 3.16.4. The CLI downloads its own Java runtime bundle on first run.

```bash
cd loadtest
npm ci
```

## Scenario: `browse` (`src/browse.gatling.js`)

Open workload: every virtual user makes one request, so **users/sec = requests/sec (TPS)**.
Ramps up to `rate`, then holds it. Request mix:

| Weight | Request |
|---|---|
| 25% | home page `/` |
| 25% | course page `/watch/<id>` (random course from `resources/courses.csv`) |
| 15% | explore page `/explore` |
| 10% | `/api/features` |
| 10% | `/api/navigation?type=header` |
| 10% | `/api/auth/status` |
| 5% | `/api/health?deep=1` (includes a DB query) |

Assertions (the run is marked failed otherwise): failed requests < 1%, p95 < 2000 ms.

## Run

```bash
# smoke test (2 req/s for 30 s) - check the target works before a big run
npx gatling run --simulation browse baseUrl=http://<AppUrl-host> rate=2 rampSeconds=10 holdSeconds=20

# 200 TPS: 2 min ramp, 10 min hold
npx gatling run --simulation browse baseUrl=http://<AppUrl-host> rate=200 rampSeconds=120 holdSeconds=600
```

Parameters: `baseUrl`, `rate`, `rampSeconds`, `holdSeconds`, `p95Ms`, `maxFailPct`.

The HTML report path is printed at the end (`target/gatling/browse-<timestamp>/index.html`).

## While it runs

Watch the CloudWatch dashboard (`vyoma-ott-dev`): req/s should reach ~200, failure rate stay ~0%,
auto scaling should add tasks (target 50 req/s per task, so ~4 tasks at 200 TPS).

## Where to run it from

200 TPS from a laptop is fine for bandwidth, but home networks and laptops can become the
bottleneck. If the laptop's CPU is saturated or results look network-bound, run from an EC2 instance
or CloudShell in us-east-1 instead.

## Refreshing course IDs

`resources/courses.csv` holds real course IDs from the database:

```bash
docker exec vyoma-ott-postgres psql -U vyoma -d vyoma_ott -tAc 'select id from "Course" order by id' \
  | sed '/^$/d' | { echo courseId; cat; } > resources/courses.csv
```
