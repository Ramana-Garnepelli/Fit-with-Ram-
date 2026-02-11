# Deployment Guide for Fit with Ram

This guide will help you deploy the Fit with Ram application to production.

## Prerequisites

Before deploying, ensure you have:
- [ ] PhonePe Production Merchant Account
- [ ] Domain name (fitwithram.com)
- [ ] GitHub account
- [ ] MongoDB Atlas account
- [ ] Vercel account (for frontend)
- [ ] Railway/Render account (for backend)

## Step 1: Push to GitHub

1. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Name it `fit-with-ram` or similar
   - Keep it private
   - Don't initialize with README (we already have one)

2. Add remote and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/fit-with-ram.git
git branch -M main
git push -u origin main
```

## Step 2: Set Up MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user
4. Whitelist all IPs (0.0.0.0/0) for production
5. Get your connection string:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Save this for later

## Step 3: Deploy Backend (Railway)

### Option A: Railway (Recommended)

1. Go to https://railway.app
2. Sign up/Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `fit-with-ram` repository
5. Select the `backend` folder as root directory
6. Add environment variables:
   ```
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=<your_mongodb_atlas_connection_string>
   JWT_SECRET=<generate_a_secure_random_string>
   FRONTEND_URL=https://fitwithram.com
   BACKEND_URL=<will_be_provided_after_deployment>
   PHONEPE_MERCHANT_ID=<your_production_merchant_id>
   PHONEPE_SALT_KEY=<your_production_salt_key>
   PHONEPE_SALT_INDEX=1
   PHONEPE_ENV=PRODUCTION
   ```
7. Deploy
8. Copy the deployment URL (e.g., `https://your-app.railway.app`)
9. Update `BACKEND_URL` environment variable with this URL

### Option B: Render

1. Go to https://render.com
2. Sign up/Login with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - Name: fit-with-ram-backend
   - Root Directory: backend
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Add environment variables (same as Railway)
7. Deploy

## Step 4: Deploy Frontend (Vercel)

1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Click "Add New" → "Project"
4. Import your `fit-with-ram` repository
5. Configure:
   - Framework Preset: Next.js
   - Root Directory: frontend
   - Build Command: `npm run build`
   - Output Directory: .next
6. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=<your_backend_url_from_step_3>
   ```
7. Deploy
8. Copy the deployment URL (e.g., `https://your-app.vercel.app`)

## Step 5: Configure Custom Domain

### On Vercel (Frontend)

1. Go to your project settings
2. Click "Domains"
3. Add `fitwithram.com` and `www.fitwithram.com`
4. Follow DNS configuration instructions

### DNS Configuration

Add these records to your domain registrar:

For `fitwithram.com`:
```
Type: A
Name: @
Value: 76.76.21.21 (Vercel's IP)
```

For `www.fitwithram.com`:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

For backend subdomain `api.fitwithram.com`:
```
Type: CNAME
Name: api
Value: <your-railway-or-render-domain>
```

### Update Backend URL

1. Go to Vercel project settings
2. Update environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://api.fitwithram.com
   ```
3. Redeploy

## Step 6: Update PhonePe Callback URLs

1. Log in to PhonePe Business Dashboard
2. Go to API Configuration
3. Update callback URLs:
   - Redirect URL: `https://fitwithram.com/payment/success`
   - Callback URL: `https://api.fitwithram.com/api/payment/phonepe/callback`

## Step 7: Test Production Payment

1. Visit https://fitwithram.com
2. Sign up with a test account
3. Select a plan
4. Complete payment with a small amount (₹1)
5. Verify successful redirection to dashboard
6. Check admin panel for payment record

## Step 8: Enable Monitoring (Optional but Recommended)

### Sentry for Error Tracking

1. Go to https://sentry.io
2. Create a new project
3. Install Sentry:
   ```bash
   # Backend
   cd backend
   npm install @sentry/node

   # Frontend
   cd frontend
   npm install @sentry/nextjs
   ```
4. Configure Sentry in your code
5. Add Sentry DSN to environment variables

## Security Checklist

- [ ] All environment variables are set correctly
- [ ] `.env` files are not committed to Git
- [ ] MongoDB has proper authentication
- [ ] CORS is configured for production domain only
- [ ] SSL certificates are active (automatic with Vercel/Railway)
- [ ] PhonePe production credentials are used
- [ ] Admin email restriction is in place
- [ ] JWT secret is strong and random

## Troubleshooting

### Payment Fails
- Check PhonePe callback URLs are correct
- Verify PhonePe production credentials
- Check backend logs for errors

### Database Connection Issues
- Verify MongoDB Atlas connection string
- Check IP whitelist settings
- Ensure database user has correct permissions

### CORS Errors
- Update `FRONTEND_URL` in backend environment
- Restart backend service

## Maintenance

### Updating the Application

1. Make changes locally
2. Test thoroughly
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
4. Vercel and Railway will auto-deploy

### Monitoring

- Check Railway/Render logs for backend errors
- Check Vercel logs for frontend errors
- Monitor MongoDB Atlas for database performance
- Review PhonePe dashboard for payment analytics

## Support

For issues or questions:
- Backend logs: Check Railway/Render dashboard
- Frontend logs: Check Vercel dashboard
- Database: Check MongoDB Atlas monitoring
- Payments: Check PhonePe Business dashboard
