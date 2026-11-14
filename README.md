# Fit with Ram

A comprehensive fitness platform offering personalized workout and diet plans with integrated payment processing.

## Current multi-branch platform (React + FastAPI + PostgreSQL)

The current customer and gym-management application lives in `apps/web` and `apps/api`. To run it locally with PostgreSQL, Docker Desktop must be running:

```bash
cp .env.example .env
docker compose up --build
```

Open `http://localhost:5173`, select **Member sign in**, and use **Create an account**. The development Compose startup migrates the database and seeds the local `fitwithram` organization, `central` branch, and starter membership plans, so account creation can proceed directly into the member dashboard. API health is at `http://localhost:8000/health`, database readiness at `http://localhost:8000/ready`, and API docs at `http://localhost:8000/docs`. See [infra/README.md](infra/README.md) for administrator bootstrap and provider configuration.

The Next.js/PhonePe application under `frontend` and `backend` is the legacy app; the full multi-branch SaaS implementation is under `apps`.

## Features

- 🏋️ Multiple fitness programs (Muscle Building, Fat Loss, Strength Training)
- 💳 Integrated PhonePe payment gateway
- 👤 User dashboard with progress tracking
- 📊 Admin panel for user and plan management
- 🔐 Secure authentication and role-based access control
- 📱 Responsive design for all devices

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- PhonePe Payment Integration

### Frontend
- Next.js (App Router)
- React with TypeScript
- Tailwind CSS
- Framer Motion for animations

## Getting Started

### Prerequisites
- Node.js v20 or higher
- MongoDB (or MongoDB Atlas account)
- PhonePe Business Account (for payment integration)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Fit-with-Ram
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Set up environment variables:

Backend (.env):
```
PORT=5001
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5001
PHONEPE_MERCHANT_ID=your_phonepe_merchant_id
PHONEPE_SALT_KEY=your_phonepe_salt_key
PHONEPE_SALT_INDEX=your_phonepe_salt_index
PHONEPE_ENV=UAT
```

Frontend (.env.local):
```
NEXT_PUBLIC_API_URL=http://localhost:5001
```

PhonePe does not use mock credentials or simulated payments. Configure the merchant credentials issued to your PhonePe account. Use `UAT` with PhonePe test credentials while developing; set `PHONEPE_ENV=PROD` only with production credentials. Live payments also require a persistent MongoDB database and publicly reachable `FRONTEND_URL` and `BACKEND_URL` values so PhonePe can return customers and send callbacks. Never commit `.env` files or share merchant secrets in chat.

5. Run the development servers (run each command from its application directory):

Backend:
```bash
cd backend
PORT=5001 npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to see the application.
After a successful PhonePe payment, the application verifies the transaction with PhonePe, activates the purchased plan, and redirects the customer to the dashboard.

## Deployment

### Backend (Railway/Render)
1. Create a new project
2. Connect your Git repository
3. Set environment variables
4. Deploy

### Frontend (Vercel)
1. Import your Git repository
2. Set `NEXT_PUBLIC_API_URL` environment variable
3. Deploy

### Database (MongoDB Atlas)
1. Create a cluster
2. Get connection string
3. Update `MONGODB_URI` in backend environment variables

## Admin Access

Public sign-up always creates a customer account. To grant administrator access, first create the account, then run this one-time command from `backend` with `MONGODB_URI` and `ADMIN_EMAIL` set in the environment:

```bash
npm run admin:promote
```

This avoids granting admin privileges to someone who merely enters an administrator's email address during sign-up.

## License

Private - All rights reserved

## Contact

For support or inquiries, contact: [your-email]
