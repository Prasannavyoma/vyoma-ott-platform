// Vyoma OTT load test: a mix of page views and API calls at a target request rate.
//
// Open workload model: each virtual user makes ONE request, so users/sec = requests/sec (TPS).
// Ramps from 1 to `rate` req/s over `rampSeconds`, then holds `rate` req/s for `holdSeconds`.
//
//   npx gatling run --simulation browse baseUrl=http://<alb-dns> rate=200 rampSeconds=120 holdSeconds=600
//
// Parameters (key=value on the command line):
//   baseUrl      target site                      (default http://localhost:3000)
//   rate         requests per second to hold      (default 200)
//   rampSeconds  ramp-up duration                 (default 120)
//   holdSeconds  duration at full rate            (default 600)
//   p95Ms        p95 response time assertion, ms  (default 2000)
//   maxFailPct   max failed requests, percent     (default 1)
import {
  simulation, scenario, randomSwitch, percent, csv, rampUsersPerSec, constantUsersPerSec,
  global, getParameter
} from "@gatling.io/core";
import { http, status } from "@gatling.io/http";

export default simulation((setUp) => {
  const baseUrl = getParameter("baseUrl", "http://localhost:3000");
  const rate = parseFloat(getParameter("rate", "200"));
  const rampSeconds = parseInt(getParameter("rampSeconds", "120"), 10);
  const holdSeconds = parseInt(getParameter("holdSeconds", "600"), 10);
  const p95Ms = parseInt(getParameter("p95Ms", "2000"), 10);
  const maxFailPct = parseFloat(getParameter("maxFailPct", "1"));

  const httpProtocol = http
    .baseUrl(baseUrl)
    .acceptHeader("text/html,application/json;q=0.9,*/*;q=0.8")
    .acceptEncodingHeader("gzip, deflate, br")
    .userAgentHeader("vyoma-ott-loadtest/gatling");

  // Real course IDs exported from the database (resources/courses.csv)
  const courses = csv("courses.csv").random();

  // Weighted mix of what visitors do; weights add up to 100
  const browse = scenario("Browse")
    .feed(courses)
    .exec(
      randomSwitch().on(
        percent(25).then(http("home page").get("/").check(status().is(200))),
        percent(25).then(http("course page").get("/watch/#{courseId}").check(status().is(200))),
        percent(15).then(http("explore page").get("/explore").check(status().is(200))),
        percent(10).then(http("api features").get("/api/features").check(status().is(200))),
        percent(10).then(http("api navigation").get("/api/navigation?type=header").check(status().is(200))),
        percent(10).then(http("api auth status").get("/api/auth/status").check(status().is(200))),
        percent(5).then(http("health deep").get("/api/health?deep=1").check(status().is(200)))
      )
    );

  setUp(
    browse.injectOpen(
      rampUsersPerSec(1).to(rate).during(rampSeconds),
      constantUsersPerSec(rate).during(holdSeconds)
    )
  )
    .protocols(httpProtocol)
    .assertions(
      global().failedRequests().percent().lt(maxFailPct),
      global().responseTime().percentile(95).lt(p95Ms)
    );
});
