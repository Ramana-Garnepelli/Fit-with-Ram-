# Fit with Ram

A comprehensive fitness platform offering personalized workout and diet plans with integrated payment processing.

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
- Next.js 14 (App Router)
- React with TypeScript
- Tailwind CSS
- Framer Motion for animations

## Getting Started

### Prerequisites
- Node.js v14 or higher
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
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
PHONEPE_MERCHANT_ID=your_merchant_id
PHONEPE_SALT_KEY=your_salt_key
PHONEPE_SALT_INDEX=1
PHONEPE_ENV=UAT
```

Frontend (.env.local):
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

5. Run the development servers:

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to see the application.

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

Admin role is restricted to: `ramana.garnepelli16@gmail.com`

## License

Private - All rights reserved

## Contact

For support or inquiries, contact: [your-email]
