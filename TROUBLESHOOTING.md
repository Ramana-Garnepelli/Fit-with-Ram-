# Pay Now Button Troubleshooting Guide

## Issue Identified

**Problem**: Pay Now button returns 401 "Not authorized, user not found" error

**Root Cause**: The user's JWT token is valid, but the user doesn't exist in the database anymore. This happens because:
1. In-memory MongoDB resets when backend restarts
2. JWT tokens remain in browser localStorage
3. Auth middleware correctly rejects tokens for non-existent users

## Solution

### For Users (Quick Fix)

1. **Logout and Login Again**
   - Click "Logout" in the navbar
   - Login with your credentials
   - This will create a fresh user in the database and new token

2. **Clear Browser Storage**
   - Open browser console (F12)
   - Go to Application → Local Storage
   - Delete the `token` entry
   - Refresh the page and login again

### For Development (Permanent Fix)

**Option 1: Use Persistent MongoDB**

Replace in-memory MongoDB with a real MongoDB instance:

```javascript
// In backend/server.js
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitwithram';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err));
```

**Option 2: Add Token Validation**

Add better error handling in frontend:

```typescript
// In pricing/page.tsx - handlePhonePePayment function
const res = await fetch(`${apiUrl}/api/payment/phonepe/initiate`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ planId: selectedPlan._id })
});

if (res.status === 401) {
    // Token expired or user not found
    localStorage.removeItem('token');
    alert('Session expired. Please login again.');
    router.push('/login');
    return;
}
```

## Testing Steps

1. **Create Fresh User**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","phone":"9999999999","password":"Test@123"}'
```

2. **Copy the Token from Response**

3. **Test Payment Initiation**
```bash
curl -X POST http://localhost:5000/api/payment/phonepe/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"planId":"PLAN_ID_HERE"}'
```

4. **Expected Response**
```json
{
    "url": "https://mercury-uat.phonepe.com/transact/simulator?token=...",
    "merchantTransactionId": "MT1234567890"
}
```

## Current Status

✅ **Authentication System**: Working correctly
✅ **Payment Initiation API**: Working correctly  
✅ **Auth Middleware**: Working correctly  
⚠️ **Issue**: In-memory database resets cause user mismatch

## Recommendation for Production

Use MongoDB Atlas (persistent database) instead of in-memory MongoDB:

1. Create MongoDB Atlas account
2. Get connection string
3. Update `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fitwithram
   ```
4. Remove in-memory MongoDB fallback from `server.js`

This will ensure users persist across server restarts.
