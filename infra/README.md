# Vyoma OTT on AWS

Everything runs in **us-east-1**. Two CloudFormation stacks per environment:

| Stack | Template | Contains |
|---|---|---|
| `vyoma-ott-<env>-storage` | `ott-storage.yaml` | S3 buckets (media-source, media-delivery, user-uploads, backups), CloudFront (private S3 via OAC, signed URLs/cookies in prod), ECS task role |
| `vyoma-ott-<env>-app` | `ott-app.yaml` | VPC, load balancer, ECR, ECS Fargate service + auto scaling, RDS PostgreSQL (dev), Secrets Manager, CloudWatch logs/dashboard/alarms |

Create the storage stack first: the app stack imports its ECS task role.

```
users ──▶ ALB (HTTP/HTTPS) ──▶ ECS Fargate tasks (Next.js, 2..10) ──▶ RDS PostgreSQL
                                     │
                                     ├──▶ S3 (via task role)          CloudFront ──▶ S3 media-delivery
                                     └──▶ CloudWatch logs / metrics ──▶ alarms ──▶ SNS email
```

## Prerequisites (your machine)

- Docker
- AWS CLI v2, signed in: `aws login` (uses your console sign-in) or `aws configure`
- Check: `aws sts get-caller-identity` shows account `073942724844`

## 1. Storage stack

Already created for dev and prod. After template changes: CloudFormation → stack → **Update stack** →
**Replace existing template** → `ott-storage.yaml` → keep parameters → tick the IAM box → Submit.

## 2. App stack (first deploy, no image yet)

CloudFormation → Create stack → `ott-app.yaml`, stack name `vyoma-ott-dev-app`:

| Parameter | dev value |
|---|---|
| Env | `dev` |
| ImageTag | *(empty)* - the service starts with 0 tasks |
| DbAdminCidr | your IP + `/32` (`curl -s https://checkip.amazonaws.com`) - for schema setup and data import |
| AlarmEmail | team email for alarms |
| others | defaults |

Takes ~15 minutes (the database is the slow part). Then **confirm the SNS subscription email**.

## 3. Build and push the image

```bash
ACCOUNT=073942724844 REGION=us-east-1 ENV=dev
REPO=$ACCOUNT.dkr.ecr.$REGION.amazonaws.com/vyoma-ott-$ENV-web
TAG=$(git rev-parse --short HEAD)-$(date +%Y%m%d%H%M)

aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT.dkr.ecr.$REGION.amazonaws.com
docker build --platform linux/amd64 -t $REPO:$TAG .
docker push $REPO:$TAG
echo $TAG
```

## 4. Database schema and data (dev, first time)

```bash
DB_HOST=$(aws cloudformation describe-stacks --stack-name vyoma-ott-dev-app --query "Stacks[0].Outputs[?OutputKey=='DatabaseEndpoint'].OutputValue" --output text)
DB_PASS=$(aws secretsmanager get-secret-value --secret-id vyoma-ott/dev/db-master --query SecretString --output text | python3 -c 'import json,sys; print(json.load(sys.stdin)["password"])')
export DATABASE_URL="postgresql://vyoma:$DB_PASS@$DB_HOST:5432/vyoma_ott?schema=public&sslmode=require"

npx prisma db push                      # create tables

# copy data from the local database (docker container vyoma-ott-postgres)
docker exec vyoma-ott-postgres pg_dump -U vyoma -d vyoma_ott --data-only --no-owner \
  | docker run -i --rm postgres:17-alpine psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q
unset DATABASE_URL DB_PASS
```

Afterwards, remove the admin access: update the app stack with `DbAdminCidr` empty.

## 5. Start the service

Update the app stack (Use existing template) with `ImageTag=<tag from step 3>`. ECS starts 2 tasks;
the stack completes when they pass health checks (`/api/health`).

- Site: stack output `AppUrl`
- Deep health (includes DB): `<AppUrl>/api/health?deep=1`

**Deploying a new version:** build + push a new tag (step 3), update the stack with the new `ImageTag`.
A failed deployment rolls back automatically (deployment circuit breaker).

## 6. Monitoring

- Dashboard: stack output `DashboardUrl` - req/s, failure rate %, p50/p95/p99 latency, HTTP codes,
  healthy/running tasks, CPU/memory, database CPU/connections, recent error log lines.
- Logs: CloudWatch → Log groups → `/ecs/vyoma-ott-<env>-web` (or Logs Insights).
- Container Insights: CloudWatch → Container Insights → ECS cluster `vyoma-ott-<env>`.

### Alarms (email via SNS topic `vyoma-ott-<env>-alarms`)

| Alarm | Fires when |
|---|---|
| `failure-rate` | > 5% of requests return 5xx (2 of 3 minutes, minutes with >= 20 requests) |
| `no-healthy-tasks` | no healthy task behind the load balancer for 2 minutes (site down) |
| `unhealthy-tasks` | any task failing health checks for 3 minutes |
| `latency-p95` | p95 response time > 2 s (3 of 5 minutes) |
| `cpu-high` / `memory-high` | service average > 85% for 5 minutes |
| `db-cpu-high` / `db-storage-low` | DB CPU > 80% for 10 min / free storage < 2 GB |

Thresholds are stack parameters (`FailureRatePercent`, `LatencyP95Seconds`).

## 7. Load test (200 TPS)

See `../loadtest/README.md`.

## 8. Deployment pipeline (GitHub Actions)

`.github/workflows/deploy.yml`: build image → push to ECR → `aws cloudformation deploy` of
`ott-app.yaml` with the new `ImageTag` (keeps all other parameters) → waits for the ECS rollout
(circuit breaker rolls back a bad image) → checks `/api/health?deep=1`.

| Trigger | Deploys to |
|---|---|
| push to `master` | dev |
| Actions → Deploy → Run workflow | dev or prod (your choice) |

One-time setup:

1. **AWS**: create stack `vyoma-ott-cicd` from `ott-cicd.yaml` (tick the IAM box). If IAM → Identity
   providers already lists `token.actions.githubusercontent.com`, paste its ARN into
   `ExistingOidcProviderArn`; otherwise leave it empty. No AWS keys are stored in GitHub.
2. **GitHub** (repo Settings → Environments, needs repo admin): create environments `dev` and `prod`.
   Restrict both to the `master` branch; on `prod` add required reviewers.
3. The app stack must exist before the first pipeline run (step 2 above).

Not automated: database schema changes (`prisma db push`, step 4) and the storage stack.

## Costs (dev, approximate, per month)

ALB ~$18 + 2 Fargate tasks (1 vCPU / 2 GB) ~$72 + RDS db.t4g.small ~$25 + logs/metrics/Container
Insights ~$5-10 + S3/CloudFront by usage. A load test scales tasks up temporarily (pay per second).
