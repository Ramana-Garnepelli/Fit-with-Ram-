# FITWITHRAM platform architecture

## Product boundary

FITWITHRAM is a multi-tenant gym management platform. An organization owns its branches; branch-bound staff and members can access records only within their assigned organization and branch. The application starts as a modular monolith so payment, membership, attendance, and reporting workflows can use database transactions without cross-service coordination.

## Runtime services

- **Web:** React, TypeScript, Vite, React Router, Tailwind, and Material UI. The same application serves the public site and role-based portals.
- **API:** FastAPI under `/api/v1`, with Pydantic request/response schemas, SQLAlchemy repositories/services, and explicit authorization dependencies.
- **Database:** PostgreSQL. Alembic owns schema changes; every tenant-owned row carries an organization key and branch key where relevant.
- **Payments:** Razorpay order creation and signature/webhook verification run only on the API. Membership activation is idempotent and committed with the corresponding payment state.
- **Media and messaging:** Cloudinary and Resend are adapter integrations configured with server-side secrets.
- **Local runtime:** Docker Compose runs PostgreSQL, API, and web. Production hosting is a separate deploy target and requires account credentials and DNS access.

## Domain modules

`identity` and `authorization`; `organizations` and `branches`; `members` and `trainers`; `membership` and `payments`; `attendance` and `classes`; `workouts` and `progress`; `notifications`; `reporting`; `enquiries`; and `audit`.

Each module owns its API routes, schemas, services, and persistence models. Cross-module actions such as a verified payment activating a membership are orchestrated in application services and committed in one database transaction.

## Repository layout

```text
apps/
  api/
    app/
      api/v1/       versioned HTTP routes
      core/         settings, security, logging
      db/           SQLAlchemy base and sessions
      services/     payment, authorization, and workflow services
    alembic/        versioned database migrations
    tests/          pytest API and domain tests
  web/
    src/            Vite React application
infra/              deployment manifests and operations notes
docs/                architecture and production runbooks
```

The pre-existing `backend/` and `frontend/` folders are the prior Node/Next implementation. They are preserved while the replacement platform is built and migrated; Docker Compose and new application work use `apps/`.

## Local setup

1. Install Python 3.12 or 3.13, Node 22+, and Docker Compose.
2. Copy `.env.example` to `.env` and replace `SECRET_KEY` before using authentication.
3. Run `docker compose up --build` from the repository root.
4. Open the site at `http://localhost:5173`, API health at `http://localhost:8000/health`, and OpenAPI at `http://localhost:8000/docs`.

The current application includes member registration and login, protected member profiles, admin organization/branch/member/staff operations, membership plans and Razorpay order verification/webhooks, member workout plans and logs, progress tracking, class booking, and attendance check-in. See the API's `/docs` page for the active route contract. Some operational areas remain incremental; this is not yet an audited, production-launched service.
