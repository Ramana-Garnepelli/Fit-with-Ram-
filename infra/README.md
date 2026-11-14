# FITWITHRAM deployment

The repository is deployable as a web service, API service, and managed PostgreSQL database. The local Compose stack is running and verified at `http://localhost:5173`; the API is at `http://localhost:8000`. It is not publicly hosted. This workspace has no AWS/Vercel/Render CLI or cloud credentials, and the custom domain needs active DNS plus registrar access before it can point to production.

## AWS production layout

Use Amazon RDS for PostgreSQL, AWS App Runner (or ECS Fargate) for the FastAPI container, and an S3 private bucket behind CloudFront for the static Vite site. Add Route 53 records and ACM TLS certificates after domain ownership is verified. Publish the API image to ECR; use separate staging and production environments. Cloud account permissions and domain DNS access are required to provision these resources.

### 1. Provision PostgreSQL

Create an Amazon RDS PostgreSQL instance in private subnets with automated backups and encryption. Copy its **internal** connection URL into the API service as `DATABASE_URL`, using SQLAlchemy's psycopg URL form, for example `postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE`.

### 2. Deploy the API

Build and push `apps/api/Dockerfile` to ECR, then create an App Runner service (or ECS Fargate service) from that image:

- Root directory: repository root
- Runtime: Docker
- Dockerfile: `apps/api/Dockerfile`
- Health check path: `/health`
- Start command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Set `PYTHONPATH=/app/apps/api` if required by the selected container runtime.

Set `APP_ENV=production`, a unique random `SECRET_KEY` (at least 32 characters), the managed `DATABASE_URL`, and `WEB_ORIGINS` to the exact deployed Vercel origin as a JSON array, e.g. `["https://fitwithram.vercel.app"]`. Configure `PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET`, `PHONEPE_CLIENT_VERSION`, `PHONEPE_ENVIRONMENT=PRODUCTION`, `PHONEPE_WEBHOOK_USERNAME`, and `PHONEPE_WEBHOOK_PASSWORD` in the hosting secret manager after PhonePe production approval. Set `WEB_APP_URL` to the final HTTPS website origin. Configure Resend/Cloudinary keys only when those integrations are enabled. Run the one-time `app.scripts.bootstrap_super_admin` command through the platform shell after the first migration, with `BOOTSTRAP_ADMIN_PHONE`, `BOOTSTRAP_ADMIN_PASSWORD`, and `BOOTSTRAP_ADMIN_NAME` set as temporary secrets; `BOOTSTRAP_ADMIN_EMAIL` is optional for the requested phone-only account; use a new password, then remove it after success. Administrators can sign in by phone; the phone-only account does not have email password recovery, so change its password in the signed-in dashboard.

Verify both `https://<api-host>/health` and `https://<api-host>/ready` return success. Configure the PhonePe webhook URL as `https://<api-host>/api/v1/payments/phonepe/webhook` with matching webhook username/password. Complete PhonePe UAT sign-off and production credential activation before accepting live payments.

### 3. Deploy the web app

Build `apps/web` with the production API URL, upload `dist/` to a private S3 bucket, and serve it with CloudFront:

- Framework preset: Vite
- Root directory: `apps/web`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://<api-host>/api/v1`
- Environment variable: `VITE_ORGANIZATION_SLUG=<public-organization-slug>` (used to load the public branch selector and route contact enquiries)

After the CloudFront distribution is ready, set API `WEB_ORIGINS` to the final HTTPS website origin and redeploy the API.

### 4. Custom domain and operations

Configure Route 53 records for `fitwithram.com` only after confirming the domain is registered and its DNS is delegated to Route 53. Enable TLS, database backups, log retention, alerting, and a tested restore process. Use a separate staging database and PhonePe UAT credentials before accepting live payments. PhonePe settles into the merchant settlement account configured with PhonePe; setting a customer phone number only prefills their checkout contact. Set production secrets in the hosting secret manager; never commit them to `.env` or frontend variables (PhonePe secrets are server-side only).

## Local run

Copy `.env.example` to `.env`, replace the development secret, then run `docker compose up --build`. Docker Desktop must be running. Compose applies Alembic migrations and seeds a development-only `fitwithram` organization, `central` branch, and starter plans before the API starts. The seeder refuses to run when `APP_ENV=production`.

The public site is at `http://localhost:5173`; the API is at `http://localhost:8000` and OpenAPI docs at `http://localhost:8000/docs`. Use **Member sign in → Create an account** to register against the seeded branch. Registration creates a MEMBER account and opens its dashboard; sign out and sign in again with the same email/password to verify login. The contact form and public plan/location sections use the same seeded organization. Configure PhonePe UAT credentials in `.env` to enable payment checkout; payment creation remains unavailable without merchant credentials. Email delivery requires Resend credentials.

No default administrator credentials are created. To test the management portal, run `app.scripts.bootstrap_super_admin` once with `BOOTSTRAP_ADMIN_PHONE`, `BOOTSTRAP_ADMIN_NAME`, and a freshly generated `BOOTSTRAP_ADMIN_PASSWORD` of at least 12 characters. Sign in with that account, create a gym organization and owner from the SUPER_ADMIN workspace, then use the owner account for branch and staff management.

## Deployment status

No cloud resources, domain records, or production payment keys are managed by this repository. A deploy is complete only after deployment logs show successful Alembic migrations, `/ready` reports the database connected, a real sign-in works over HTTPS, a PhonePe UAT checkout and webhook complete, and a URL is recorded here.
